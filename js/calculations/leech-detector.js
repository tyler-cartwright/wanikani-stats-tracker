// Leech Detection System
// Identifies and analyzes problematic items (leeches)

import { getSubjectById, getSubjectsByIds } from '../api/subjects.js';
import { getAssignmentBySubjectId } from '../api/assignments.js';

/**
 * Identify all leeches from review statistics
 * @param {Array} reviewStatistics - All review statistics
 * @param {Object} options - Detection options
 * @returns {Promise<Array>} Array of leech objects
 */
export async function identifyLeeches(reviewStatistics, options = {}) {
    const {
        accuracyThreshold = 75,
        minReviews = 10,
        streakLossThreshold = 5
    } = options;

    const leeches = [];

    for (const stat of reviewStatistics) {
        const accuracy = stat.data.percentage_correct;
        const totalReviews = stat.data.meaning_correct + stat.data.meaning_incorrect + 
                            stat.data.reading_correct + stat.data.reading_incorrect;

        // Check if item meets leech criteria
        if (accuracy < accuracyThreshold && totalReviews >= minReviews) {
            const meaningStreakLoss = stat.data.meaning_max_streak - stat.data.meaning_current_streak;
            const readingStreakLoss = stat.data.reading_max_streak - stat.data.reading_current_streak;
            const maxStreakLoss = Math.max(meaningStreakLoss, readingStreakLoss);

            const leech = {
                id: stat.id,
                subject_id: stat.data.subject_id,
                subject_type: stat.data.subject_type,
                accuracy: accuracy,
                totalReviews: totalReviews,
                meaningAccuracy: calculateComponentAccuracy(
                    stat.data.meaning_correct,
                    stat.data.meaning_incorrect
                ),
                readingAccuracy: calculateComponentAccuracy(
                    stat.data.reading_correct,
                    stat.data.reading_incorrect
                ),
                streakLoss: maxStreakLoss,
                meaningStreakLoss: meaningStreakLoss,
                readingStreakLoss: readingStreakLoss,
                meaningCorrect: stat.data.meaning_correct,
                meaningIncorrect: stat.data.meaning_incorrect,
                readingCorrect: stat.data.reading_correct,
                readingIncorrect: stat.data.reading_incorrect
            };

            leeches.push(leech);
        }
    }

    console.log(`[LeechDetector] Identified ${leeches.length} leeches`);
    return leeches;
}

/**
 * Calculate accuracy for a component (meaning or reading)
 * @param {number} correct - Correct count
 * @param {number} incorrect - Incorrect count
 * @returns {number} Accuracy percentage
 */
function calculateComponentAccuracy(correct, incorrect) {
    const total = correct + incorrect;
    return total > 0 ? (correct / total * 100) : 100;
}

/**
 * Calculate severity score for a leech
 * @param {Object} leech - Leech object
 * @returns {number} Severity score (0-100)
 */
export function calculateLeechSeverity(leech) {
    // Accuracy score component (0-1, lower accuracy = higher score)
    const accuracyScore = (100 - leech.accuracy) / 100;

    // Review volume score component (0-1, normalized to max 50 reviews)
    const maxReviews = 50;
    const volumeScore = Math.min(leech.totalReviews / maxReviews, 1);

    // Streak loss score component (0-1, normalized to max 20 loss)
    const maxStreakLoss = 20;
    const streakScore = Math.min(leech.streakLoss / maxStreakLoss, 1);

    // Weighted combination
    const weights = {
        accuracy: 0.5,
        volume: 0.3,
        streak: 0.2
    };

    const combinedScore = (
        accuracyScore * weights.accuracy +
        volumeScore * weights.volume +
        streakScore * weights.streak
    );

    // Scale to 0-100
    const severity = Math.round(combinedScore * 100);

    return severity;
}

/**
 * Categorize leech severity
 * @param {number} severity - Severity score (0-100)
 * @returns {string} Category: 'mild', 'moderate', or 'severe'
 */
export function categorizeLeechSeverity(severity) {
    if (severity >= 80) return 'severe';
    if (severity >= 65) return 'moderate';
    return 'mild';
}

/**
 * Add severity scores to leeches
 * @param {Array} leeches - Array of leech objects
 * @returns {Array} Leeches with severity scores
 */
