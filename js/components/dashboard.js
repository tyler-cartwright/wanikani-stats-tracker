// Dashboard Component
// Main dashboard view with overview statistics

import { calculateSRSDistribution } from '../calculations/srs-distribution.js';
import { calculateLevelProgress } from '../calculations/level-progress.js';
import { calculateAccuracyStats } from '../calculations/accuracy-analyzer.js';
import { calculateBurnedStats } from '../calculations/burned-items-tracker.js';
import { generate24HourForecast, getCurrentReviewCount } from '../calculations/review-forecast.js';
import { calculateWorkload } from '../calculations/workload-calculator.js';

export class Dashboard {
    constructor(appData) {
        this.appData = appData;
    }

    /**
     * Render complete dashboard
     * @returns {string} HTML string
     */
    render() {
        const { user, summary, assignments, reviewStats, subjects, leechAnalysis } = this.appData;
        
        // Calculate all statistics
        const srsDistribution = calculateSRSDistribution(assignments);
        const levelProgress = calculateLevelProgress(assignments, user);
        const accuracyStats = calculateAccuracyStats(reviewStats);
        const burnedStats = calculateBurnedStats(assignments);
        const currentReviews = getCurrentReviewCount(summary);
        const forecast = generate24HourForecast(summary);
        const workload = calculateWorkload(assignments, summary);

        console.log('Dashboard Data:', {
            srsDistribution,
            levelProgress,
            assignments: assignments.length,
            userLevel: user.data.level
        });

        return `
            <div class="dashboard">
                ${this.renderHeader(user)}
                ${this.renderQuickStats(currentReviews, summary, workload, leechAnalysis)}
                ${this.renderLevelProgress(levelProgress)}
                
                <div class="dashboard-grid">
                    <div class="dashboard-col-2">
                        ${this.renderSRSDistribution(srsDistribution)}
                    </div>
                    <div class="dashboard-col-1">
                        ${this.renderAccuracySummary(accuracyStats)}
                        ${this.renderBurnedItems(burnedStats)}
                    </div>
                </div>
                
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
                    <p class="dashboard-subtitle">Level ${user.data.level} ‚Ä¢ Keep up the great work</p>
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
                    <div class="stat-icon">Ì≥ö</div>
                    <div class="stat-content">
                        <div class="stat-value">${currentReviews}</div>
                        <div class="stat-label">Reviews Now</div>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">Ì≥ñ</div>
                    <div class="stat-content">
                        <div class="stat-value">${lessonsAvailable}</div>
                        <div class="stat-label">Lessons Available</div>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">‚è∞</div>
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
                    <div class="stat-icon">${leechAnalysis.stats.totalLeeches > 0 ? 'Ì¥•' : '‚ú®'}</div>
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
        
        const kanjiPercent = levelProgress.kanji.neededToPass > 0
            ? (levelProgress.kanji.atGuru / levelProgress.kanji.neededToPass * 100)
            : 0;
        const radicalsPercent = levelProgress.radicals.total > 0
            ? levelProgress.radicals.percentage
            : 0;
        const vocabPercent = levelProgress.vocabulary.total > 0
            ? levelProgress.vocabulary.percentage
            : 0;

        return `
            <div class="card level-progress-card">
                <div class="card-header">
                    <h2 class="card-title">Level ${levelProgress.currentLevel} Progress</h2>
                    <span class="card-badge ${levelProgress.overall.isPassed ? 'badge-success' : 'badge-warning'}">
                        ${levelProgress.overall.isPassed ? 'Passed ‚úì' : 'In Progress'}
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
                        <span>Ì≥Ö ${levelProgress.overall.daysSinceLevelStart} days on this level</span>
                        <span>ÌæØ ${levelProgress.kanji.remainingToPass} kanji to level up</span>
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
                <h2 class="card-title">Burned Items Ì¥•</h2>
                
                <div class="burned-main">
                    <div class="burned-total">${burnedStats.total}</div>
                    <div class="burned-subtitle">${burnedStats.percentage}% of all items</div>
                </div>
                
                <div class="burned-breakdown">
                    <div class="burned-type">
                        <span class="burned-type-icon">‚öõÔ∏è</span>
                        <span class="burned-type-count">${burnedStats.byType.radical}</span>
                    </div>
                    <div class="burned-type">
                        <span class="burned-type-icon">Ì∏∑Ô∏è</span>
                        <span class="burned-type-count">${burnedStats.byType.kanji}</span>
                    </div>
                    <div class="burned-type">
                        <span class="burned-type-icon">Ì≥ù</span>
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
                    <span>Ìµê Time (24h format)</span>
                    <span>Ì≥ä Reviews per hour</span>
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
                    <h2 class="card-title">Ìæâ No Leeches Detected!</h2>
                    <p class="success-message">Your accuracy is excellent. Keep up the great work!</p>
                </div>
            `;
        }

        return `
            <div class="card leech-summary-card">
                <div class="card-header">
                    <h2 class="card-title">Ì¥• Leech Summary</h2>
                    <button class="btn-primary" onclick="window.navigateTo('leeches')">
                        View Details ‚Üí
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
                            <div class="leech-stat-value">‚ö†Ô∏è ${leechAnalysis.stats.confusionPairs}</div>
                            <div class="leech-stat-label">Confusion Pairs</div>
                        </div>
                    ` : ''}
                    
                    ${leechAnalysis.stats.rootCauses > 0 ? `
                        <div class="leech-stat">
                            <div class="leech-stat-value">ÌæØ ${leechAnalysis.stats.rootCauses}</div>
                            <div class="leech-stat-label">Root Causes</div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    // Helper methods

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
            light: 'Ì∏ä',
            moderate: 'Ì∏ê',
            heavy: 'Ì∏∞'
        };
        return icons[level] || 'Ì≥ä';
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
