// Accuracy Analyzer
// Analyzes review accuracy patterns

/**
 * Calculate overall accuracy statistics
 * @param {Array} reviewStatistics - All review statistics
 * @returns {Object} Accuracy statistics
 */
export function calculateAccuracyStats(reviewStatistics) {
    if (reviewStatistics.length === 0) {
        return {
            overall: 0,
            meaning: 0,
            reading: 0,
            byType: {},
            total: 0
        };
    }
    
    // Calculate overall accuracy
    const totalCorrect = reviewStatistics.reduce((sum, stat) => {
        return sum + stat.data.meaning_correct + stat.data.reading_correct;
    }, 0);
    
    const totalIncorrect = reviewStatistics.reduce((sum, stat) => {
        return sum + stat.data.meaning_incorrect + stat.data.reading_incorrect;
    }, 0);
    
    const totalAttempts = totalCorrect + totalIncorrect;
    const overallAccuracy = totalAttempts > 0 
        ? (totalCorrect / totalAttempts * 100).toFixed(1)
        : 0;
    
    // Calculate meaning vs reading accuracy
    const totalMeaningCorrect = reviewStatistics.reduce((sum, stat) => sum + stat.data.meaning_correct, 0);
    const totalMeaningIncorrect = reviewStatistics.reduce((sum, stat) => sum + stat.data.meaning_incorrect, 0);
    const totalMeaningAttempts = totalMeaningCorrect + totalMeaningIncorrect;
    const meaningAccuracy = totalMeaningAttempts > 0
        ? (totalMeaningCorrect / totalMeaningAttempts * 100).toFixed(1)
        : 0;
    
    const totalReadingCorrect = reviewStatistics.reduce((sum, stat) => sum + stat.data.reading_correct, 0);
    const totalReadingIncorrect = reviewStatistics.reduce((sum, stat) => sum + stat.data.reading_incorrect, 0);
    const totalReadingAttempts = totalReadingCorrect + totalReadingIncorrect;
    const readingAccuracy = totalReadingAttempts > 0
        ? (totalReadingCorrect / totalReadingAttempts * 100).toFixed(1)
        : 0;
    
    // Calculate accuracy by type
    const byType = {};
    const types = ['radical', 'kanji', 'vocabulary', 'kana_vocabulary'];
    
    types.forEach(type => {
        const typeStats = reviewStatistics.filter(stat => stat.data.subject_type === type);
        
        if (typeStats.length > 0) {
            const typeCorrect = typeStats.reduce((sum, stat) => {
                return sum + stat.data.meaning_correct + stat.data.reading_correct;
            }, 0);
            
            const typeIncorrect = typeStats.reduce((sum, stat) => {
                return sum + stat.data.meaning_incorrect + stat.data.reading_incorrect;
            }, 0);
            
            const typeTotal = typeCorrect + typeIncorrect;
            
            byType[type] = {
                accuracy: typeTotal > 0 ? parseFloat((typeCorrect / typeTotal * 100).toFixed(1)) : 0,
                total: typeStats.length,
                correct: typeCorrect,
                incorrect: typeIncorrect
            };
        }
    });
    
    return {
        overall: parseFloat(overallAccuracy),
        meaning: parseFloat(meaningAccuracy),
        reading: parseFloat(readingAccuracy),
        byType,
        total: reviewStatistics.length,
        totalAttempts
    };
}

/**
 * Get items below accuracy threshold
 * @param {Array} reviewStatistics - All review statistics
 * @param {number} threshold - Accuracy threshold (default 75)
 * @returns {Array} Items below threshold
 */
export function getItemsBelowAccuracy(reviewStatistics, threshold = 75) {
    return reviewStatistics
        .filter(stat => stat.data.percentage_correct < threshold)
        .map(stat => ({
            id: stat.id,
            subject_id: stat.data.subject_id,
            subject_type: stat.data.subject_type,
            accuracy: stat.data.percentage_correct,
            meaning_correct: stat.data.meaning_correct,
            meaning_incorrect: stat.data.meaning_incorrect,
            reading_correct: stat.data.reading_correct,
            reading_incorrect: stat.data.reading_incorrect,
            total_attempts: stat.data.meaning_correct + stat.data.meaning_incorrect + 
                           stat.data.reading_correct + stat.data.reading_incorrect
        }))
        .sort((a, b) => a.accuracy - b.accuracy);
}

/**
 * Calculate accuracy by level
 * @param {Array} reviewStatistics - All review statistics
 * @param {Array} subjects - All subjects for level lookup
 * @returns {Object} Accuracy by level
 */
export function calculateAccuracyByLevel(reviewStatistics, subjects) {
    const accuracyByLevel = {};
    
    reviewStatistics.forEach(stat => {
        const subject = subjects.find(s => s.id === stat.data.subject_id);
        if (!subject) return;
        
        const level = subject.data.level;
        
        if (!accuracyByLevel[level]) {
            accuracyByLevel[level] = {
                correct: 0,
                incorrect: 0,
                total: 0
            };
        }
        
        accuracyByLevel[level].correct += stat.data.meaning_correct + stat.data.reading_correct;
        accuracyByLevel[level].incorrect += stat.data.meaning_incorrect + stat.data.reading_incorrect;
        accuracyByLevel[level].total++;
    });
    
    // Calculate percentages
    Object.keys(accuracyByLevel).forEach(level => {
        const data = accuracyByLevel[level];
        const totalAttempts = data.correct + data.incorrect;
        data.accuracy = totalAttempts > 0 
            ? parseFloat((data.correct / totalAttempts * 100).toFixed(1))
            : 0;
    });
    
    return accuracyByLevel;
}

/**
 * Identify items with declining accuracy
 * @param {Array} reviewStatistics - All review statistics
 * @returns {Array} Items with lost streaks
 */
export function getItemsWithLostStreaks(reviewStatistics) {
    return reviewStatistics
        .filter(stat => {
            const meaningStreakLoss = stat.data.meaning_max_streak - stat.data.meaning_current_streak;
            const readingStreakLoss = stat.data.reading_max_streak - stat.data.reading_current_streak;
            return meaningStreakLoss > 3 || readingStreakLoss > 3;
        })
        .map(stat => ({
            subject_id: stat.data.subject_id,
            subject_type: stat.data.subject_type,
            accuracy: stat.data.percentage_correct,
            meaningStreakLoss: stat.data.meaning_max_streak - stat.data.meaning_current_streak,
            readingStreakLoss: stat.data.reading_max_streak - stat.data.reading_current_streak
        }))
        .sort((a, b) => {
            const aLoss = Math.max(a.meaningStreakLoss, a.readingStreakLoss);
            const bLoss = Math.max(b.meaningStreakLoss, b.readingStreakLoss);
            return bLoss - aLoss;
        });
}
