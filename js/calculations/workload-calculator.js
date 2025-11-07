// Workload Calculator
// Calculates current and projected workload

import { SRS_CATEGORIES } from '../utils/constants.js';

/**
 * Calculate current workload
 * @param {Array} assignments - All assignments
 * @param {Object} summary - Summary data
 * @returns {Object} Workload statistics
 */
export function calculateWorkload(assignments, summary) {
    // Count Apprentice items (workload indicator)
    const apprenticeItems = assignments.filter(a => 
        SRS_CATEGORIES.APPRENTICE.includes(a.data.srs_stage)
    ).length;
    
    // Get lesson and review counts from summary
    const lessonsAvailable = summary?.data?.lessons?.[0]?.subject_ids?.length || 0;
    const reviewsAvailable = getCurrentReviews(summary);
    const reviewsNext1Hour = getReviewsInTimeframe(summary, 1);
    const reviewsNext4Hours = getReviewsInTimeframe(summary, 4);
    const reviewsNext24Hours = getReviewsInTimeframe(summary, 24);
    
    // Determine workload level
    let workloadLevel = 'light';
    let workloadScore = 0;
    
    // Score based on Apprentice items
    if (apprenticeItems > 150) {
        workloadScore += 3;
    } else if (apprenticeItems > 100) {
        workloadScore += 2;
    } else if (apprenticeItems > 50) {
        workloadScore += 1;
    }
    
    // Score based on current reviews
    if (reviewsAvailable > 200) {
        workloadScore += 3;
    } else if (reviewsAvailable > 100) {
        workloadScore += 2;
    } else if (reviewsAvailable > 50) {
        workloadScore += 1;
    }
    
    // Score based on upcoming reviews
    if (reviewsNext24Hours > 300) {
        workloadScore += 2;
    } else if (reviewsNext24Hours > 200) {
        workloadScore += 1;
    }
    
    // Determine level
    if (workloadScore >= 6) {
        workloadLevel = 'heavy';
    } else if (workloadScore >= 3) {
        workloadLevel = 'moderate';
    }
    
    return {
        apprenticeItems,
        lessonsAvailable,
        reviewsAvailable,
        reviewsNext1Hour,
        reviewsNext4Hours,
        reviewsNext24Hours,
        workloadLevel,
        workloadScore,
        recommendation: getWorkloadRecommendation(workloadLevel, apprenticeItems, lessonsAvailable)
    };
}

/**
 * Get current reviews from summary
 * @param {Object} summary - Summary data
 * @returns {number} Current review count
 */
function getCurrentReviews(summary) {
    if (!summary?.data?.reviews) {
        return 0;
    }
    
    const now = new Date();
    let count = 0;
    
    summary.data.reviews.forEach(review => {
        const availableAt = new Date(review.available_at);
        if (availableAt <= now) {
            count += review.subject_ids.length;
        }
    });
    
    return count;
}

/**
 * Get reviews in timeframe
 * @param {Object} summary - Summary data
 * @param {number} hours - Hours to look ahead
 * @returns {number} Review count
 */
function getReviewsInTimeframe(summary, hours) {
    if (!summary?.data?.reviews) {
        return 0;
    }
    
    const now = new Date();
    const future = new Date(now.getTime() + hours * 60 * 60 * 1000);
    let count = 0;
    
    summary.data.reviews.forEach(review => {
        const availableAt = new Date(review.available_at);
        if (availableAt > now && availableAt <= future) {
            count += review.subject_ids.length;
        }
    });
    
    return count;
}

/**
 * Get workload recommendation
 * @param {string} workloadLevel - Current workload level
 * @param {number} apprenticeItems - Count of Apprentice items
 * @param {number} lessonsAvailable - Count of available lessons
 * @returns {string} Recommendation
 */
function getWorkloadRecommendation(workloadLevel, apprenticeItems, lessonsAvailable) {
    if (workloadLevel === 'heavy') {
        return 'Your workload is heavy. Consider reducing lessons until Apprentice items are below 100.';
    } else if (workloadLevel === 'moderate') {
        if (apprenticeItems > 100) {
            return 'Moderate workload. Keep lessons steady or reduce slightly.';
        } else {
            return 'Moderate workload. You can continue with lessons at your current pace.';
        }
    } else {
        if (lessonsAvailable > 0 && apprenticeItems < 50) {
            return 'Light workload. You can safely increase your lesson pace.';
        } else if (lessonsAvailable > 0) {
            return 'Light workload. Continue with lessons at a comfortable pace.';
        } else {
            return 'Light workload. Great job keeping up with reviews!';
        }
    }
}

/**
 * Calculate sustainable lesson pace
 * @param {Array} assignments - All assignments
 * @param {Array} reviewStatistics - All review statistics
 * @returns {Object} Lesson pace recommendation
 */
export function calculateSustainableLessonPace(assignments, reviewStatistics) {
    const apprenticeCount = assignments.filter(a => 
        SRS_CATEGORIES.APPRENTICE.includes(a.data.srs_stage)
    ).length;
    
    // Calculate average accuracy
    const avgAccuracy = reviewStatistics.length > 0
        ? reviewStatistics.reduce((sum, stat) => sum + stat.data.percentage_correct, 0) / reviewStatistics.length
        : 85;
    
    let recommendedLessonsPerDay = 10;
    
    // Adjust based on Apprentice count
    if (apprenticeCount > 150) {
        recommendedLessonsPerDay = 0; // Stop lessons
    } else if (apprenticeCount > 120) {
        recommendedLessonsPerDay = 3;
    } else if (apprenticeCount > 100) {
        recommendedLessonsPerDay = 5;
    } else if (apprenticeCount > 80) {
        recommendedLessonsPerDay = 8;
    } else if (apprenticeCount < 50) {
        recommendedLessonsPerDay = 15;
    }
    
    // Adjust based on accuracy
    if (avgAccuracy < 75) {
        recommendedLessonsPerDay = Math.floor(recommendedLessonsPerDay * 0.7);
    } else if (avgAccuracy > 90) {
        recommendedLessonsPerDay = Math.ceil(recommendedLessonsPerDay * 1.2);
    }
    
    return {
        recommendedLessonsPerDay,
        currentApprenticeCount: apprenticeCount,
        averageAccuracy: avgAccuracy.toFixed(1),
        reasoning: getLessonPaceReasoning(apprenticeCount, avgAccuracy, recommendedLessonsPerDay)
    };
}

/**
 * Get lesson pace reasoning
 * @param {number} apprenticeCount - Apprentice item count
 * @param {number} accuracy - Average accuracy
 * @param {number} recommended - Recommended lessons per day
 * @returns {string} Reasoning
 */
function getLessonPaceReasoning(apprenticeCount, accuracy, recommended) {
    const parts = [];
    
    if (apprenticeCount > 120) {
        parts.push(`High Apprentice count (${apprenticeCount})`);
    } else if (apprenticeCount < 60) {
        parts.push(`Low Apprentice count (${apprenticeCount})`);
    }
    
    if (accuracy < 75) {
        parts.push('Lower accuracy - focus on reviews');
    } else if (accuracy > 90) {
        parts.push('High accuracy - can handle more');
    }
    
    if (parts.length === 0) {
        return `Based on your current progress, ${recommended} lessons per day is sustainable.`;
    }
    
    return `${parts.join(', ')}. Recommended: ${recommended} lessons per day.`;
}
