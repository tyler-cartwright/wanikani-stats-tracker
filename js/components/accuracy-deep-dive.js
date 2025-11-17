// Accuracy Deep Dive Component
// Comprehensive accuracy analysis

import { calculateAccuracyStats, calculateAccuracyByLevel } from '../calculations/accuracy-analyzer.js';

export class AccuracyDeepDive {
    constructor(reviewStats, subjects, assignments) {
        this.reviewStats = reviewStats;
        this.subjects = subjects;
        this.assignments = assignments;
        this.stats = calculateAccuracyStats(reviewStats);
        this.byLevel = calculateAccuracyByLevel(reviewStats, subjects);
    }

    /**
     * Render accuracy deep dive
     * @returns {string} HTML string
     */
    render() {
        return `
            <div class="accuracy-deep-dive">
                ${this.renderOverview()}

                <div class="accuracy-grid">
                    ${this.renderByType()}
                    ${this.renderMeaningVsReading()}
                </div>

                ${this.renderByLevel()}
            </div>
        `;
    }

    /**
     * Render overview section
     */
    renderOverview() {
        return `
            <div class="card accuracy-overview">
                <h2 class="card-title">Overall Accuracy</h2>
                
                <div class="accuracy-overview-grid">
                    <div class="accuracy-overview-main">
                        <div class="accuracy-circle-xl ${this.getAccuracyClass(this.stats.overall)}">
                            <div class="accuracy-value">${this.stats.overall.toFixed(1)}%</div>
                            <div class="accuracy-label">Overall</div>
                        </div>
                        <div class="accuracy-overview-total">
                            ${this.stats.totalAttempts.toLocaleString()} total reviews
                        </div>
                    </div>

                    <div class="accuracy-overview-split">
                        <div class="accuracy-split-item">
                            <div class="accuracy-split-circle ${this.getAccuracyClass(this.stats.meaning)}">
                                ${this.stats.meaning.toFixed(1)}%
                            </div>
                            <div class="accuracy-split-label">Meaning</div>
                        </div>

                        <div class="accuracy-split-item">
                            <div class="accuracy-split-circle ${this.getAccuracyClass(this.stats.reading)}">
                                ${this.stats.reading.toFixed(1)}%
                            </div>
                            <div class="accuracy-split-label">Reading</div>
                        </div>
                    </div>
                </div>

                ${this.renderAccuracyInterpretation()}
            </div>
        `;
    }

    /**
     * Render accuracy interpretation
     */
    renderAccuracyInterpretation() {
        const overall = this.stats.overall;
        let message = '';
        let color = '';

        if (overall >= 90) {
            message = '🌟 Excellent! You have outstanding accuracy across your reviews.';
            color = 'var(--color-success)';
        } else if (overall >= 80) {
            message = '👍 Good job! Your accuracy is solid. Keep practicing to reach 90%+';
            color = 'var(--color-info)';
        } else if (overall >= 70) {
            message = '⚠️ Fair accuracy. Consider slowing down your review pace and double-checking answers.';
            color = 'var(--color-warning)';
        } else {
            message = '⚡ Low accuracy detected. Focus on problem items and consider reviewing mnemonics.';
            color = 'var(--color-error)';
        }

        return `
            <div class="accuracy-interpretation" style="background: ${color}20; border-left: 4px solid ${color}; padding: var(--spacing-md); border-radius: var(--radius-sm); margin-top: var(--spacing-lg);">
                <p style="color: var(--text-primary); margin: 0;">${message}</p>
            </div>
        `;
    }

