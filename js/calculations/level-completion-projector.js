// Level Completion Projector
// Predicts level completion time based on historical data

/**
 * Project level completion time
 * @param {Array} assignments - All assignments
 * @param {Array} levelProgressions - Level progression history
 * @param {Object} user - User data
 * @param {Array} subjects - All subjects (needed for level lookup)
 * @returns {Object} Projection statistics
 */
export function projectLevelCompletion(assignments, levelProgressions, user, subjects = []) {
    const currentLevel = user.data.level;

    // Get ALL kanji subjects for current level (including locked items)
    const allKanjiForLevel = subjects.filter(
        s => s.data.level === currentLevel && s.object === 'kanji'
    );

    // Get current level assignments to count how many are at Guru
    const levelAssignments = assignments.filter(assignment => {
        const subject = subjects.find(s => s.id === assignment.data.subject_id);
        return subject && subject.data.level === currentLevel;
    });

    const kanjiAtGuru = levelAssignments.filter(
        a => a.data.subject_type === 'kanji' && a.data.srs_stage >= 5
    ).length;
    const kanjiNeeded = Math.ceil(allKanjiForLevel.length * 0.9);
    const kanjiRemaining = Math.max(0, kanjiNeeded - kanjiAtGuru);
    
    // Calculate historical average
    const recentLevels = getRecentCompletedLevels(levelProgressions, 5);
    const averageDaysPerLevel = calculateAverageLevelDuration(recentLevels);

    console.log('[LevelProjection] Recent completed levels:', recentLevels);
    console.log('[LevelProjection] Average days per level:', averageDaysPerLevel);

    // Get current level start time - find the NON-ABANDONED progression for current level
    // If user reset their account, there may be multiple progressions for the same level
    const currentLevelProgressions = levelProgressions.filter(
        lp => lp.data.level === currentLevel && !lp.data.abandoned_at
    );

    // If multiple non-abandoned progressions exist (shouldn't happen but handle it), take the most recent
    const currentLevelProgression = currentLevelProgressions.length > 0
        ? currentLevelProgressions.sort((a, b) =>
            new Date(b.data.unlocked_at).getTime() - new Date(a.data.unlocked_at).getTime()
          )[0]
        : null;

    // Use unlocked_at (when level became available) instead of started_at (when first lesson was done)
    // This avoids gaps when user unlocked level but didn't start lessons immediately
    const currentLevelStart = currentLevelProgression?.data.unlocked_at
        ? new Date(currentLevelProgression.data.unlocked_at)
        : null;

    console.log('[LevelProjection] Found', currentLevelProgressions.length, 'non-abandoned progressions for level', currentLevel);
    console.log('[LevelProjection] Current level progression:', currentLevelProgression);
    console.log('[LevelProjection] Current level unlocked at:', currentLevelStart);
    
    let daysSinceLevelStart = null;
    let estimatedDaysRemaining = null;
    let estimatedCompletionDate = null;
    let projectionConfidence = 'low';
    
    if (currentLevelStart) {
        daysSinceLevelStart = Math.floor((Date.now() - currentLevelStart.getTime()) / (1000 * 60 * 60 * 24));
        
        if (averageDaysPerLevel > 0) {
            estimatedDaysRemaining = Math.max(0, Math.ceil(averageDaysPerLevel - daysSinceLevelStart));
            estimatedCompletionDate = new Date(Date.now() + estimatedDaysRemaining * 24 * 60 * 60 * 1000);
            
            // Determine confidence based on historical data consistency
            if (recentLevels.length >= 5) {
                const stdDev = calculateStandardDeviation(recentLevels.map(l => l.duration));
                const coefficientOfVariation = stdDev / averageDaysPerLevel;
                
                if (coefficientOfVariation < 0.2) {
                    projectionConfidence = 'high';
                } else if (coefficientOfVariation < 0.4) {
                    projectionConfidence = 'medium';
                } else {
                    projectionConfidence = 'low';
                }
            } else if (recentLevels.length >= 3) {
                projectionConfidence = 'medium';
            }
        }
    }
    
    // Calculate comparison to average
    let paceComparison = 'on-track';
    if (daysSinceLevelStart !== null && averageDaysPerLevel > 0) {
        if (daysSinceLevelStart < averageDaysPerLevel * 0.8) {
            paceComparison = 'faster';
        } else if (daysSinceLevelStart > averageDaysPerLevel * 1.2) {
            paceComparison = 'slower';
        }
    }
    
    return {
        currentLevel,
        kanjiProgress: {
            current: kanjiAtGuru,
            needed: kanjiNeeded,
            remaining: kanjiRemaining,
            percentage: allKanjiForLevel.length > 0 ? (kanjiAtGuru / kanjiNeeded * 100).toFixed(1) : 0
        },
        timing: {
            daysSinceLevelStart,
            averageDaysPerLevel: averageDaysPerLevel > 0 ? Math.round(averageDaysPerLevel) : null,
            estimatedDaysRemaining,
            estimatedCompletionDate,
            paceComparison
        },
        historicalData: {
            levelsAnalyzed: recentLevels.length,
            fastestLevel: recentLevels.length > 0 ? Math.min(...recentLevels.map(l => l.duration)) : null,
            slowestLevel: recentLevels.length > 0 ? Math.max(...recentLevels.map(l => l.duration)) : null
        },
        projectionConfidence
    };
}

