// Data Exporter Utility
// Handles CSV and JSON export functionality

/**
 * Convert array of objects to CSV string
 * @param {Array<Object>} data - Array of objects to convert
 * @param {Array<string>} headers - Optional custom headers
 * @returns {string} CSV string
 */
function arrayToCSV(data, headers = null) {
    if (!data || data.length === 0) {
        return '';
    }

    // Get headers from first object if not provided
    const csvHeaders = headers || Object.keys(data[0]);

    // Create CSV rows
    const csvRows = [
        csvHeaders.join(','), // Header row
        ...data.map(row =>
            csvHeaders.map(header => {
                const value = row[header];
                // Escape quotes and wrap in quotes if contains comma, quote, or newline
                if (value === null || value === undefined) {
                    return '';
                }
                const stringValue = String(value);
                if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                    return `"${stringValue.replace(/"/g, '""')}"`;
                }
                return stringValue;
            }).join(',')
        )
    ];

    return csvRows.join('\n');
}

/**
 * Download a file
 * @param {string} content - File content
 * @param {string} filename - File name
 * @param {string} mimeType - MIME type
 */
function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Export assignments to CSV
 * @param {Array} assignments - Assignment data
 * @param {Array} subjects - Subject data for looking up characters and meanings
 */
export function exportAssignmentsCSV(assignments, subjects) {
    // Create subject lookup map
    const subjectMap = new Map(subjects.map(s => [s.id, s]));

    // Format assignments for export
    const formattedData = assignments.map(assignment => {
        const subject = subjectMap.get(assignment.data.subject_id);
        const subjectData = subject?.data || {};

        return {
            'Character': subjectData.characters || subjectData.slug || '-',
            'Meaning': subjectData.meanings?.[0]?.meaning || '-',
            'Type': assignment.data.subject_type,
            'Level': subjectData.level || '-',
            'SRS Stage': assignment.data.srs_stage,
            'Unlocked At': assignment.data.unlocked_at || '-',
            'Started At': assignment.data.started_at || '-',
            'Passed At': assignment.data.passed_at || '-',
            'Burned At': assignment.data.burned_at || '-',
            'Available At': assignment.data.available_at || '-'
        };
    });

    const csv = arrayToCSV(formattedData);
    const timestamp = new Date().toISOString().split('T')[0];
    downloadFile(csv, `wanikani-assignments-${timestamp}.csv`, 'text/csv');
}

/**
 * Export review statistics to CSV
 * @param {Array} reviewStats - Review statistics data
 * @param {Array} subjects - Subject data for looking up characters and meanings
 */
export function exportReviewStatsCSV(reviewStats, subjects) {
    // Create subject lookup map
    const subjectMap = new Map(subjects.map(s => [s.id, s]));

    // Format review stats for export
    const formattedData = reviewStats.map(stat => {
        const subject = subjectMap.get(stat.data.subject_id);
        const subjectData = subject?.data || {};

        return {
            'Character': subjectData.characters || subjectData.slug || '-',
            'Meaning': subjectData.meanings?.[0]?.meaning || '-',
            'Type': stat.data.subject_type,
            'Overall Accuracy': `${stat.data.percentage_correct}%`,
            'Meaning Accuracy': `${stat.data.meaning_correct}%`,
            'Reading Accuracy': `${stat.data.reading_correct}%`,
            'Total Attempts': stat.data.meaning_incorrect + stat.data.meaning_correct +
                             stat.data.reading_incorrect + stat.data.reading_correct,
            'Meaning Correct': stat.data.meaning_correct,
            'Meaning Incorrect': stat.data.meaning_incorrect,
            'Reading Correct': stat.data.reading_correct,
            'Reading Incorrect': stat.data.reading_incorrect,
            'Current Streak': stat.data.meaning_current_streak,
            'Max Streak': stat.data.meaning_max_streak
        };
    });

    const csv = arrayToCSV(formattedData);
    const timestamp = new Date().toISOString().split('T')[0];
    downloadFile(csv, `wanikani-review-stats-${timestamp}.csv`, 'text/csv');
}

/**
 * Export leeches to CSV
 * @param {Object} leechAnalysis - Leech analysis data
 * @param {Array} subjects - Subject data for looking up details
 */
export function exportLeechesCSV(leechAnalysis, subjects) {
    if (!leechAnalysis.leeches || leechAnalysis.leeches.length === 0) {
        alert('No leeches to export!');
        return;
    }

    // Create subject lookup map
    const subjectMap = new Map(subjects.map(s => [s.id, s]));

    // Format leeches for export
    const formattedData = leechAnalysis.leeches.map(leech => {
        const subject = subjectMap.get(leech.subjectId);
        const subjectData = subject?.data || {};

        return {
            'Character': leech.characters || subjectData.characters || subjectData.slug || '-',
            'Meaning': leech.meaning || subjectData.meanings?.[0]?.meaning || '-',
            'Type': leech.subjectType,
            'Severity Score': leech.severity.toFixed(0),
            'Severity Level': leech.severityLevel,
            'Accuracy': `${leech.accuracy.toFixed(1)}%`,
            'Total Reviews': leech.totalReviews,
            'Incorrect Attempts': leech.incorrectAttempts,
            'Current Streak': leech.currentStreak,
            'Recommendation': leech.recommendation
        };
    });

    const csv = arrayToCSV(formattedData);
    const timestamp = new Date().toISOString().split('T')[0];
    downloadFile(csv, `wanikani-leeches-${timestamp}.csv`, 'text/csv');
}

/**
 * Export all data to JSON
 * @param {Object} appData - Complete app data object
 */
export function exportAllDataJSON(appData) {
    // Create a clean export object (exclude large raw data if desired)
    const exportData = {
        exportDate: new Date().toISOString(),
        user: appData.user,
        summary: appData.summary,
        stats: {
            totalAssignments: appData.assignments.length,
            totalSubjects: appData.subjects.length,
            totalReviewStats: appData.reviewStats.length,
            totalLevelProgressions: appData.levelProgressions?.length || 0,
            leechStats: appData.leechAnalysis.stats
        },
        assignments: appData.assignments,
        subjects: appData.subjects,
        reviewStats: appData.reviewStats,
        levelProgressions: appData.levelProgressions || [],
        leechAnalysis: appData.leechAnalysis
    };

    const json = JSON.stringify(exportData, null, 2);
    const timestamp = new Date().toISOString().split('T')[0];
    downloadFile(json, `wanikani-data-backup-${timestamp}.json`, 'application/json');
}

/**
 * Export level progressions to CSV
 * @param {Array} levelProgressions - Level progression data
 */
export function exportLevelProgressionsCSV(levelProgressions) {
    if (!levelProgressions || levelProgressions.length === 0) {
        alert('No level progression data to export!');
        return;
    }

    const formattedData = levelProgressions
        .filter(lp => lp.data.passed_at) // Only completed levels
        .map(lp => {
            const startDate = new Date(lp.data.started_at);
            const passDate = new Date(lp.data.passed_at);
            const durationDays = Math.ceil((passDate - startDate) / (1000 * 60 * 60 * 24));

            return {
                'Level': lp.data.level,
                'Started At': lp.data.started_at,
                'Passed At': lp.data.passed_at,
                'Duration (days)': durationDays,
                'Abandoned At': lp.data.abandoned_at || '-',
                'Completed At': lp.data.completed_at || '-'
            };
        })
        .sort((a, b) => a.Level - b.Level);

    const csv = arrayToCSV(formattedData);
    const timestamp = new Date().toISOString().split('T')[0];
    downloadFile(csv, `wanikani-level-progressions-${timestamp}.csv`, 'text/csv');
}