    /**
     * Render accuracy by type
     */
    renderByType() {
        return `
            <div class="card">
                <h3 class="card-title">Accuracy by Type</h3>
                
                <div class="accuracy-type-list">
                    ${Object.entries(this.stats.byType).map(([type, data]) => `
                        <div class="accuracy-type-item">
                            <div class="accuracy-type-header">
                                <span class="type-badge type-${type}">${this.capitalize(type)}</span>
                                <span class="accuracy-type-count">${data.total} items</span>
                            </div>
                            
                            <div class="accuracy-type-bar-container">
                                <div class="accuracy-type-bar">
                                    <div class="accuracy-type-fill ${this.getAccuracyClass(data.accuracy)}" 
                                         style="width: ${data.accuracy}%">
                                    </div>
                                </div>
                                <div class="accuracy-type-value">${data.accuracy.toFixed(1)}%</div>
                            </div>

                            <div class="accuracy-type-stats">
                                ${data.correct} correct • ${data.incorrect} incorrect
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Render meaning vs reading comparison
     */
    renderMeaningVsReading() {
        const meaningBetter = this.stats.meaning > this.stats.reading;
        const diff = Math.abs(this.stats.meaning - this.stats.reading);

        return `
            <div class="card">
                <h3 class="card-title">Meaning vs Reading</h3>
                
                <div class="comparison-visual">
                    <div class="comparison-bar-container">
                        <div class="comparison-label">Meaning</div>
                        <div class="comparison-bar">
                            <div class="comparison-fill comparison-meaning" style="width: ${this.stats.meaning}%">
                                ${this.stats.meaning.toFixed(1)}%
                            </div>
                        </div>
                    </div>

                    <div class="comparison-bar-container">
                        <div class="comparison-label">Reading</div>
                        <div class="comparison-bar">
                            <div class="comparison-fill comparison-reading" style="width: ${this.stats.reading}%">
                                ${this.stats.reading.toFixed(1)}%
                            </div>
                        </div>
                    </div>
                </div>

                ${diff > 5 ? `
                    <div class="comparison-insight">
                        ${meaningBetter
                            ? `💡 Your <strong>reading</strong> accuracy is ${diff.toFixed(1)}% lower than meaning. Focus more on reading practice.`
                            : `💡 Your <strong>meaning</strong> accuracy is ${diff.toFixed(1)}% lower than reading. Review mnemonics for meanings.`
                        }
                    </div>
                ` : `
                    <div class="comparison-insight">
                        ✅ Your meaning and reading accuracy are well-balanced!
                    </div>
                `}
            </div>
        `;
    }

    /**
     * Render accuracy by level chart
     */
    renderByLevel() {
        const levels = Object.keys(this.byLevel).sort((a, b) => parseInt(a) - parseInt(b));

        if (levels.length === 0) {
            return `
                <div class="card">
                    <h3 class="card-title">Accuracy by Level</h3>
                    <p style="text-align: center; color: var(--text-secondary); padding: var(--spacing-xl);">
                        No review data available yet.
                    </p>
                </div>
            `;
        }

        return `
            <div class="card">
                <h3 class="card-title">Accuracy by Level</h3>
                <p class="card-subtitle" style="margin-top: var(--spacing-xs); color: var(--text-secondary);">
                    Track your accuracy performance across different levels
                </p>

                <div class="level-accuracy-chart">
                    ${levels.map(level => {
                        const data = this.byLevel[level];
                        const heightPercent = data.accuracy;

                        return `
                            <div class="level-accuracy-bar-container">
                                <div class="level-accuracy-value">${data.accuracy.toFixed(0)}%</div>
                                <div class="level-accuracy-bar" title="Level ${level}: ${data.accuracy.toFixed(1)}% (${data.total} reviews)">
                                    <div class="level-accuracy-fill ${this.getAccuracyClass(data.accuracy)}"
                                         style="height: ${heightPercent}%"></div>
                                </div>
                                <div class="level-accuracy-label">L${level}</div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    // Helper methods

    getAccuracyClass(accuracy) {
        if (accuracy >= 90) return 'accuracy-excellent';
        if (accuracy >= 80) return 'accuracy-good';
        if (accuracy >= 70) return 'accuracy-fair';
        return 'accuracy-poor';
    }

    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1).replace('_', ' ');
    }
}

export default AccuracyDeepDive;
