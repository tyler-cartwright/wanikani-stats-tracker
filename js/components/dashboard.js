// Dashboard Component
// Main dashboard view with overview statistics

import { calculateSRSDistribution } from '../calculations/srs-distribution.js';
import { calculateLevelProgress } from '../calculations/level-progress.js';
import { calculateAccuracyStats } from '../calculations/accuracy-analyzer.js';
import { calculateBurnedStats } from '../calculations/burned-items-tracker.js';
import { generate24HourForecast, getCurrentReviewCount } from '../calculations/review-forecast.js';
import { calculateWorkload, calculateSustainableLessonPace } from '../calculations/workload-calculator.js';
import { projectLevelCompletion } from '../calculations/level-completion-projector.js';
import { calculateGuruCandidates, formatTimeUntil } from '../calculations/guru-candidates.js';

export class Dashboard {
    constructor(appData) {
        this.appData = appData;
    }

    /**
     * Render complete dashboard
     * @returns {string} HTML string
     */
    render() {
        const { user, summary, assignments, reviewStats, subjects, leechAnalysis, levelProgressions } = this.appData;

        // Calculate all statistics - NOW PASSING SUBJECTS AND LEVEL PROGRESSIONS TO LEVEL PROGRESS
        const srsDistribution = calculateSRSDistribution(assignments);
        const levelProgress = calculateLevelProgress(assignments, user, subjects, levelProgressions || []);
        const accuracyStats = calculateAccuracyStats(reviewStats);
        const burnedStats = calculateBurnedStats(assignments);
        const currentReviews = getCurrentReviewCount(summary);
        const forecast = generate24HourForecast(summary);
        const workload = calculateWorkload(assignments, summary);
        const levelProjection = projectLevelCompletion(assignments, levelProgressions || [], user, subjects);
        const lessonPace = calculateSustainableLessonPace(assignments, reviewStats);
        const guruCandidates = calculateGuruCandidates(assignments);

        console.log('Dashboard Data:', {
            srsDistribution,
            levelProgress,
            assignments: assignments.length,
            subjects: subjects.length,
            userLevel: user.data.level,
            levelProjection,
            lessonPace
        });

        return `
            <div class="dashboard">
                ${this.renderHeader(user)}
                ${this.renderQuickStats(currentReviews, summary, workload, leechAnalysis)}
                ${this.renderLevelProgress(levelProgress)}

                <!-- Level Projection & Workload Grid -->
                <div class="dashboard-grid-2col">
                    ${this.renderLevelProjection(levelProjection)}
                    ${this.renderWorkloadAnalysis(workload, lessonPace)}
                    ${this.renderGuruCandidates(guruCandidates)}
                </div>

                <!-- SRS, Accuracy & Burned Items Grid -->
                <div class="dashboard-grid-2col">
                    ${this.renderSRSDistribution(srsDistribution)}
                    ${this.renderAccuracySummary(accuracyStats)}
                    ${this.renderBurnedItems(burnedStats)}
                </div>

                <!-- Review Forecast & Leech Summary -->
                ${this.renderReviewForecast(forecast)}
                ${this.renderLeechSummary(leechAnalysis)}
            </div>
        `;
    }

    /**
     * Render dashboard header
     */
    renderHeader(user) {
        return `
            <div class="dashboard-header">
                <div>
                    <h1 class="dashboard-title">Welcome back, ${user.data.username}!</h1>
                    <p class="dashboard-subtitle">Level ${user.data.level} • Keep up the great work</p>
                </div>
                <div class="dashboard-level-badge">
                    <div class="level-badge-number">${user.data.level}</div>
                    <div class="level-badge-label">Level</div>
                </div>
            </div>
        `;
    }

