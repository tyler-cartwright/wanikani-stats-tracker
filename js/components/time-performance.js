// Time-of-Day Performance Component
// Visualizes review accuracy by hour of day

import { analyzeTimePerformance, getPerformanceCategory, detectTimePreference } from '../calculations/time-performance-analyzer.js';

export class TimePerformance {
    constructor(reviewStats) {
        this.reviewStats = reviewStats;
        this.analysis = analyzeTimePerformance(reviewStats);
    }

    /**
     * Render time performance analysis
     * @returns {string} HTML string
     */
    render() {
        if (!this.analysis.hasData) {
            return `
                <div class="card">
                    <h3 class="card-title">⏰ Time-of-Day Performance</h3>
                    <p style="text-align: center; color: var(--text-secondary); padding: var(--spacing-xl);">
                        No review data available yet. Complete some reviews to see when you perform best!
                    </p>
                </div>
            `;
        }

        const timePreference = detectTimePreference(this.analysis.bestHours);

        return `
            <div class="card time-performance-card">
                <h3 class="card-title">⏰ Time-of-Day Performance</h3>
                <p class="card-subtitle" style="margin-top: var(--spacing-xs); color: var(--text-secondary);">
                    Analyze your review accuracy across different hours to find your optimal study time
                </p>

                ${this.renderSummary(timePreference)}
                ${this.renderHeatmap()}
                ${this.renderInsights()}
            </div>
        `;
    }

    /**
     * Render summary section
     */
    renderSummary(timePreference) {
        return `
            <div class="time-performance-summary">
                <div class="time-preference-badge">
                    <div class="time-preference-emoji">${timePreference.emoji}</div>
                    <div class="time-preference-text">${timePreference.description}</div>
                </div>

                <div class="time-stats-grid">
                    <div class="time-stat">
                        <div class="time-stat-value">${this.analysis.averageAccuracy.toFixed(0)}%</div>
                        <div class="time-stat-label">Average Accuracy</div>
                    </div>
                    <div class="time-stat">
                        <div class="time-stat-value">${this.analysis.totalReviews.toLocaleString()}</div>
                        <div class="time-stat-label">Total Reviews</div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render heatmap visualization
     */
    renderHeatmap() {
        const { hourData, averageAccuracy } = this.analysis;

        return `
            <div class="time-heatmap-container">
                <div class="time-heatmap">
                    ${hourData.map(data => {
                        const category = data.total > 0
                            ? getPerformanceCategory(data.accuracy, averageAccuracy)
                            : 'no-data';

                        const isReliable = data.total >= this.analysis.reliableDataThreshold;

                        return `
                            <div class="time-heatmap-cell time-performance-${category} ${!isReliable && data.total > 0 ? 'low-data' : ''}"
                                 title="${this.formatHourRange(data.hour)}: ${data.total > 0 ? `${data.accuracy.toFixed(1)}% (${data.total} reviews)` : 'No data'}"
                                 data-hour="${data.hour}">
                                <div class="time-heatmap-hour">${this.formatHour(data.hour)}</div>
                                <div class="time-heatmap-value">
                                    ${data.total > 0 ? `${data.accuracy.toFixed(0)}%` : '—'}
                                </div>
                                <div class="time-heatmap-count">
                                    ${data.total > 0 ? `${data.total}` : ''}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>

                <div class="time-heatmap-legend">
                    <div class="legend-item">
                        <div class="legend-box time-performance-excellent"></div>
                        <span>Above Average</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-box time-performance-good"></div>
                        <span>Average</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-box time-performance-average"></div>
                        <span>Below Average</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-box time-performance-poor"></div>
                        <span>Poor</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-box time-performance-no-data"></div>
                        <span>No Data</span>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render insights section
     */
    renderInsights() {
        const { bestHours, worstHours, recommendation } = this.analysis;

        return `
            <div class="time-performance-insights">
                <div class="time-recommendation">
                    ${recommendation}
                </div>

                <div class="time-insights-grid">
                    <div class="time-insight-card time-insight-best">
                        <h4 class="time-insight-title">🌟 Best Performance</h4>
                        <div class="time-insight-list">
                            ${bestHours.slice(0, 3).map(hour => `
                                <div class="time-insight-item">
                                    <span class="time-insight-time">${this.formatHourRange(hour.hour)}</span>
                                    <span class="time-insight-accuracy">${hour.accuracy.toFixed(0)}%</span>
                                    <span class="time-insight-count">${hour.total} reviews</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <div class="time-insight-card time-insight-worst">
                        <h4 class="time-insight-title">⚠️ Room for Improvement</h4>
                        <div class="time-insight-list">
                            ${worstHours.slice(0, 3).map(hour => `
                                <div class="time-insight-item">
                                    <span class="time-insight-time">${this.formatHourRange(hour.hour)}</span>
                                    <span class="time-insight-accuracy">${hour.accuracy.toFixed(0)}%</span>
                                    <span class="time-insight-count">${hour.total} reviews</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>

                ${this.renderDataReliabilityNote()}
            </div>
        `;
    }

    /**
     * Render data reliability note
     */
    renderDataReliabilityNote() {
        const unreliableHours = this.analysis.hourData.filter(
            h => h.total > 0 && h.total < this.analysis.reliableDataThreshold
        );

        if (unreliableHours.length === 0) {
            return '';
        }

        return `
            <div class="time-reliability-note">
                <small>
                    📊 Some hours have limited data (&lt;${this.analysis.reliableDataThreshold} reviews) and may not be fully reliable.
                    Continue reviewing at different times for more accurate insights.
                </small>
            </div>
        `;
    }

    // Helper methods

    formatHour(hour) {
        if (hour === 0) return '12a';
        if (hour === 12) return '12p';
        if (hour < 12) return `${hour}a`;
        return `${hour - 12}p`;
    }

    formatHourRange(hour) {
        const start = hour;
        const end = (hour + 1) % 24;

        const formatHour = (h) => {
            if (h === 0) return '12 AM';
            if (h === 12) return '12 PM';
            if (h < 12) return `${h} AM`;
            return `${h - 12} PM`;
        };

        return `${formatHour(start)}-${formatHour(end)}`;
    }
}

export default TimePerformance;
