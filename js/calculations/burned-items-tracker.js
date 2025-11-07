// Burned Items Tracker
// Tracks burned items and milestones

import { SRS_STAGES } from '../utils/constants.js';

/**
 * Calculate burned items statistics
 * @param {Array} assignments - All assignments
 * @returns {Object} Burned items statistics
 */
export function calculateBurnedStats(assignments) {
    const burnedAssignments = assignments.filter(a => a.data.srs_stage === SRS_STAGES.BURNED);
    
    // Count by type
    const byType = {
        radical: burnedAssignments.filter(a => a.data.subject_type === 'radical').length,
        kanji: burnedAssignments.filter(a => a.data.subject_type === 'kanji').length,
        vocabulary: burnedAssignments.filter(a => a.data.subject_type === 'vocabulary').length,
        kana_vocabulary: burnedAssignments.filter(a => a.data.subject_type === 'kana_vocabulary').length
    };
    
    const total = burnedAssignments.length;
    
    // Calculate percentage of total items
    const totalAssignments = assignments.length;
    const percentage = totalAssignments > 0
        ? (total / totalAssignments * 100).toFixed(1)
        : 0;
    
    // Calculate burn rate (items burned per day on average)
    const burnRate = calculateBurnRate(burnedAssignments);
    
    // Find next milestone
    const nextMilestone = getNextMilestone(total);
    const itemsToNextMilestone = nextMilestone - total;
    
    // Estimate days to next milestone
    const daysToNextMilestone = burnRate > 0
        ? Math.ceil(itemsToNextMilestone / burnRate)
        : null;
    
    return {
        total,
        byType,
        percentage: parseFloat(percentage),
        burnRate,
        nextMilestone,
        itemsToNextMilestone,
        daysToNextMilestone,
        recentlyBurned: getRecentlyBurnedCount(burnedAssignments, 7) // Last 7 days
    };
}

/**
 * Calculate burn rate (items per day)
 * @param {Array} burnedAssignments - Burned assignments
 * @returns {number} Items burned per day
 */
function calculateBurnRate(burnedAssignments) {
    if (burnedAssignments.length === 0) {
        return 0;
    }
    
    // Get burned items from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentBurns = burnedAssignments.filter(a => {
        if (!a.data.burned_at) return false;
        const burnedAt = new Date(a.data.burned_at);
        return burnedAt >= thirtyDaysAgo;
    });
    
    if (recentBurns.length === 0) {
        return 0;
    }
    
    // Calculate daily average
    return (recentBurns.length / 30).toFixed(2);
}

/**
 * Get recently burned count
 * @param {Array} burnedAssignments - Burned assignments
 * @param {number} days - Number of days to look back
 * @returns {number} Count of recently burned items
 */
function getRecentlyBurnedCount(burnedAssignments, days) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return burnedAssignments.filter(a => {
        if (!a.data.burned_at) return false;
        const burnedAt = new Date(a.data.burned_at);
        return burnedAt >= cutoffDate;
    }).length;
}

/**
 * Get next milestone
 * @param {number} current - Current burned count
 * @returns {number} Next milestone
 */
function getNextMilestone(current) {
    const milestones = [10, 25, 50, 100, 250, 500, 750, 1000, 1500, 2000, 2500, 3000, 4000, 5000, 6000, 7000, 8000, 9000];
    
    for (const milestone of milestones) {
        if (current < milestone) {
            return milestone;
        }
    }
    
    // If past all milestones, next is current rounded up to nearest 1000
    return Math.ceil((current + 1) / 1000) * 1000;
}

/**
 * Get items at Enlightened (one step before burned)
 * @param {Array} assignments - All assignments
 * @returns {Array} Enlightened items
 */
export function getEnlightenedItems(assignments) {
    return assignments.filter(a => a.data.srs_stage === SRS_STAGES.ENLIGHTENED);
}

/**
 * Calculate projected total burn date
 * @param {Array} assignments - All assignments
 * @param {number} burnRate - Current burn rate per day
 * @returns {Object|null} Projection
 */
export function projectTotalBurnDate(assignments, burnRate) {
    if (burnRate <= 0) {
        return null;
    }
    
    const totalItems = assignments.length;
    const burnedItems = assignments.filter(a => a.data.srs_stage === SRS_STAGES.BURNED).length;
    const remainingItems = totalItems - burnedItems;
    
    const daysToComplete = Math.ceil(remainingItems / burnRate);
    const projectedDate = new Date();
    projectedDate.setDate(projectedDate.getDate() + daysToComplete);
    
    return {
        totalItems,
        burnedItems,
        remainingItems,
        daysToComplete,
        projectedDate
    };
}