/**
 * Get recent completed levels
 * @param {Array} levelProgressions - All level progressions
 * @param {number} count - Number of recent levels to get
 * @returns {Array} Recent level data with durations
 */
function getRecentCompletedLevels(levelProgressions, count) {
    const completed = levelProgressions
        // Only include completed (passed) levels that weren't abandoned (from resets)
        .filter(lp => lp.data.passed_at && lp.data.unlocked_at && !lp.data.abandoned_at)
        .map(lp => ({
            level: lp.data.level,
            unlockedAt: new Date(lp.data.unlocked_at),
            passedAt: new Date(lp.data.passed_at),
            // Use unlocked_at -> passed_at to include the full level duration (not just when lessons started)
            duration: calculateDuration(lp.data.unlocked_at, lp.data.passed_at)
        }))
        .sort((a, b) => b.level - a.level) // Sort by level descending
        .slice(0, count);

    return completed;
}

/**
 * Calculate duration between two dates in days
 * @param {string} startDate - Start date ISO string
 * @param {string} endDate - End date ISO string
 * @returns {number} Duration in days (rounded to nearest day)
 */
function calculateDuration(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    // Use Math.round for more accurate duration (not always rounding up)
    return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Calculate average level duration
 * @param {Array} levels - Level data with durations
 * @returns {number} Average duration in days
 */
function calculateAverageLevelDuration(levels) {
    if (levels.length === 0) {
        return 0;
    }
    
    const totalDays = levels.reduce((sum, level) => sum + level.duration, 0);
    return totalDays / levels.length;
}

/**
 * Calculate standard deviation
 * @param {Array<number>} values - Array of numbers
 * @returns {number} Standard deviation
 */
function calculateStandardDeviation(values) {
    if (values.length === 0) {
        return 0;
    }
    
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squareDiffs = values.map(val => Math.pow(val - avg, 2));
    const avgSquareDiff = squareDiffs.reduce((sum, val) => sum + val, 0) / values.length;
    return Math.sqrt(avgSquareDiff);
}

/**
 * Get all level durations
 * @param {Array} levelProgressions - All level progressions
 * @returns {Array} Level durations
 */
export function getAllLevelDurations(levelProgressions) {
    return levelProgressions
        // Only include completed (passed) levels that weren't abandoned (from resets)
        .filter(lp => lp.data.passed_at && lp.data.unlocked_at && !lp.data.abandoned_at)
        .map(lp => ({
            level: lp.data.level,
            // Use unlocked_at -> passed_at to include the full level duration (not just when lessons started)
            duration: calculateDuration(lp.data.unlocked_at, lp.data.passed_at),
            unlockedAt: lp.data.unlocked_at,
            passedAt: lp.data.passed_at
        }))
        .sort((a, b) => a.level - b.level);
}