    /**
     * Render quick stats cards
     */
    renderQuickStats(currentReviews, summary, workload, leechAnalysis) {
        const lessonsAvailable = summary?.data?.lessons?.[0]?.subject_ids?.length || 0;
        const nextReviewTime = summary?.data?.next_reviews_at 
            ? new Date(summary.data.next_reviews_at)
            : null;

        return `
            <div class="quick-stats">
                <div class="stat-card stat-card-primary">
                    <div class="stat-icon">📝</div>
                    <div class="stat-content">
                        <div class="stat-value">${currentReviews}</div>
                        <div class="stat-label">Reviews Now</div>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">📝</div>
                    <div class="stat-content">
                        <div class="stat-value">${lessonsAvailable}</div>
                        <div class="stat-label">Lessons Available</div>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">⏰</div>
                    <div class="stat-content">
                        <div class="stat-value">${nextReviewTime ? this.formatTimeUntil(nextReviewTime) : 'None'}</div>
                        <div class="stat-label">Next Review</div>
                    </div>
                </div>
                
                <div class="stat-card ${workload.workloadLevel === 'heavy' ? 'stat-card-warning' : ''}">
                    <div class="stat-icon">${this.getWorkloadIcon(workload.workloadLevel)}</div>
                    <div class="stat-content">
                        <div class="stat-value">${workload.apprenticeItems}</div>
                        <div class="stat-label">Apprentice Items</div>
                    </div>
                </div>
                
                <div class="stat-card ${leechAnalysis.stats.totalLeeches > 0 ? 'stat-card-danger' : 'stat-card-success'}">
                    <div class="stat-icon">${leechAnalysis.stats.totalLeeches > 0 ? '🐛' : '✨'}</div>
                    <div class="stat-content">
                        <div class="stat-value">${leechAnalysis.stats.totalLeeches}</div>
                        <div class="stat-label">Leeches</div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render level progress section
     */
    renderLevelProgress(levelProgress) {
        console.log('Level Progress Data:', levelProgress);

        // All percentages based on total items (not level-up requirement)
        const radicalsPercent = levelProgress.radicals.percentage;
        const kanjiPercent = levelProgress.kanji.percentage;
        const vocabPercent = levelProgress.vocabulary.percentage;

        return `
            <div class="card level-progress-card">
                <div class="card-header">
                    <h2 class="card-title">Level ${levelProgress.currentLevel} Progress</h2>
                    <span class="card-badge ${levelProgress.overall.isPassed ? 'badge-success' : 'badge-warning'}">
                        ${levelProgress.overall.isPassed ? 'Passed ✓' : 'In Progress'}
                    </span>
                </div>
                
                <div class="level-progress-grid">
                    <div class="progress-section">
                        <div class="progress-header">
                            <span class="progress-label">Radicals</span>
                            <span class="progress-count">${levelProgress.radicals.atGuru}/${levelProgress.radicals.total}</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill progress-fill-radical" style="width: ${radicalsPercent}%"></div>
                        </div>
                        <div class="progress-percent">${radicalsPercent.toFixed(0)}%</div>
                    </div>
                    
                    <div class="progress-section">
                        <div class="progress-header">
                            <span class="progress-label">Kanji (${levelProgress.kanji.neededToPass} needed)</span>
                            <span class="progress-count">${levelProgress.kanji.atGuru}/${levelProgress.kanji.total}</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill progress-fill-kanji" style="width: ${kanjiPercent}%"></div>
                        </div>
                        <div class="progress-percent">${kanjiPercent.toFixed(0)}%</div>
                    </div>
                    
                    <div class="progress-section">
                        <div class="progress-header">
                            <span class="progress-label">Vocabulary</span>
                            <span class="progress-count">${levelProgress.vocabulary.atGuru}/${levelProgress.vocabulary.total}</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill progress-fill-vocabulary" style="width: ${vocabPercent}%"></div>
                        </div>
                        <div class="progress-percent">${vocabPercent.toFixed(0)}%</div>
                    </div>
                </div>
                
                ${levelProgress.overall.daysSinceLevelStart !== null ? `
                    <div class="level-progress-footer">
                        <span>📅 ${levelProgress.overall.daysSinceLevelStart} days on this level</span>
                        <span
                            title="WaniKani requires 90% of kanji (${levelProgress.kanji.neededToPass} out of ${levelProgress.kanji.total}) to reach Guru or higher to level up"
                            style="cursor: help; border-bottom: 1px dotted var(--text-secondary);"
                        >
                            🎯 ${levelProgress.kanji.remainingToPass} kanji to level up
                        </span>
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Render SRS distribution chart
     */
    renderSRSDistribution(distribution) {
        const maxCount = Math.max(...Object.values(distribution.byCategory), 1);
        
        console.log('SRS Distribution:', {
            byCategory: distribution.byCategory,
            maxCount,
            total: distribution.total
        });
        
        return `
            <div class="card srs-card">
                <h2 class="card-title">SRS Distribution</h2>
                
                <div class="srs-chart">
                    ${Object.entries(distribution.byCategory).map(([category, count]) => {
                        const percentage = distribution.total > 0 
                            ? (count / distribution.total * 100) 
                            : 0;
                        const barHeight = maxCount > 0 
                            ? (count / maxCount * 100) 
                            : 0;
                        
                        console.log(`${category}: count=${count}, percentage=${percentage.toFixed(1)}%, barHeight=${barHeight.toFixed(1)}%`);
                        
                        return `
                            <div class="srs-bar-container">
                                <div class="srs-bar">
                                    <div class="srs-bar-fill srs-${category}" 
                                         style="height: ${barHeight}%"
                                         title="${count} items">
                                    </div>
                                </div>
                                <div class="srs-bar-label">
                                    <div class="srs-bar-name">${this.capitalize(category)}</div>
                                    <div class="srs-bar-count">${count}</div>
                                    <div class="srs-bar-percent">${percentage.toFixed(0)}%</div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
                
                <div class="srs-legend">
                    <div class="legend-item"><span class="legend-color srs-apprentice"></span> Apprentice</div>
                    <div class="legend-item"><span class="legend-color srs-guru"></span> Guru</div>
                    <div class="legend-item"><span class="legend-color srs-master"></span> Master</div>
                    <div class="legend-item"><span class="legend-color srs-enlightened"></span> Enlightened</div>
                    <div class="legend-item"><span class="legend-color srs-burned"></span> Burned</div>
                </div>
            </div>
        `;
    }

    /**
     * Render accuracy summary
     */
    renderAccuracySummary(accuracyStats) {
        return `
            <div class="card accuracy-card">
                <h2 class="card-title">Accuracy</h2>
                
                <div class="accuracy-main">
                    <div class="accuracy-circle ${this.getAccuracyClass(accuracyStats.overall)}">
                        <div class="accuracy-value">${accuracyStats.overall.toFixed(0)}%</div>
                        <div class="accuracy-label">Overall</div>
                    </div>
                </div>
                
                <div class="accuracy-breakdown">
                    <div class="accuracy-item">
                        <span class="accuracy-item-label">Meaning</span>
                        <div class="accuracy-item-bar">
                            <div class="accuracy-item-fill" style="width: ${accuracyStats.meaning}%"></div>
                        </div>
                        <span class="accuracy-item-value">${accuracyStats.meaning}%</span>
                    </div>
                    
                    <div class="accuracy-item">
                        <span class="accuracy-item-label">Reading</span>
                        <div class="accuracy-item-bar">
                            <div class="accuracy-item-fill" style="width: ${accuracyStats.reading}%"></div>
                        </div>
                        <span class="accuracy-item-value">${accuracyStats.reading}%</span>
                    </div>
                </div>
                
                <div class="accuracy-footer">
                    ${accuracyStats.totalAttempts.toLocaleString()} total reviews
                </div>
            </div>
        `;
    }

    /**
     * Render burned items summary
     */
    renderBurnedItems(burnedStats) {
        return `
            <div class="card burned-card">
                <h2 class="card-title">Burned Items 🔥</h2>
                
                <div class="burned-main">
                    <div class="burned-total">${burnedStats.total}</div>
                    <div class="burned-subtitle">${burnedStats.percentage}% of all items</div>
                </div>
                
                <div class="burned-breakdown">
                    <div class="burned-type">
                        <span class="burned-type-icon">⚛️</span>
                        <span class="burned-type-count">${burnedStats.byType.radical}</span>
                    </div>
                    <div class="burned-type">
                        <span class="burned-type-icon">📘</span>
                        <span class="burned-type-count">${burnedStats.byType.kanji}</span>
                    </div>
                    <div class="burned-type">
                        <span class="burned-type-icon">📙</span>
                        <span class="burned-type-count">${burnedStats.byType.vocabulary}</span>
                    </div>
                </div>
                
                ${burnedStats.nextMilestone ? `
                    <div class="burned-milestone">
                        <div class="milestone-progress">
                            <div class="milestone-fill" style="width: ${(burnedStats.total / burnedStats.nextMilestone * 100)}%"></div>
                        </div>
                        <div class="milestone-text">
                            ${burnedStats.itemsToNextMilestone} to ${burnedStats.nextMilestone} milestone
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Render review forecast
     */
    renderReviewForecast(forecast) {
        if (!forecast || forecast.length === 0) {
            return '<div class="card"><p>No upcoming reviews</p></div>';
        }

        const maxCount = Math.max(...forecast.map(h => h.count), 1);
        const now = new Date();
        
        return `
            <div class="card forecast-card">
                <h2 class="card-title">24-Hour Review Forecast</h2>
                
                <div class="forecast-chart">
                    ${forecast.slice(0, 24).map(hour => {
                        const isPast = hour.time < now;
                        const height = (hour.count / maxCount * 100);
                        const isHigh = hour.count >= 50;
                        
                        return `
                            <div class="forecast-bar" title="${hour.count} reviews at ${hour.time.getHours()}:00">
                                <div class="forecast-bar-fill ${isHigh ? 'forecast-high' : ''} ${isPast ? 'forecast-past' : ''}" 
                                     style="height: ${height}%">
                                </div>
                                <div class="forecast-bar-count">${hour.count > 0 ? hour.count : ''}</div>
                                <div class="forecast-bar-time">${hour.time.getHours()}</div>
                            </div>
                        `;
                    }).join('')}
                </div>
                
                <div class="forecast-legend">
                    <span>⏰ Time (24h format)</span>
                    <span>📊 Reviews per hour</span>
                </div>
            </div>
        `;
    }

    /**
     * Render leech summary
     */
    renderLeechSummary(leechAnalysis) {
        if (leechAnalysis.stats.totalLeeches === 0) {
            return `
                <div class="card success-card">
                    <h2 class="card-title">✨ No Leeches Detected!</h2>
                    <p class="success-message">Your accuracy is excellent. Keep up the great work!</p>
                </div>
            `;
        }

        return `
            <div class="card leech-summary-card">
                <div class="card-header">
                    <h2 class="card-title">🐛 Leech Summary</h2>
                    <button class="btn-primary" onclick="window.navigateTo('leeches')">
                        View Details →
                    </button>
                </div>
                
                <div class="leech-summary-grid">
                    <div class="leech-stat">
                        <div class="leech-stat-value leech-severe">${leechAnalysis.stats.bySeverity.severe}</div>
                        <div class="leech-stat-label">Severe</div>
                    </div>
                    <div class="leech-stat">
                        <div class="leech-stat-value leech-moderate">${leechAnalysis.stats.bySeverity.moderate}</div>
                        <div class="leech-stat-label">Moderate</div>
                    </div>
                    <div class="leech-stat">
                        <div class="leech-stat-value leech-mild">${leechAnalysis.stats.bySeverity.mild}</div>
                        <div class="leech-stat-label">Mild</div>
                    </div>
                    
                    ${leechAnalysis.stats.confusionPairs > 0 ? `
                        <div class="leech-stat">
                            <div class="leech-stat-value">⚠️ ${leechAnalysis.stats.confusionPairs}</div>
                            <div class="leech-stat-label">Confusion Pairs</div>
                        </div>
                    ` : ''}
                    
                    ${leechAnalysis.stats.rootCauses > 0 ? `
                        <div class="leech-stat">
                            <div class="leech-stat-value">🔍 ${leechAnalysis.stats.rootCauses}</div>
                            <div class="leech-stat-label">Root Causes</div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Render level completion projection
     */
    renderLevelProjection(projection) {
        const { kanjiProgress, timing, historicalData, projectionConfidence } = projection;

        // Get confidence badge color
        const confidenceBadgeClass = {
            high: 'badge-success',
            medium: 'badge-warning',
            low: 'badge-error'
        }[projectionConfidence] || 'badge-warning';

        // Get pace indicator
        const paceInfo = {
            faster: { icon: '🚀', text: 'Faster than average', class: 'projection-faster' },
            'on-track': { icon: '✓', text: 'On track', class: 'projection-on-track' },
            slower: { icon: '🐌', text: 'Slower than average', class: 'projection-slower' }
        }[timing.paceComparison] || { icon: '—', text: 'No data', class: '' };

        return `
            <div class="card projection-card">
                <div class="card-header">
                    <h2 class="card-title">📊 Level ${projection.currentLevel} Projection</h2>
                    <span class="card-badge ${confidenceBadgeClass}">
                        ${projectionConfidence.toUpperCase()} Confidence
                    </span>
                </div>

                <div class="projection-main">
                    ${timing.estimatedCompletionDate ? `
                        <div class="projection-date-section">
                            <div class="projection-label">Estimated Level Up</div>
                            <div class="projection-date">${this.formatDate(timing.estimatedCompletionDate)}</div>
                            <div class="projection-sublabel">
                                ${timing.estimatedDaysRemaining === 0 ? 'Today!' :
                                  timing.estimatedDaysRemaining === 1 ? 'Tomorrow' :
                                  `In ${timing.estimatedDaysRemaining} days`}
                            </div>
                        </div>
                    ` : `
                        <div class="projection-date-section">
                            <div class="projection-label">Estimated Level Up</div>
                            <div class="projection-date">—</div>
                            <div class="projection-sublabel">Insufficient data</div>
                        </div>
                    `}
                </div>

                <div class="projection-stats">
                    <div class="projection-stat">
                        <div class="projection-stat-label">Kanji Progress</div>
                        <div class="projection-stat-value">${kanjiProgress.current}/${kanjiProgress.needed}</div>
                        <div class="projection-stat-bar">
                            <div class="projection-stat-fill" style="width: ${kanjiProgress.percentage}%"></div>
                        </div>
                        <div class="projection-stat-sublabel">${kanjiProgress.remaining} remaining</div>
                    </div>

                    <div class="projection-stat">
                        <div class="projection-stat-label">Current Pace</div>
                        <div
                            class="projection-stat-value ${paceInfo.class}"
                            title="Compares your current level progress to your historical average. Faster = under 80% of average, On Track = 80-120% of average, Slower = over 120% of average"
                            style="cursor: help;"
                        >
                            ${paceInfo.icon} ${paceInfo.text}
                        </div>
                        ${timing.daysSinceLevelStart !== null ? `
                            <div class="projection-stat-sublabel">
                                ${timing.daysSinceLevelStart} days so far
                                ${timing.averageDaysPerLevel ? ` (avg: ${timing.averageDaysPerLevel} days)` : ''}
                            </div>
                        ` : ''}
                    </div>
                </div>

                ${historicalData.levelsAnalyzed > 0 ? `
                    <div class="projection-footer">
                        <span
                            title="Projection is based on your average completion time for the last ${historicalData.levelsAnalyzed} levels. Confidence varies based on consistency of your pace."
                            style="cursor: help; border-bottom: 1px dotted var(--text-secondary);"
                        >
                            📈 Based on ${historicalData.levelsAnalyzed} recent levels
                        </span>
                        ${historicalData.fastestLevel && historicalData.slowestLevel ? `
                            <span
                                title="Your fastest and slowest completed levels from recent history"
                                style="cursor: help; border-bottom: 1px dotted var(--text-secondary);"
                            >
                                ⏱️ Fastest: ${historicalData.fastestLevel}d • Slowest: ${historicalData.slowestLevel}d
                            </span>
                        ` : ''}
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Render workload analysis
     */
    renderWorkloadAnalysis(workload, lessonPace) {
        // Get workload level styling
        const workloadClasses = {
            light: 'workload-light',
            moderate: 'workload-moderate',
            heavy: 'workload-heavy'
        }[workload.workloadLevel] || '';

        const workloadColors = {
            light: 'var(--color-success)',
            moderate: 'var(--color-warning)',
            heavy: 'var(--color-error)'
        }[workload.workloadLevel] || 'var(--color-info)';

        return `
            <div class="card workload-card">
                <h2 class="card-title">⚖️ Workload Analysis</h2>

                <div class="workload-main">
                    <div class="workload-level-indicator ${workloadClasses}">
                        <div class="workload-level-icon">${this.getWorkloadIcon(workload.workloadLevel)}</div>
                        <div class="workload-level-text">${this.capitalize(workload.workloadLevel)}</div>
                    </div>
                </div>

                <div class="workload-breakdown">
                    <div class="workload-item">
                        <span class="workload-item-label">Apprentice Items</span>
                        <span class="workload-item-value">${workload.apprenticeItems}</span>
                    </div>
                    <div class="workload-item">
                        <span class="workload-item-label">Reviews Now</span>
                        <span class="workload-item-value">${workload.reviewsAvailable}</span>
                    </div>
                    <div class="workload-item">
                        <span class="workload-item-label">Next 24h</span>
                        <span class="workload-item-value">${workload.reviewsNext24Hours}</span>
                    </div>
                </div>

                <div class="workload-recommendation">
                    <div class="recommendation-icon">💡</div>
                    <div class="recommendation-text">${workload.recommendation}</div>
                </div>

                <div class="lesson-pace-section">
                    <div class="lesson-pace-header">
                        <span class="lesson-pace-label">Sustainable Pace</span>
                        <span class="lesson-pace-value">${lessonPace.recommendedLessonsPerDay} lessons/day</span>
                    </div>
                    <div class="lesson-pace-reasoning">${lessonPace.reasoning}</div>
                </div>

                <div class="workload-gauge">
                    <div class="gauge-bar">
                        <div class="gauge-fill" style="width: ${Math.min(workload.apprenticeItems / 200 * 100, 100)}%; background: ${workloadColors}"></div>
                    </div>
                    <div class="gauge-labels">
                        <span>0</span>
                        <span>100</span>
                        <span>200+</span>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render Guru candidates card
     */
    renderGuruCandidates(guruCandidates) {
        const { total, availableNow, availableLater, nextBatch } = guruCandidates;

        // Determine card styling based on number of candidates
        const hasMany = total >= 20;
        const hasSome = total >= 10;
        const statusColor = hasMany ? 'var(--color-success)' : hasSome ? 'var(--color-info)' : 'var(--text-secondary)';

        return `
            <div class="card guru-candidates-card">
                <h2 class="card-title">🎯 Today's Guru Candidates</h2>
                <p class="card-subtitle" style="margin-top: var(--spacing-xs); color: var(--text-secondary);">
                    Apprentice IV items that can reach Guru today
                </p>

                <div class="guru-candidates-main">
                    <div class="guru-count-display" style="border-color: ${statusColor};">
                        <div class="guru-count-number" style="color: ${statusColor};">
                            ${total}
                        </div>
                        <div class="guru-count-label">
                            ${total === 1 ? 'Item' : 'Items'} Today
                        </div>
                    </div>
                </div>

                ${total > 0 ? `
                    <div class="guru-breakdown">
                        ${availableNow > 0 ? `
                            <div class="guru-breakdown-item">
                                <span class="guru-breakdown-icon">✅</span>
                                <span class="guru-breakdown-text">
                                    <strong>${availableNow}</strong> available now
                                </span>
                            </div>
                        ` : ''}
                        ${nextBatch ? `
                            <div class="guru-breakdown-item">
                                <span class="guru-breakdown-icon">⏰</span>
                                <span class="guru-breakdown-text">
                                    <strong>${nextBatch.count}</strong> available in ${formatTimeUntil(nextBatch.time)}
                                    ${availableLater > nextBatch.count ? ` • ${availableLater - nextBatch.count} more later` : ''}
                                </span>
                            </div>
                        ` : ''}
                    </div>

                    <div class="guru-candidates-tip">
                        💡 Answer these correctly to move ${total} ${total === 1 ? 'item' : 'items'} from Apprentice IV → Guru I
                    </div>
                ` : `
                    <div class="guru-candidates-empty">
                        <p>No Apprentice IV items have reviews scheduled today.</p>
                        <small style="color: var(--text-secondary);">
                            Check back later or complete more lessons!
                        </small>
                    </div>
                `}
            </div>
        `;
    }

    // Helper methods

    formatDate(date) {
        const options = { month: 'short', day: 'numeric', year: 'numeric' };
        return new Date(date).toLocaleDateString('en-US', options);
    }

    formatTimeUntil(date) {
        const now = new Date();
        const diff = date - now;
        
        if (diff < 0) return 'Now';
        
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        if (hours === 0) return `${minutes}m`;
        if (hours < 24) return `${hours}h ${minutes}m`;
        
        const days = Math.floor(hours / 24);
        return `${days}d ${hours % 24}h`;
    }

    getWorkloadIcon(level) {
        const icons = {
            light: '🌤️',
            moderate: '⚖️',
            heavy: '⚠️'
        };
        return icons[level] || '📊';
    }

    getAccuracyClass(accuracy) {
        if (accuracy >= 90) return 'accuracy-excellent';
        if (accuracy >= 80) return 'accuracy-good';
        if (accuracy >= 70) return 'accuracy-fair';
        return 'accuracy-poor';
    }

    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}

export default Dashboard;