export function scoreAllLeeches(leeches) {
    return leeches.map(leech => {
        const severity = calculateLeechSeverity(leech);
        return {
            ...leech,
            severity,
            severityCategory: categorizeLeechSeverity(severity)
        };
    }).sort((a, b) => b.severity - a.severity); // Sort by severity descending
}

/**
 * Detect confusion pairs among leeches
 * @param {Array} leeches - Array of leech objects with subject data
 * @param {Array} subjects - All subjects
 * @returns {Promise<Array>} Array of confusion pair objects
 */
export async function detectConfusionPairs(leeches, subjects) {
    const confusionPairs = [];
    const processedPairs = new Set();

    for (const leech of leeches) {
        const subject = subjects.find(s => s.id === leech.subject_id);
        if (!subject || !subject.data.visually_similar_subject_ids) {
            continue;
        }

        // Check each visually similar subject
        for (const similarId of subject.data.visually_similar_subject_ids) {
            // Check if this subject is also a leech
            const similarLeech = leeches.find(l => l.subject_id === similarId);
            
            if (similarLeech) {
                // Create unique pair ID (sorted to avoid duplicates)
                const pairId = [leech.subject_id, similarId].sort().join('-');
                
                if (!processedPairs.has(pairId)) {
                    processedPairs.add(pairId);
                    
                    const similarSubject = subjects.find(s => s.id === similarId);
                    
                    confusionPairs.push({
                        pairId,
                        subject1: {
                            id: leech.subject_id,
                            data: subject,
                            leech: leech
                        },
                        subject2: {
                            id: similarId,
                            data: similarSubject,
                            leech: similarLeech
                        },
                        combinedSeverity: leech.severity + similarLeech.severity
                    });
                }
            }
        }
    }

    // Sort by combined severity
    confusionPairs.sort((a, b) => b.combinedSeverity - a.combinedSeverity);

    console.log(`[LeechDetector] Found ${confusionPairs.length} confusion pairs`);
    return confusionPairs;
}

/**
 * Identify confusion clusters (3+ mutually confusing items)
 * @param {Array} confusionPairs - Array of confusion pair objects
 * @returns {Array} Array of confusion clusters
 */
export function identifyConfusionClusters(confusionPairs) {
    // Build adjacency map
    const adjacencyMap = new Map();
    
    confusionPairs.forEach(pair => {
        const id1 = pair.subject1.id;
        const id2 = pair.subject2.id;
        
        if (!adjacencyMap.has(id1)) adjacencyMap.set(id1, new Set());
        if (!adjacencyMap.has(id2)) adjacencyMap.set(id2, new Set());
        
        adjacencyMap.get(id1).add(id2);
        adjacencyMap.get(id2).add(id1);
    });

    // Find clusters (connected components with 3+ nodes)
    const visited = new Set();
    const clusters = [];

    adjacencyMap.forEach((neighbors, nodeId) => {
        if (visited.has(nodeId)) return;
        
        // BFS to find connected component
        const cluster = new Set();
        const queue = [nodeId];
        
        while (queue.length > 0) {
            const current = queue.shift();
            if (visited.has(current)) continue;
            
            visited.add(current);
            cluster.add(current);
            
            const currentNeighbors = adjacencyMap.get(current);
            if (currentNeighbors) {
                currentNeighbors.forEach(neighbor => {
                    if (!visited.has(neighbor)) {
                        queue.push(neighbor);
                    }
                });
            }
        }
        
        // Only keep clusters with 3+ items
        if (cluster.size >= 3) {
            clusters.push(Array.from(cluster));
        }
    });

    console.log(`[LeechDetector] Found ${clusters.length} confusion clusters`);
    return clusters;
}

/**
 * Analyze component dependencies for leeches
 * @param {Array} leeches - Array of leech objects
 * @param {Array} subjects - All subjects
 * @param {Array} assignments - All assignments
 * @returns {Promise<Array>} Leeches with component analysis
 */
