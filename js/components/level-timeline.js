// Level Progression Timeline Component
// Visual timeline of all completed levels

import { getAllLevelDurations } from '../calculations/level-completion-projector.js';

export class LevelTimeline {
    constructor(levelProgressions, user) {
        this.levelProgressions = levelProgressions;
        this.currentLevel = user.data.level;
        this.durations = getAllLevelDurations(levelProgressions);
    }

    /**
     * Render timeline
     * @returns {string} HTML string
     */
    render() {
        if (this.durations.length === 0) {
            return `
                <div class="card">
                    <p style="text-align: center; color: var(--text-secondary);">
                        No completed levels yet. Keep studying!
                    </p>
                </div>
            `;
        }

        const avgDuration = this.calculateAverage(this.durations.map(d => d.duration));
        const fastestLevel = Math.min(...this.durations.map(d => d.duration));
        const slowestLevel = Math.max(...this.durations.map(d => d.duration));

        return `
            <div class="timeline-container">
                ${this.renderStats(avgDuration, fastestLevel, slowestLevel)}
                ${this.renderTimeline()}
            </div>
        `;
    }

    /**
     * Render stats summary
     */
    renderStats(avg, fastest, slowest) {
        return `
            <div class="timeline-stats">
                <div class="timeline-stat">
                    <div class="timeline-stat-value">${avg.toFixed(1)} days</div>
                    <div class="timeline-stat-label">Average</div>
                </div>
                <div class="timeline-stat">
                    <div class="timeline-stat-value">${fastest} days</div>
                    <div class="timeline-stat-label">Fastest</div>
                </div>
                <div class="timeline-stat">
                    <div class="timeline-stat-value">${slowest} days</div>
                    <div class="timeline-stat-label">Slowest</div>
                </div>
                <div class="timeline-stat">
                    <div class="timeline-stat-value">${this.durations.length}</div>
                    <div class="timeline-stat-label">Completed Levels</div>
                </div>
            </div>
        `;
    }

    /**
     * Render timeline
     */
    renderTimeline() {
        const avgDuration = this.calculateAverage(this.durations.map(d => d.duration));

        return `
            <div class="timeline">
                ${this.durations.map(level => this.renderTimelineItem(level, avgDuration)).join('')}
                
                ${this.currentLevel > this.durations.length ? `
                    <div class="timeline-item timeline-item-current">
                        <div class="timeline-marker timeline-marker-current">
                            <div class="timeline-level">${this.currentLevel}</div>
                        </div>
                        <div class="timeline-content">
                            <div class="timeline-title">Level ${this.currentLevel}</div>
                            <div class="timeline-subtitle">Current Level - In Progress</div>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Render timeline item
     */
    renderTimelineItem(level, avgDuration) {
        const speed = this.getSpeedClass(level.duration, avgDuration);
        const startDate = new Date(level.unlockedAt);
        const endDate = new Date(level.passedAt);

        return `
            <div class="timeline-item">
                <div class="timeline-marker timeline-marker-${speed}">
                    <div class="timeline-level">${level.level}</div>
                </div>
                <div class="timeline-content">
                    <div class="timeline-header">
                        <div class="timeline-title">Level ${level.level}</div>
                        <div class="timeline-duration timeline-duration-${speed}">
                            ${level.duration} days
                        </div>
                    </div>
                    <div class="timeline-dates">
                        ${this.formatDate(startDate)} → ${this.formatDate(endDate)}
                    </div>
                </div>
            </div>
        `;
    }

    // Helper methods

    getSpeedClass(duration, avg) {
        if (duration < avg * 0.8) return 'fast';
        if (duration > avg * 1.2) return 'slow';
        return 'average';
    }

    calculateAverage(numbers) {
        return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
    }

    formatDate(date) {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
}

export default LevelTimeline;
