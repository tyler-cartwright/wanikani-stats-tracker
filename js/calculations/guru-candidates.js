// Guru Candidates Calculator
// Calculate how many Apprentice IV items have reviews scheduled before end of day

/**
 * Calculate Apprentice IV items with reviews today
 * These items will guru (move to Guru I) if answered correctly
 *
 * @param {Array} assignments - All assignments
 * @returns {Object} Guru candidate statistics
 */
export function calculateGuruCandidates(assignments) {
    console.log('[GuruCandidates] Calculating for', assignments.length, 'assignments');

    // Get end of day (today at 23:59:59)
    const now = new Date();
    const endOfDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        23, 59, 59, 999
    );

    console.log('[GuruCandidates] Now:', now.toISOString());
    console.log('[GuruCandidates] End of day:', endOfDay.toISOString());

    // Filter for Apprentice IV items (SRS stage 4)
    const apprenticeIV = assignments.filter(a => a.data.srs_stage === 4);
    console.log('[GuruCandidates] Total Apprentice IV items:', apprenticeIV.length);

    // Filter for those with reviews before end of day
    const guruCandidates = apprenticeIV.filter(assignment => {
        if (!assignment.data.available_at) {
            return false;
        }

        const availableAt = new Date(assignment.data.available_at);
        const isBeforeEndOfDay = availableAt <= endOfDay;
        const isAvailableNow = availableAt <= now;

        return isBeforeEndOfDay;
    });

    // Split into available now vs available later today
    const availableNow = guruCandidates.filter(a => {
        const availableAt = new Date(a.data.available_at);
        return availableAt <= now;
    });

    const availableLater = guruCandidates.filter(a => {
        const availableAt = new Date(a.data.available_at);
        return availableAt > now && availableAt <= endOfDay;
    });

    console.log('[GuruCandidates] Guru candidates today:', guruCandidates.length);
    console.log('[GuruCandidates] - Available now:', availableNow.length);
    console.log('[GuruCandidates] - Available later today:', availableLater.length);

    // Find next available time for later reviews
    let nextAvailableTime = null;
    if (availableLater.length > 0) {
        const nextReview = availableLater.reduce((earliest, assignment) => {
            const availableAt = new Date(assignment.data.available_at);
            return !earliest || availableAt < earliest ? availableAt : earliest;
        }, null);
        nextAvailableTime = nextReview;
    }

    return {
        total: guruCandidates.length,
        availableNow: availableNow.length,
        availableLater: availableLater.length,
        nextAvailableTime,
        totalApprenticeIV: apprenticeIV.length
    };
}

/**
 * Format time until next review
 * @param {Date} nextTime - Next review time
 * @returns {string} Formatted time string
 */
export function formatTimeUntil(nextTime) {
    if (!nextTime) {
        return 'None scheduled';
    }

    const now = new Date();
    const diff = nextTime - now;

    if (diff < 0) {
        return 'Now';
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours === 0) {
        return `${minutes}m`;
    }

    return `${hours}h ${minutes}m`;
}