export async function analyzeLeechComponents(leeches, subjects, assignments) {
    const leechesWithComponents = [];

    for (const leech of leeches) {
        const subject = subjects.find(s => s.id === leech.subject_id);
        if (!subject) continue;

        const componentAnalysis = {
            hasProblematicComponents: false,
            problematicComponents: []
        };

        // For kanji, check component radicals
        if (subject.object === 'kanji' && subject.data.component_subject_ids) {
            for (const componentId of subject.data.component_subject_ids) {
                const componentLeech = leeches.find(l => l.subject_id === componentId);
                if (componentLeech) {
                    const componentSubject = subjects.find(s => s.id === componentId);
                    componentAnalysis.hasProblematicComponents = true;
                    componentAnalysis.problematicComponents.push({
                        id: componentId,
                        type: componentSubject?.object,
                        leech: componentLeech
                    });
                }
            }
        }

        // For vocabulary, check component kanji
        if (subject.object === 'vocabulary' && subject.data.component_subject_ids) {
            for (const componentId of subject.data.component_subject_ids) {
                const componentLeech = leeches.find(l => l.subject_id === componentId);
                if (componentLeech) {
                    const componentSubject = subjects.find(s => s.id === componentId);
                    componentAnalysis.hasProblematicComponents = true;
                    componentAnalysis.problematicComponents.push({
                        id: componentId,
                        type: componentSubject?.object,
                        leech: componentLeech
                    });
                }
            }
        }

        leechesWithComponents.push({
            ...leech,
            componentAnalysis
        });
    }

    return leechesWithComponents;
}

/**
 * Identify root cause components (radicals affecting many kanji)
 * @param {Array} leechesWithComponents - Leeches with component analysis
 * @param {Array} subjects - All subjects
 * @returns {Array} Root cause components
 */
export function identifyRootCauseComponents(leechesWithComponents, subjects) {
    const componentImpactMap = new Map();

    // Count how many leeches each component affects
    leechesWithComponents.forEach(leech => {
        if (leech.componentAnalysis.problematicComponents.length > 0) {
            leech.componentAnalysis.problematicComponents.forEach(component => {
                const count = componentImpactMap.get(component.id) || 0;
                componentImpactMap.set(component.id, count + 1);
            });
        }
    });

    // Filter to components affecting 3+ leeches
    const rootCauses = [];
    componentImpactMap.forEach((affectedCount, componentId) => {
        if (affectedCount >= 3) {
            const subject = subjects.find(s => s.id === componentId);
            const leech = leechesWithComponents.find(l => l.subject_id === componentId);
            
            rootCauses.push({
                id: componentId,
                subject: subject,
                leech: leech,
                affectedLeechCount: affectedCount
            });
        }
    });

    // Sort by impact (most affected first)
    rootCauses.sort((a, b) => b.affectedLeechCount - a.affectedLeechCount);

    console.log(`[LeechDetector] Found ${rootCauses.length} root cause components`);
    return rootCauses;
}

/**
 * Generate recommendations for a leech
 * @param {Object} leech - Leech object with component analysis
 * @param {Object} subject - Subject data
 * @param {Array} confusionPairs - All confusion pairs
 * @returns {Object} Recommendation object
 */
export function generateLeechRecommendations(leech, subject, confusionPairs = []) {
    const recommendations = {
        priority: leech.severity >= 80 ? 'high' : leech.severity >= 65 ? 'medium' : 'low',
        focus: [],
        actions: [],
        studyTips: []
    };

    // Determine focus area (meaning vs reading)
    if (subject.object !== 'radical') {
        if (leech.readingAccuracy < leech.meaningAccuracy) {
            recommendations.focus.push('reading');
            recommendations.studyTips.push('Focus on reading practice - your reading accuracy is lower than meaning');
            
            if (subject.data.readings) {
                recommendations.actions.push('Review all reading variations carefully');
                recommendations.actions.push('Practice writing the reading in hiragana/katakana');
            }
        } else if (leech.meaningAccuracy < leech.readingAccuracy) {
            recommendations.focus.push('meaning');
            recommendations.studyTips.push('Focus on meaning - your meaning accuracy is lower than reading');
            recommendations.actions.push('Create a memorable mnemonic for the meaning');
        } else {
            recommendations.focus.push('both');
            recommendations.studyTips.push('Both reading and meaning need attention');
        }
    } else {
        recommendations.focus.push('meaning');
    }

    // Check for component issues
    if (leech.componentAnalysis?.hasProblematicComponents) {
        recommendations.studyTips.push('⚠️ Some component parts are also leeches - study them first!');
        recommendations.actions.push('Review component radicals/kanji separately');
        recommendations.priority = 'high'; // Upgrade priority
    }

    // Check for confusion pairs
    const relatedConfusion = confusionPairs.filter(
        pair => pair.subject1.id === leech.subject_id || pair.subject2.id === leech.subject_id
    );
    
    if (relatedConfusion.length > 0) {
        recommendations.studyTips.push('⚠️ This item is visually similar to other leeches');
        recommendations.actions.push('Study the differences between similar-looking items');
        recommendations.actions.push('Create comparative mnemonics highlighting differences');
    }

    // General recommendations based on severity
    if (leech.severity >= 80) {
        recommendations.actions.push('Consider writing this out multiple times');
        recommendations.actions.push('Create flashcards specifically for this item');
        recommendations.actions.push('Review before bedtime for better retention');
    }

    // Streak loss recommendations
    if (leech.streakLoss >= 10) {
        recommendations.studyTips.push('You had a good streak before - you can get it back!');
        recommendations.actions.push('Review what changed - new confusion pairs?');
    }

    return recommendations;
}

