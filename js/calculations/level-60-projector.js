// Level 60 Projector
// Projects timeline to reach level 60 based on historical data

import { getAllLevelDurations } from './level-completion-projector.js';

/**
 * Project timeline to level 60
 * @param {Array} levelProgressions - Level progression history
 * @param {Object} user - User data
 * @returns {Object} Projection to level 60
 */
export function projectToLevel60(levelProgressions, user) {
    const currentLevel = user.data.level;
    const levelsRemaining = 60 - currentLevel;

    // Get historical data
    const completedLevels = getAllLevelDurations(levelProgressions);

    // If already at or past level 60
    if (currentLevel >= 60) {
        return {
            currentLevel,
            levelsRemaining: 0,
            isComplete: true,
            estimatedDate: null,
            estimatedDays: 0,
            milestones: [],
            confidence: 'high',
            historicalData: {
                completedLevels: completedLevels.length,
                averageDaysPerLevel: 0
            }
        };
    }

    // Calculate average pace from recent levels (prioritize recent data)
    const recentCount = Math.min(10, completedLevels.length);
    const recentLevels = completedLevels.slice(-recentCount);

    // If no historical data, return minimal projection
    if (recentLevels.length === 0) {
        return {
            currentLevel,
            levelsRemaining,
            isComplete: false,
            estimatedDate: null,
            estimatedDays: null,
            milestones: [],
            confidence: 'none',
            historicalData: {
                completedLevels: 0,
                averageDaysPerLevel: null
            },
            message: 'Complete more levels to get an accurate projection'
        };
    }

    // Calculate average days per level
    const totalDays = recentLevels.reduce((sum, level) => sum + level.duration, 0);
    const averageDaysPerLevel = totalDays / recentLevels.length;

    // Calculate standard deviation for confidence
    const stdDev = calculateStandardDeviation(recentLevels.map(l => l.duration));
    const coefficientOfVariation = stdDev / averageDaysPerLevel;

    // Determine confidence level
    let confidence;
    if (recentLevels.length >= 10 && coefficientOfVariation < 0.2) {
        confidence = 'high';
    } else if (recentLevels.length >= 5 && coefficientOfVariation < 0.4) {
        confidence = 'medium';
    } else if (recentLevels.length >= 3) {
        confidence = 'low';
    } else {
        confidence = 'very-low';
    }

    // Get current level start time
    const currentLevelStart = getCurrentLevelStartTime(levelProgressions, currentLevel);
    const daysSinceCurrentLevelStart = currentLevelStart
        ? Math.floor((Date.now() - currentLevelStart.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

    // Estimate days remaining for current level
    const daysRemainingCurrentLevel = Math.max(0, Math.ceil(averageDaysPerLevel - daysSinceCurrentLevelStart));

    // Total estimated days to level 60
    const estimatedDaysToLevel60 = daysRemainingCurrentLevel + (levelsRemaining - 1) * averageDaysPerLevel;
    const estimatedDate = new Date(Date.now() + estimatedDaysToLevel60 * 24 * 60 * 60 * 1000);

    // Calculate milestones (every 10 levels)
    const milestones = calculateMilestones(
        currentLevel,
        currentLevelStart,
        daysSinceCurrentLevelStart,
        averageDaysPerLevel,
        completedLevels
    );

    // Calculate fast-track scenario (if user maintains their fastest pace)
    const fastestRecentPace = Math.min(...recentLevels.map(l => l.duration));
    const fastTrackDays = daysRemainingCurrentLevel * (fastestRecentPace / averageDaysPerLevel) +
                          (levelsRemaining - 1) * fastestRecentPace;
    const fastTrackDate = new Date(Date.now() + fastTrackDays * 24 * 60 * 60 * 1000);

    // Calculate conservative scenario (if user slows to their slowest pace)
    const slowestRecentPace = Math.max(...recentLevels.map(l => l.duration));
    const conservativeDays = daysRemainingCurrentLevel * (slowestRecentPace / averageDaysPerLevel) +
                            (levelsRemaining - 1) * slowestRecentPace;
    const conservativeDate = new Date(Date.now() + conservativeDays * 24 * 60 * 60 * 1000);

    return {
        currentLevel,
        levelsRemaining,
        isComplete: false,
        estimatedDate,
        estimatedDays: Math.round(estimatedDaysToLevel60),
        milestones,
        confidence,
        historicalData: {
            completedLevels: completedLevels.length,
            recentLevelsAnalyzed: recentLevels.length,
            averageDaysPerLevel: Math.round(averageDaysPerLevel * 10) / 10,
            fastestPace: fastestRecentPace,
            slowestPace: slowestRecentPace,
            consistency: coefficientOfVariation
        },
        scenarios: {
            fastTrack: {
                days: Math.round(fastTrackDays),
                date: fastTrackDate,
                pacePerLevel: fastestRecentPace
            },
            expected: {
                days: Math.round(estimatedDaysToLevel60),
                date: estimatedDate,
                pacePerLevel: Math.round(averageDaysPerLevel * 10) / 10
            },
            conservative: {
                days: Math.round(conservativeDays),
                date: conservativeDate,
                pacePerLevel: slowestRecentPace
            }
        }
    };
}

/**
 * Calculate milestone projections
 */
function calculateMilestones(currentLevel, currentLevelStart, daysSinceStart, avgPace, completedLevels) {
    const milestones = [];
    const now = Date.now();

    // Milestones every 10 levels
    for (let milestone = Math.ceil(currentLevel / 10) * 10; milestone <= 60; milestone += 10) {
        if (milestone <= currentLevel) {
            // Past milestone - find actual date
            const milestoneLevel = completedLevels.find(l => l.level === milestone);
            if (milestoneLevel) {
                milestones.push({
                    level: milestone,
                    status: 'completed',
                    date: new Date(milestoneLevel.passedAt),
                    daysFromNow: null,
                    isPast: true
                });
            }
        } else {
            // Future milestone
            const levelsToMilestone = milestone - currentLevel;
            const daysRemainingCurrentLevel = Math.max(0, Math.ceil(avgPace - daysSinceStart));
            const estimatedDays = daysRemainingCurrentLevel + (levelsToMilestone - 1) * avgPace;
            const estimatedDate = new Date(now + estimatedDays * 24 * 60 * 60 * 1000);

            milestones.push({
                level: milestone,
                status: 'projected',
                date: estimatedDate,
                daysFromNow: Math.round(estimatedDays),
                isPast: false
            });
        }
    }

    return milestones;
}

/**
 * Get current level start time
 */
function getCurrentLevelStartTime(levelProgressions, currentLevel) {
    const currentLevelProgressions = levelProgressions.filter(
        lp => lp.data.level === currentLevel && !lp.data.abandoned_at
    );

    if (currentLevelProgressions.length === 0) {
        return null;
    }

    // Take most recent if multiple exist
    const mostRecent = currentLevelProgressions.sort((a, b) =>
        new Date(b.data.unlocked_at).getTime() - new Date(a.data.unlocked_at).getTime()
    )[0];

    return mostRecent.data.unlocked_at ? new Date(mostRecent.data.unlocked_at) : null;
}

/**
 * Calculate standard deviation
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
