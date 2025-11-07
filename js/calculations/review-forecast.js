// Review Forecast Generator
// Generates forecasts of upcoming reviews

/**
 * Generate 24-hour review forecast from summary
 * @param {Object} summary - Summary data from API
 * @returns {Array} Hourly forecast
 */
export function generate24HourForecast(summary) {
    if (!summary || !summary.data || !summary.data.reviews) {
        return [];
    }
    
    const reviews = summary.data.reviews;
    const forecast = [];
    let cumulative = 0;
    
    reviews.forEach(review => {
        const availableAt = new Date(review.available_at);
        const count = review.subject_ids.length;
        cumulative += count;
        
        forecast.push({
            time: availableAt,
            hour: availableAt.getHours(),
            count: count,
            cumulative: cumulative,
            subjectIds: review.subject_ids
        });
    });
    
    return forecast;
}

/**
 * Get current reviews available
 * @param {Object} summary - Summary data from API
 * @returns {number} Count of available reviews
 */
export function getCurrentReviewCount(summary) {
    if (!summary || !summary.data || !summary.data.reviews) {
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
 * Get reviews in next X hours
 * @param {Object} summary - Summary data from API
 * @param {number} hours - Number of hours to look ahead
 * @returns {number} Count of reviews
 */
export function getReviewsInNextHours(summary, hours) {
    if (!summary || !summary.data || !summary.data.reviews) {
        return 0;
    }
    
    const now = new Date();
    const futureTime = new Date(now.getTime() + hours * 60 * 60 * 1000);
    let count = 0;
    
    summary.data.reviews.forEach(review => {
        const availableAt = new Date(review.available_at);
        if (availableAt > now && availableAt <= futureTime) {
            count += review.subject_ids.length;
        }
    });
    
    return count;
}

/**
 * Get next review time
 * @param {Object} summary - Summary data from API
 * @returns {Date|null} Time of next review
 */
export function getNextReviewTime(summary) {
    if (!summary || !summary.data || !summary.data.next_reviews_at) {
        return null;
    }
    
    return new Date(summary.data.next_reviews_at);
}

/**
 * Identify review "peaks" (hours with >50 reviews)
 * @param {Array} forecast - 24-hour forecast
 * @param {number} threshold - Count threshold (default 50)
 * @returns {Array} Peak hours
 */
export function identifyReviewPeaks(forecast, threshold = 50) {
    return forecast
        .filter(hour => hour.count >= threshold)
        .map(hour => ({
            time: hour.time,
            hour: hour.hour,
            count: hour.count
        }));
}

/**
 * Calculate average hourly review count
 * @param {Array} forecast - 24-hour forecast
 * @returns {number} Average reviews per hour
 */
export function calculateAverageHourlyReviews(forecast) {
    if (forecast.length === 0) {
        return 0;
    }
    
    const totalReviews = forecast.reduce((sum, hour) => sum + hour.count, 0);
    return Math.round(totalReviews / forecast.length);
}