/**
 * Generate prioritized study list
 * @param {Array} leeches - All leeches with recommendations
 * @returns {Array} Prioritized study list
 */
export function generatePrioritizedStudyList(leeches) {
    // Separate by priority
    const high = leeches.filter(l => l.recommendations?.priority === 'high');
    const medium = leeches.filter(l => l.recommendations?.priority === 'medium');
    const low = leeches.filter(l => l.recommendations?.priority === 'low');

    return [
        ...high.slice(0, 10),   // Top 10 high priority
        ...medium.slice(0, 15), // Top 15 medium priority
        ...low.slice(0, 10)     // Top 10 low priority
    ];
}

/**
 * Get complete leech analysis
 * @param {Array} reviewStatistics - All review statistics
 * @param {Array} subjects - All subjects
 * @param {Array} assignments - All assignments
 * @param {Object} options - Detection options
 * @returns {Promise<Object>} Complete leech analysis
 */
export async function getCompleteLeechAnalysis(reviewStatistics, subjects, assignments, options = {}) {
    console.log('[LeechDetector] Starting complete leech analysis...');

    // Step 1: Identify leeches
    const leeches = await identifyLeeches(reviewStatistics, options);

    // Step 2: Score leeches
    const scoredLeeches = scoreAllLeeches(leeches);

    // Step 3: Detect confusion pairs
    const confusionPairs = await detectConfusionPairs(scoredLeeches, subjects);

    // Step 4: Identify confusion clusters
    const confusionClusters = identifyConfusionClusters(confusionPairs);

    // Step 5: Analyze components
    const leechesWithComponents = await analyzeLeechComponents(scoredLeeches, subjects, assignments);

    // Step 6: Identify root causes
    const rootCauses = identifyRootCauseComponents(leechesWithComponents, subjects);

    // Step 7: Generate recommendations
    const leechesWithRecommendations = leechesWithComponents.map(leech => {
        const subject = subjects.find(s => s.id === leech.subject_id);
        const recommendations = generateLeechRecommendations(leech, subject, confusionPairs);
        
        return {
            ...leech,
            subject,
            recommendations
        };
    });

    // Step 8: Generate prioritized study list
    const prioritizedStudyList = generatePrioritizedStudyList(leechesWithRecommendations);

    // Statistics
    const stats = {
        totalLeeches: leeches.length,
        bySeverity: {
            severe: leechesWithRecommendations.filter(l => l.severityCategory === 'severe').length,
            moderate: leechesWithRecommendations.filter(l => l.severityCategory === 'moderate').length,
            mild: leechesWithRecommendations.filter(l => l.severityCategory === 'mild').length
        },
        byType: {
            radical: leeches.filter(l => l.subject_type === 'radical').length,
            kanji: leeches.filter(l => l.subject_type === 'kanji').length,
            vocabulary: leeches.filter(l => l.subject_type === 'vocabulary').length,
            kana_vocabulary: leeches.filter(l => l.subject_type === 'kana_vocabulary').length
        },
        confusionPairs: confusionPairs.length,
        confusionClusters: confusionClusters.length,
        rootCauses: rootCauses.length
    };

    console.log('[LeechDetector] Analysis complete:', stats);

    return {
        leeches: leechesWithRecommendations,
        confusionPairs,
        confusionClusters,
        rootCauses,
        prioritizedStudyList,
        stats
    };
}
