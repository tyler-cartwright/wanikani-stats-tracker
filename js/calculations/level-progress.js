// Level Progress Calculator
// Calculates progress through current level

import { SRS_STAGES } from '../utils/constants.js';

/**
 * Calculate level progress
 * @param {Array} assignments - All assignments
 * @param {Object} user - User data
 * @param {Array} subjects - All subjects (needed for level lookup)
 * @returns {Object} Level progress statistics
 */
export function calculateLevelProgress(assignments, user, subjects) {
    const currentLevel = user.data.level;
    
    console.log('[LevelProgress] Calculating for level', currentLevel);
    console.log('[LevelProgress] Total assignments:', assignments.length);
    console.log('[LevelProgress] Total subjects:', subjects.length);
    
    // Get assignments for current level by looking up subject levels
    const levelAssignments = assignments.filter(assignment => {
        const subject = subjects.find(s => s.id === assignment.data.subject_id);
        return subject && subject.data.level === currentLevel;
    });
    
    console.log('[LevelProgress] Level assignments found:', levelAssignments.length);
    
    // Separate by type
    const radicals = levelAssignments.filter(a => a.data.subject_type === 'radical');
    const kanji = levelAssignments.filter(a => a.data.subject_type === 'kanji');
    const vocabulary = levelAssignments.filter(a => a.data.subject_type === 'vocabulary');
    
    console.log('[LevelProgress] Radicals:', radicals.length, 'Kanji:', kanji.length, 'Vocab:', vocabulary.length);
    
    // Count items at Guru or higher (SRS stage >= 5)
    const radicalsAtGuru = radicals.filter(a => a.data.srs_stage >= SRS_STAGES.GURU_1).length;
    const kanjiAtGuru = kanji.filter(a => a.data.srs_stage >= SRS_STAGES.GURU_1).length;
    const vocabularyAtGuru = vocabulary.filter(a => a.data.srs_stage >= SRS_STAGES.GURU_1).length;
    
    console.log('[LevelProgress] At Guru+ - Radicals:', radicalsAtGuru, 'Kanji:', kanjiAtGuru, 'Vocab:', vocabularyAtGuru);
    
    // Calculate what's needed to pass level
    // Need 90% of kanji at Guru+ to level up
    const kanjiNeededToPass = Math.ceil(kanji.length * 0.9);
    const kanjiRemainingToPass = Math.max(0, kanjiNeededToPass - kanjiAtGuru);
    
    // Calculate percentages
    const radicalsPercentage = radicals.length > 0 
        ? parseFloat((radicalsAtGuru / radicals.length * 100).toFixed(1))
        : 0;
    const kanjiPercentage = kanji.length > 0 
        ? parseFloat((kanjiAtGuru / kanji.length * 100).toFixed(1))
        : 0;
    const vocabularyPercentage = vocabulary.length > 0 
        ? parseFloat((vocabularyAtGuru / vocabulary.length * 100).toFixed(1))
        : 0;
    
    // Overall level completion (based on kanji only, as that's what matters for level-up)
    const levelCompletion = kanji.length > 0 && kanjiNeededToPass > 0
        ? parseFloat((kanjiAtGuru / kanjiNeededToPass * 100).toFixed(1))
        : 0;
    
    // Check if level is passed
    const isPassed = kanjiAtGuru >= kanjiNeededToPass;
    
    // Get level start time
    const levelStartTime = getLevelStartTime(levelAssignments);
    const daysSinceLevelStart = levelStartTime 
        ? calculateDaysSince(levelStartTime)
        : null;
    
    const result = {
        currentLevel,
        radicals: {
            total: radicals.length,
            atGuru: radicalsAtGuru,
            remaining: radicals.length - radicalsAtGuru,
            percentage: radicalsPercentage
        },
        kanji: {
            total: kanji.length,
            atGuru: kanjiAtGuru,
            remaining: kanji.length - kanjiAtGuru,
            neededToPass: kanjiNeededToPass,
            remainingToPass: kanjiRemainingToPass,
            percentage: kanjiPercentage
        },
        vocabulary: {
            total: vocabulary.length,
            atGuru: vocabularyAtGuru,
            remaining: vocabulary.length - vocabularyAtGuru,
            percentage: vocabularyPercentage
        },
        overall: {
            totalItems: levelAssignments.length,
            completion: levelCompletion,
            isPassed,
            daysSinceLevelStart
        }
    };
    
    console.log('[LevelProgress] Result:', result);
    
    return result;
}

/**
 * Get level start time from assignments
 * @param {Array} levelAssignments - Assignments for a level
 * @returns {Date|null}
 */
function getLevelStartTime(levelAssignments) {
    if (levelAssignments.length === 0) {
        return null;
    }
    
    // Find earliest started_at time
    const startedAssignments = levelAssignments.filter(a => a.data.started_at);
    if (startedAssignments.length === 0) {
        return null;
    }
    
    const earliestStart = startedAssignments.reduce((earliest, assignment) => {
        const startTime = new Date(assignment.data.started_at);
        return startTime < earliest ? startTime : earliest;
    }, new Date(startedAssignments[0].data.started_at));
    
    return earliestStart;
}

/**
 * Calculate days since a date
 * @param {Date} date - Start date
 * @returns {number} Days elapsed
 */
function calculateDaysSince(date) {
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

/**
 * Get items by level
 * @param {Array} assignments - All assignments
 * @param {Array} subjects - All subjects
 * @param {number} level - Level to filter
 * @returns {Array} Filtered assignments
 */
export function getItemsByLevel(assignments, subjects, level) {
    return assignments.filter(assignment => {
        const subject = subjects.find(s => s.id === assignment.data.subject_id);
        return subject && subject.data.level === level;
    });
}

/**
 * Get available lessons for current level
 * @param {Array} assignments - All assignments
 * @param {Array} subjects - All subjects
 * @param {number} currentLevel - Current level
 * @returns {Array} Assignments available for lessons
 */
export function getAvailableLessons(assignments, subjects, currentLevel) {
    return assignments.filter(assignment => {
        if (assignment.data.srs_stage !== SRS_STAGES.UNLOCKING) {
            return false;
        }
        const subject = subjects.find(s => s.id === assignment.data.subject_id);
        return subject && subject.data.level <= currentLevel;
    });
}
