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

    // Get current level assignments by looking up subject levels
    const levelAssignments = assignments.filter(assignment => {
        const subject = subjects.find(s => s.id === assignment.data.subject_id);
        return subject && subject.data.level === currentLevel;
    });

    const kanji = levelAssignments.filter(a => a.data.subject_type === 'kanji');
    const kanjiAtGuru = kanji.filter(a => a.data.srs_stage >= 5).length;
    const kanjiNeeded = Math.ceil(kanji.length * 0.9);
    const kanjiRemaining = Math.max(0, kanjiNeeded - kanjiAtGuru);
    
    // Calculate historical average
    const recentLevels = getRecentCompletedLevels(levelProgressions, 5);
    const averageDaysPerLevel = calculateAverageLevelDuration(recentLevels);
    
    // Get current level start time
    const currentLevelProgression = levelProgressions.find(lp => lp.data.level === currentLevel);
    const currentLevelStart = currentLevelProgression?.data.started_at 
        ? new Date(currentLevelProgression.data.started_at)
        : null;
    
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
            percentage: kanji.length > 0 ? (kanjiAtGuru / kanjiNeeded * 100).toFixed(1) : 0
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
        .filter(lp => lp.data.passed_at && lp.data.started_at)
        .map(lp => ({
            level: lp.data.level,
            startedAt: new Date(lp.data.started_at),
            passedAt: new Date(lp.data.passed_at),
            duration: calculateDuration(lp.data.started_at, lp.data.passed_at)
        }))
        .sort((a, b) => b.level - a.level) // Sort by level descending
        .slice(0, count);
    
    return completed;
}

/**
 * Calculate duration between two dates in days
 * @param {string} startDate - Start date ISO string
 * @param {string} endDate - End date ISO string
 * @returns {number} Duration in days
 */
function calculateDuration(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
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
        .filter(lp => lp.data.passed_at && lp.data.started_at)
        .map(lp => ({
            level: lp.data.level,
            duration: calculateDuration(lp.data.started_at, lp.data.passed_at),
            startedAt: lp.data.started_at,
            passedAt: lp.data.passed_at
        }))
        .sort((a, b) => a.level - b.level);
}
