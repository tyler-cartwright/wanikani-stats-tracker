// Level 60 Timeline Component
// Displays projection timeline to reach level 60

import { projectToLevel60 } from '../calculations/level-60-projector.js';

export class Level60Timeline {
    constructor(levelProgressions, user) {
        this.projection = projectToLevel60(levelProgressions, user);
    }

    /**
     * Render level 60 timeline
     * @returns {string} HTML string
     */
    render() {
        // If already at level 60
        if (this.projection.isComplete) {
            return this.renderComplete();
        }

        // If insufficient data
        if (this.projection.confidence === 'none') {
            return this.renderInsufficientData();
        }

        return `
            <div class="level-60-projection">
                ${this.renderHeader()}
                ${this.renderMainProjection()}
                ${this.renderScenarios()}
                ${this.renderMilestones()}
                ${this.renderFooter()}
            </div>
        `;
    }

    /**
     * Render header with main stats
     */
    renderHeader() {
        const { currentLevel, levelsRemaining, estimatedDays, estimatedDate, confidence } = this.projection;

        const confidenceBadgeClass = {
            'high': 'badge-success',
            'medium': 'badge-warning',
            'low': 'badge-error',
            'very-low': 'badge-error'
        }[confidence] || 'badge-warning';

        return `
            <div class="level-60-header">
                <div class="level-60-main-stat">
                    <div class="level-60-big-number">${levelsRemaining}</div>
                    <div class="level-60-label">Levels to Go</div>
                </div>
                <div class="level-60-divider"></div>
                <div class="level-60-main-stat">
                    <div class="level-60-big-number">${this.formatDaysToMonths(estimatedDays)}</div>
                    <div class="level-60-label">Estimated Time</div>
                    <div class="level-60-sublabel">${this.formatDate(estimatedDate)}</div>
                </div>
                <span class="card-badge ${confidenceBadgeClass}" style="position: absolute; top: var(--spacing-md); right: var(--spacing-md);">
                    ${confidence.toUpperCase().replace('-', ' ')} CONFIDENCE
                </span>
            </div>
        `;
    }

