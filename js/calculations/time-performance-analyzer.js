// Time-of-Day Performance Analyzer
// Analyzes review accuracy by hour of day to identify optimal study times

/**
 * Analyze review performance by time of day
 * @param {Array} reviewStats - All review statistics
 * @returns {Object} Time-based performance analysis
 */
export function analyzeTimePerformance(reviewStats) {
    console.log('[TimePerformance] Analyzing', reviewStats.length, 'review stats');

    // Initialize hour buckets (0-23)
    const hourData = Array.from({ length: 24 }, (_, hour) => ({
        hour,
        correct: 0,
        incorrect: 0,
        total: 0,
        accuracy: 0
    }));

    // Parse review timestamps and group by hour
    reviewStats.forEach(stat => {
        if (!stat.data.created_at) return;

        const date = new Date(stat.data.created_at);
        const hour = date.getHours(); // 0-23

        const meaningCorrect = stat.data.meaning_correct || 0;
        const meaningIncorrect = stat.data.meaning_incorrect || 0;
        const readingCorrect = stat.data.reading_correct || 0;
        const readingIncorrect = stat.data.reading_incorrect || 0;

        const correct = meaningCorrect + readingCorrect;
        const incorrect = meaningIncorrect + readingIncorrect;

        hourData[hour].correct += correct;
        hourData[hour].incorrect += incorrect;
        hourData[hour].total += correct + incorrect;
    });

    // Calculate accuracy per hour
    hourData.forEach(data => {
        data.accuracy = data.total > 0
            ? parseFloat((data.correct / data.total * 100).toFixed(1))
            : 0;
    });

    // Filter out hours with no data
    const hoursWithData = hourData.filter(h => h.total > 0);

    if (hoursWithData.length === 0) {
        console.log('[TimePerformance] No review data with timestamps');
        return {
            hourData,
            hasData: false,
            bestHours: [],
            worstHours: [],
            averageAccuracy: 0,
            totalReviews: 0,
            recommendation: 'Not enough data to determine optimal study time.'
        };
    }

    // Calculate overall stats
    const totalReviews = hoursWithData.reduce((sum, h) => sum + h.total, 0);
    const totalCorrect = hoursWithData.reduce((sum, h) => sum + h.correct, 0);
    const averageAccuracy = parseFloat((totalCorrect / totalReviews * 100).toFixed(1));

    // Find best hours (top 3, minimum 20 reviews for reliability)
    const reliableHours = hoursWithData.filter(h => h.total >= 20);
    const bestHours = reliableHours.length > 0
        ? [...reliableHours]
            .sort((a, b) => b.accuracy - a.accuracy)
            .slice(0, 3)
        : [...hoursWithData]
            .sort((a, b) => b.accuracy - a.accuracy)
            .slice(0, 3);

    // Find worst hours (bottom 3, minimum 20 reviews for reliability)
    const worstHours = reliableHours.length > 0
        ? [...reliableHours]
            .sort((a, b) => a.accuracy - b.accuracy)
            .slice(0, 3)
        : [...hoursWithData]
            .sort((a, b) => a.accuracy - b.accuracy)
            .slice(0, 3);

    // Generate recommendation
    const recommendation = generateRecommendation(bestHours, worstHours, averageAccuracy);

    console.log('[TimePerformance] Analysis complete:', {
        hoursWithData: hoursWithData.length,
        totalReviews,
        averageAccuracy,
        bestHour: bestHours[0]?.hour,
        worstHour: worstHours[0]?.hour
    });

    return {
        hourData,
        hasData: true,
        bestHours,
        worstHours,
        averageAccuracy,
        totalReviews,
        recommendation,
        reliableDataThreshold: 20 // Minimum reviews per hour for reliable stats
    };
}

/**
 * Generate recommendation based on time performance
 * @param {Array} bestHours - Top performing hours
 * @param {Array} worstHours - Worst performing hours
 * @param {number} averageAccuracy - Overall average accuracy
 * @returns {string} Recommendation text
 */
function generateRecommendation(bestHours, worstHours, averageAccuracy) {
    if (bestHours.length === 0) {
        return 'Not enough data to determine optimal study time.';
    }

    const best = bestHours[0];
    const worst = worstHours[0];
    const bestTime = formatHourRange(best.hour);
    const worstTime = formatHourRange(worst.hour);

    // If there's a significant difference (>10% accuracy difference)
    if (best.accuracy - worst.accuracy > 10) {
        return `💡 You perform significantly better during ${bestTime} (${best.accuracy.toFixed(0)}% accuracy) compared to ${worstTime} (${worst.accuracy.toFixed(0)}% accuracy). Consider scheduling difficult reviews during your peak performance hours.`;
    }

    // If performance is fairly consistent
    if (best.accuracy - worst.accuracy < 5) {
        return `✅ Your accuracy is consistent throughout the day (${averageAccuracy.toFixed(0)}% average). You can review at any time that fits your schedule.`;
    }

    // Moderate difference
    return `📊 You tend to perform best during ${bestTime} (${best.accuracy.toFixed(0)}% accuracy). Try to schedule reviews during this time when possible.`;
}

/**
 * Format hour as readable time range
 * @param {number} hour - Hour (0-23)
 * @returns {string} Formatted time range
 */
function formatHourRange(hour) {
    const start = hour;
    const end = (hour + 1) % 24;

    const formatHour = (h) => {
        if (h === 0) return '12 AM';
        if (h === 12) return '12 PM';
        if (h < 12) return `${h} AM`;
        return `${h - 12} PM`;
    };

    return `${formatHour(start)}-${formatHour(end)}`;
}

/**
 * Get performance category for hour
 * @param {number} accuracy - Accuracy percentage
 * @param {number} average - Average accuracy across all hours
 * @returns {string} Category (excellent, good, average, poor)
 */
export function getPerformanceCategory(accuracy, average) {
    if (accuracy >= average + 5) return 'excellent';
    if (accuracy >= average) return 'good';
    if (accuracy >= average - 5) return 'average';
    return 'poor';
}

/**
 * Detect if user is a morning, afternoon, evening, or night person
 * @param {Array} bestHours - Top performing hours
 * @returns {Object} Time preference analysis
 */
export function detectTimePreference(bestHours) {
    if (bestHours.length === 0) {
        return { type: 'unknown', description: 'Not enough data' };
    }

    // Calculate average hour of best performance
    const avgBestHour = bestHours.reduce((sum, h) => sum + h.hour, 0) / bestHours.length;

    if (avgBestHour >= 5 && avgBestHour < 12) {
        return { type: 'morning', description: '🌅 Morning Person', emoji: '🌅' };
    } else if (avgBestHour >= 12 && avgBestHour < 17) {
        return { type: 'afternoon', description: '☀️ Afternoon Person', emoji: '☀️' };
    } else if (avgBestHour >= 17 && avgBestHour < 21) {
        return { type: 'evening', description: '🌆 Evening Person', emoji: '🌆' };
    } else {
        return { type: 'night', description: '🌙 Night Owl', emoji: '🌙' };
    }
}
