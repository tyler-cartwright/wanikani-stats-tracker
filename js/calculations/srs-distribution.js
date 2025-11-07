// SRS Distribution Calculator
// Calculates item counts by SRS stage and category

import { SRS_STAGES, SRS_CATEGORIES, SUBJECT_TYPES } from '../utils/constants.js';

/**
 * Calculate SRS distribution for assignments
 * @param {Array} assignments - All assignments
 * @returns {Object} Distribution statistics
 */
export function calculateSRSDistribution(assignments) {
    // Initialize counts
    const distribution = {
        byStage: {},
        byCategory: {
            apprentice: 0,
            guru: 0,
            master: 0,
            enlightened: 0,
            burned: 0
        },
        byType: {
            radical: { total: 0, byStage: {} },
            kanji: { total: 0, byStage: {} },
            vocabulary: { total: 0, byStage: {} },
            kana_vocabulary: { total: 0, byStage: {} }
        },
        total: assignments.length
    };

    // Initialize stage counts (0-9)
    for (let stage = 0; stage <= 9; stage++) {
        distribution.byStage[stage] = 0;
    }

    // Initialize type stage counts
    Object.keys(distribution.byType).forEach(type => {
        for (let stage = 0; stage <= 9; stage++) {
            distribution.byType[type].byStage[stage] = 0;
        }
    });

    // Count assignments
    assignments.forEach(assignment => {
        const stage = assignment.data.srs_stage;
        const type = assignment.data.subject_type;

        // Count by stage
        distribution.byStage[stage]++;

        // Count by type
        if (distribution.byType[type]) {
            distribution.byType[type].total++;
            distribution.byType[type].byStage[stage]++;
        }

        // Count by category
        if (SRS_CATEGORIES.APPRENTICE.includes(stage)) {
            distribution.byCategory.apprentice++;
        } else if (SRS_CATEGORIES.GURU.includes(stage)) {
            distribution.byCategory.guru++;
        } else if (SRS_CATEGORIES.MASTER.includes(stage)) {
            distribution.byCategory.master++;
        } else if (SRS_CATEGORIES.ENLIGHTENED.includes(stage)) {
            distribution.byCategory.enlightened++;
        } else if (SRS_CATEGORIES.BURNED.includes(stage)) {
            distribution.byCategory.burned++;
        }
    });

    // Calculate percentages
    distribution.percentages = {
        byStage: {},
        byCategory: {}
    };

    // Stage percentages
    for (let stage = 0; stage <= 9; stage++) {
        distribution.percentages.byStage[stage] = 
            distribution.total > 0 
                ? (distribution.byStage[stage] / distribution.total * 100).toFixed(1)
                : 0;
    }

    // Category percentages
    Object.keys(distribution.byCategory).forEach(category => {
        distribution.percentages.byCategory[category] = 
            distribution.total > 0
                ? (distribution.byCategory[category] / distribution.total * 100).toFixed(1)
                : 0;
    });

    return distribution;
}

/**
 * Calculate SRS distribution for a specific level
 * @param {Array} assignments - All assignments
 * @param {number} level - Level to filter
 * @returns {Object} Distribution statistics
 */
export function calculateSRSDistributionForLevel(assignments, level) {
    const levelAssignments = assignments.filter(a => a.data.level === level);
    return calculateSRSDistribution(levelAssignments);
}

/**
 * Calculate SRS distribution for a specific type
 * @param {Array} assignments - All assignments
 * @param {string} type - Subject type to filter
 * @returns {Object} Distribution statistics
 */
export function calculateSRSDistributionForType(assignments, type) {
    const typeAssignments = assignments.filter(a => a.data.subject_type === type);
    return calculateSRSDistribution(typeAssignments);
}

/**
 * Get items at specific SRS stage(s)
 * @param {Array} assignments - All assignments
 * @param {number|Array<number>} stages - Stage(s) to filter
 * @returns {Array} Filtered assignments
 */
export function getItemsAtStage(assignments, stages) {
    const stageArray = Array.isArray(stages) ? stages : [stages];
    return assignments.filter(a => stageArray.includes(a.data.srs_stage));
}

/**
 * Get items in a category (apprentice, guru, etc.)
 * @param {Array} assignments - All assignments
 * @param {string} category - Category name
 * @returns {Array} Filtered assignments
 */
export function getItemsInCategory(assignments, category) {
    const stages = SRS_CATEGORIES[category.toUpperCase()];
    if (!stages) {
        return [];
    }
    return getItemsAtStage(assignments, stages);
}