    /**
     * Render main projection
     */
    renderMainProjection() {
        const { historicalData } = this.projection;

        return `
            <div class="level-60-summary">
                <div class="level-60-summary-item">
                    <div class="level-60-summary-icon">📊</div>
                    <div class="level-60-summary-content">
                        <div class="level-60-summary-value">${historicalData.averageDaysPerLevel} days</div>
                        <div class="level-60-summary-label">Average per Level</div>
                    </div>
                </div>
                <div class="level-60-summary-item">
                    <div class="level-60-summary-icon">📈</div>
                    <div class="level-60-summary-content">
                        <div class="level-60-summary-value">${historicalData.completedLevels} levels</div>
                        <div class="level-60-summary-label">Historical Data</div>
                    </div>
                </div>
                <div class="level-60-summary-item">
                    <div class="level-60-summary-icon">🎯</div>
                    <div class="level-60-summary-content">
                        <div class="level-60-summary-value">${historicalData.fastestPace} - ${historicalData.slowestPace} days</div>
                        <div class="level-60-summary-label">Pace Range</div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render scenarios (fast-track, expected, conservative)
     */
    renderScenarios() {
        const { scenarios } = this.projection;

        return `
            <div class="level-60-scenarios">
                <h3 style="margin: 0 0 var(--spacing-md) 0; font-size: 1rem; color: var(--text-primary);">
                    📅 Completion Scenarios
                </h3>
                <div class="level-60-scenarios-grid">
                    ${this.renderScenario('Fast Track', scenarios.fastTrack, '🚀', 'If you maintain your fastest pace')}
                    ${this.renderScenario('Expected', scenarios.expected, '🎯', 'Based on your average pace')}
                    ${this.renderScenario('Conservative', scenarios.conservative, '🐢', 'If pace slows to your slowest')}
                </div>
            </div>
        `;
    }

    /**
     * Render individual scenario
     */
    renderScenario(title, scenario, icon, description) {
        return `
            <div class="level-60-scenario">
                <div class="level-60-scenario-header">
                    <span class="level-60-scenario-icon">${icon}</span>
                    <span class="level-60-scenario-title">${title}</span>
                </div>
                <div class="level-60-scenario-date">${this.formatDate(scenario.date)}</div>
                <div class="level-60-scenario-time">${this.formatDaysToMonths(scenario.days)}</div>
                <div class="level-60-scenario-description">${description}</div>
                <div class="level-60-scenario-pace">${scenario.pacePerLevel} days/level</div>
            </div>
        `;
    }

    /**
     * Render milestones
     */
    renderMilestones() {
        const { milestones } = this.projection;

        if (milestones.length === 0) {
            return '';
        }

        return `
            <div class="level-60-milestones">
                <h3 style="margin: 0 0 var(--spacing-md) 0; font-size: 1rem; color: var(--text-primary);">
                    🎖️ Level Milestones
                </h3>
                <div class="level-60-milestones-list">
                    ${milestones.map(milestone => this.renderMilestone(milestone)).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Render individual milestone
     */
    renderMilestone(milestone) {
        const statusClass = milestone.status === 'completed' ? 'milestone-completed' : 'milestone-projected';
        const statusIcon = milestone.status === 'completed' ? '✓' : '○';

        return `
            <div class="level-60-milestone ${statusClass}">
                <div class="level-60-milestone-marker">${statusIcon}</div>
                <div class="level-60-milestone-content">
                    <div class="level-60-milestone-level">Level ${milestone.level}</div>
                    <div class="level-60-milestone-date">
                        ${milestone.isPast ? this.formatDate(milestone.date) :
                          `${this.formatDate(milestone.date)} (in ${this.formatDaysToMonths(milestone.daysFromNow)})`}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render footer with notes
     */
    renderFooter() {
        const { confidence, historicalData } = this.projection;

        let confidenceNote = '';
        if (confidence === 'high') {
            confidenceNote = 'High confidence: Your pace has been very consistent.';
        } else if (confidence === 'medium') {
            confidenceNote = 'Medium confidence: Your pace varies somewhat. Actual completion may differ.';
        } else if (confidence === 'low' || confidence === 'very-low') {
            confidenceNote = 'Low confidence: Limited data or inconsistent pace. Complete more levels for better accuracy.';
        }

        return `
            <div class="level-60-footer">
                <div class="level-60-note">
                    <span style="opacity: 0.7;">ℹ️</span> ${confidenceNote}
                    Projections based on ${historicalData.recentLevelsAnalyzed} most recent completed levels.
                </div>
            </div>
        `;
    }

    /**
     * Render completion message
     */
    renderComplete() {
        return `
            <div class="level-60-complete">
                <div class="level-60-complete-icon">🎉</div>
                <div class="level-60-complete-title">Congratulations!</div>
                <div class="level-60-complete-message">
                    You've reached level 60! You've completed your WaniKani journey.
                </div>
            </div>
        `;
    }

    /**
     * Render insufficient data message
     */
    renderInsufficientData() {
        return `
            <div class="level-60-insufficient">
                <div class="level-60-insufficient-icon">📊</div>
                <div class="level-60-insufficient-title">Not Enough Data Yet</div>
                <div class="level-60-insufficient-message">
                    Complete more levels to get an accurate projection to level 60.
                    <br><br>
                    Keep studying! Your timeline will appear here once you've completed a few levels.
                </div>
            </div>
        `;
    }

    // Helper methods

    formatDate(date) {
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }

    formatDaysToMonths(days) {
        if (days === null || days === undefined) {
            return 'N/A';
        }

        if (days < 30) {
            return `${days} days`;
        } else if (days < 365) {
            const months = Math.floor(days / 30);
            const remainingDays = days % 30;
            if (remainingDays === 0) {
                return `${months} ${months === 1 ? 'month' : 'months'}`;
            }
            return `${months}mo ${remainingDays}d`;
        } else {
            const years = Math.floor(days / 365);
            const remainingMonths = Math.floor((days % 365) / 30);
            if (remainingMonths === 0) {
                return `${years} ${years === 1 ? 'year' : 'years'}`;
            }
            return `${years}y ${remainingMonths}mo`;
        }
    }
}

export default Level60Timeline;
