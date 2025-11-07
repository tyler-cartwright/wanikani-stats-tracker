// Data Synchronization Orchestrator
// Manages fetching and caching all WaniKani data

import { fetchUser } from './user.js';
import { fetchSummary } from './summary.js';
import { fetchAssignments } from './assignments.js';
import { fetchReviewStatistics } from './review-statistics.js';
import { fetchSubjects } from './subjects.js';
import { fetchLevelProgressions } from './level-progressions.js';

/**
 * Initial data load - fetch critical data first, then background fetch rest
 * @param {Function} onProgress - Progress callback (step, totalSteps, message)
 * @returns {Promise<Object>}
 */
export async function initialDataLoad(onProgress = null) {
    const totalSteps = 6;
    let currentStep = 0;

    const updateProgress = (message) => {
        currentStep++;
        if (onProgress) {
            onProgress(currentStep, totalSteps, message);
        }
        console.log(`[DataSync] Step ${currentStep}/${totalSteps}: ${message}`);
    };

    try {
        // Step 1: Fetch user data (validates token)
        updateProgress('Loading user profile...');
        const user = await fetchUser(true);

        // Step 2: Fetch summary (immediate actionable data)
        updateProgress('Loading dashboard summary...');
        const summary = await fetchSummary(true);

        // Step 3: Fetch assignments (progress data)
        updateProgress('Loading your progress...');
        const assignments = await fetchAssignments({}, (current, total) => {
            if (onProgress) {
                onProgress(
                    currentStep, 
                    totalSteps, 
                    `Loading progress... (${current}/${total} pages)`
                );
            }
        });

        // Step 4: Fetch review statistics (accuracy data)
        updateProgress('Loading accuracy data...');
        const reviewStats = await fetchReviewStatistics({}, (current, total) => {
            if (onProgress) {
                onProgress(
                    currentStep, 
                    totalSteps, 
                    `Loading accuracy... (${current}/${total} pages)`
                );
            }
        });

        // Step 5: Fetch subjects (reference data)
        updateProgress('Loading subject database...');
        const subjects = await fetchSubjects({}, (current, total) => {
            if (onProgress) {
                onProgress(
                    currentStep, 
                    totalSteps, 
                    `Loading subjects... (${current}/${total} pages)`
                );
            }
        });

        // Step 6: Fetch level progressions (historical data)
        updateProgress('Loading level history...');
        const levelProgressions = await fetchLevelProgressions();

        updateProgress('Complete!');

        return {
            success: true,
            user,
            summary,
            assignments,
            reviewStats,
            subjects,
            levelProgressions
        };

    } catch (error) {
        console.error('[DataSync] Initial load failed:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Quick refresh - update frequently changing data
 * @returns {Promise<Object>}
 */
export async function quickRefresh() {
    console.log('[DataSync] Quick refresh started');
    
    try {
        const [summary, assignments, reviewStats] = await Promise.all([
            fetchSummary(true),
            fetchAssignments({}),  // Uses incremental update
            fetchReviewStatistics({})  // Uses incremental update
        ]);

        console.log('[DataSync] Quick refresh complete');
        return {
            success: true,
            summary,
            assignments,
            reviewStats
        };

    } catch (error) {
        console.error('[DataSync] Quick refresh failed:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Full refresh - update all data
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<Object>}
 */
export async function fullRefresh(onProgress = null) {
    console.log('[DataSync] Full refresh started');
    return await initialDataLoad(onProgress);
}
