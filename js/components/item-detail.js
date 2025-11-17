// Item Detail Component
// Detailed view for individual items

export class ItemDetail {
    constructor(subjectId, subjects, assignments, reviewStats) {
        this.subjectId = subjectId;
        this.subject = subjects.find(s => s.id === subjectId);
        this.assignment = assignments.find(a => a.data.subject_id === subjectId);
        this.stats = reviewStats.find(s => s.data.subject_id === subjectId);
    }

    /**
     * Render item detail view
     * @returns {string} HTML string
     */
    render() {
        if (!this.subject) {
            return `
                <div class="card">
                    <p>Item not found.</p>
                    <button class="btn-secondary" onclick="window.closeItemDetail()">Close</button>
                </div>
            `;
        }

        return `
            <div class="item-detail-container">
                <div class="item-detail-header">
                    <button class="btn-secondary" onclick="window.closeItemDetail()">← Back</button>
                    <a href="https://www.wanikani.com/${this.subject.object}/${this.subject.data.slug}" 
                       target="_blank" 
                       class="btn-primary">
                        View on WaniKani →
                    </a>
                </div>

                ${this.renderMainInfo()}
                
                <div class="item-detail-grid">
                    ${this.renderSRSInfo()}
                    ${this.renderAccuracyInfo()}
                </div>

                ${this.renderMeaningsReadings()}
                ${this.renderComponents()}
                ${this.renderUsedIn()}
            </div>
        `;
    }

    /**
     * Render main item info
     */
    renderMainInfo() {
        const character = this.subject.data.characters || this.subject.data.meaning_mnemonic?.substring(0, 50) || 'N/A';
        const meanings = this.subject.data.meanings?.map(m => m.meaning).join(', ') || 'N/A';
        const primaryMeaning = this.subject.data.meanings?.find(m => m.primary)?.meaning || meanings.split(',')[0];

        return `
            <div class="item-detail-main">
                <div class="item-character ${this.subject.object}">
                    ${character}
                </div>
                <div class="item-main-info">
                    <h1 class="item-title">${primaryMeaning}</h1>
                    <div class="item-meta">
                        <span class="type-badge type-${this.subject.object}">
                            ${this.capitalize(this.subject.object)}
                        </span>
                        <span class="item-level">Level ${this.subject.data.level}</span>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render SRS information
     */
    renderSRSInfo() {
        if (!this.assignment) {
            return `
                <div class="card">
                    <h3 class="card-title">SRS Progress</h3>
                    <p style="color: var(--text-secondary);">Not started yet</p>
                </div>
            `;
        }

        const srsStage = this.assignment.data.srs_stage;
        const stageName = this.getSRSStageName(srsStage);
        const nextReview = this.assignment.data.available_at 
            ? new Date(this.assignment.data.available_at)
            : null;

        return `
            <div class="card">
                <h3 class="card-title">SRS Progress</h3>
                
                <div class="srs-stage-display">
                    <div class="srs-badge srs-${this.getSRSCategory(srsStage)}" style="font-size: var(--font-size-lg); padding: var(--spacing-md);">
                        ${stageName}
                    </div>
                </div>

                ${nextReview ? `
                    <div class="srs-next-review">
                        <div class="srs-label">Next Review</div>
                        <div class="srs-time">${this.formatDateTime(nextReview)}</div>
                        <div class="srs-countdown">${this.getTimeUntil(nextReview)}</div>
                    </div>
                ` : srsStage === 9 ? `
                    <div class="srs-next-review">
                        <div class="srs-label">🔥 Burned!</div>
                        <div style="color: var(--text-secondary); font-size: var(--font-size-sm); margin-top: var(--spacing-xs);">
                            This item is complete
                        </div>
                    </div>
                ` : ''}

                ${this.assignment.data.started_at ? `
                    <div class="srs-dates">
                        <div class="srs-date-item">
                            <span class="srs-date-label">Started:</span>
                            <span>${this.formatDate(new Date(this.assignment.data.started_at))}</span>
                        </div>
                        ${this.assignment.data.passed_at ? `
                            <div class="srs-date-item">
                                <span class="srs-date-label">Passed:</span>
                                <span>${this.formatDate(new Date(this.assignment.data.passed_at))}</span>
                            </div>
                        ` : ''}
                        ${this.assignment.data.burned_at ? `
                            <div class="srs-date-item">
                                <span class="srs-date-label">Burned:</span>
                                <span>${this.formatDate(new Date(this.assignment.data.burned_at))}</span>
                            </div>
                        ` : ''}
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Render accuracy information
     */
    renderAccuracyInfo() {
        if (!this.stats) {
            return `
                <div class="card">
                    <h3 class="card-title">Accuracy</h3>
                    <p style="color: var(--text-secondary);">No review data yet</p>
                </div>
            `;
        }

        const overall = this.stats.data.percentage_correct;
        const meaningAcc = this.calculateComponentAccuracy(
            this.stats.data.meaning_correct,
            this.stats.data.meaning_incorrect
        );
        const readingAcc = this.calculateComponentAccuracy(
            this.stats.data.reading_correct,
            this.stats.data.reading_incorrect
        );

        return `
            <div class="card">
                <h3 class="card-title">Accuracy</h3>
                
                <div class="accuracy-circle-large ${this.getAccuracyClass(overall)}">
                    <div class="accuracy-value">${overall.toFixed(0)}%</div>
                    <div class="accuracy-label">Overall</div>
                </div>

                <div class="accuracy-breakdown">
                    ${this.subject.object !== 'radical' ? `
                        <div class="accuracy-component">
                            <div class="accuracy-component-header">
                                <span>Meaning</span>
                                <span class="accuracy-component-value">${meaningAcc.toFixed(0)}%</span>
                            </div>
                            <div class="accuracy-component-bar">
                                <div class="accuracy-component-fill" style="width: ${meaningAcc}%"></div>
                            </div>
                            <div class="accuracy-component-stats">
                                ${this.stats.data.meaning_correct} correct, 
                                ${this.stats.data.meaning_incorrect} incorrect
                            </div>
                        </div>

                        <div class="accuracy-component">
                            <div class="accuracy-component-header">
                                <span>Reading</span>
                                <span class="accuracy-component-value">${readingAcc.toFixed(0)}%</span>
                            </div>
                            <div class="accuracy-component-bar">
                                <div class="accuracy-component-fill" style="width: ${readingAcc}%"></div>
                            </div>
                            <div class="accuracy-component-stats">
                                ${this.stats.data.reading_correct} correct, 
                                ${this.stats.data.reading_incorrect} incorrect
                            </div>
                        </div>
                    ` : `
                        <div class="accuracy-component">
                            <div class="accuracy-component-header">
                                <span>Meaning</span>
                                <span class="accuracy-component-value">${meaningAcc.toFixed(0)}%</span>
                            </div>
                            <div class="accuracy-component-bar">
                                <div class="accuracy-component-fill" style="width: ${meaningAcc}%"></div>
                            </div>
                            <div class="accuracy-component-stats">
                                ${this.stats.data.meaning_correct} correct, 
                                ${this.stats.data.meaning_incorrect} incorrect
                            </div>
                        </div>
                    `}
                </div>

                <div class="accuracy-streaks">
                    <div class="accuracy-streak-item">
                        <div class="accuracy-streak-value">${this.stats.data.meaning_current_streak}</div>
                        <div class="accuracy-streak-label">Meaning Streak</div>
                    </div>
                    ${this.subject.object !== 'radical' ? `
                        <div class="accuracy-streak-item">
                            <div class="accuracy-streak-value">${this.stats.data.reading_current_streak}</div>
                            <div class="accuracy-streak-label">Reading Streak</div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Render meanings and readings
     */
    renderMeaningsReadings() {
        return `
            <div class="card">
                <h3 class="card-title">Meanings & Readings</h3>
                
                <div class="meanings-readings-grid">
                    <div class="meaning-section">
                        <h4>Meanings</h4>
                        <div class="meaning-list">
                            ${this.subject.data.meanings?.map(m => `
                                <span class="meaning-tag ${m.primary ? 'meaning-primary' : ''}">
                                    ${m.meaning}${m.primary ? ' ⭐' : ''}
                                </span>
                            `).join('') || 'N/A'}
                        </div>
                    </div>

                    ${this.subject.object !== 'radical' && this.subject.data.readings ? `
                        <div class="reading-section">
                            <h4>Readings</h4>
                            <div class="reading-list">
                                ${this.subject.data.readings.map(r => `
                                    <div class="reading-item ${r.primary ? 'reading-primary' : ''}">
                                        <span class="reading-type">${r.type}</span>
                                        <span class="reading-value">${r.reading}</span>
                                        ${r.primary ? ' ⭐' : ''}
                                    </div>
                                `).join('') || 'N/A'}
                            </div>
                        </div>
                    ` : ''}
                </div>

                ${this.subject.data.meaning_mnemonic ? `
                    <div class="mnemonic-section">
                        <h4>Meaning Mnemonic</h4>
                        <div class="mnemonic-text">${this.subject.data.meaning_mnemonic}</div>
                    </div>
                ` : ''}

                ${this.subject.data.reading_mnemonic ? `
                    <div class="mnemonic-section">
                        <h4>Reading Mnemonic</h4>
                        <div class="mnemonic-text">${this.subject.data.reading_mnemonic}</div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Render component parts
     */
    renderComponents() {
        if (!this.subject.data.component_subject_ids || this.subject.data.component_subject_ids.length === 0) {
            return '';
        }

        return `
            <div class="card">
                <h3 class="card-title">Components</h3>
                <div class="components-list">
                    ${this.subject.data.component_subject_ids.map(id => `
                        <button class="component-item" onclick="window.showItemDetail(${id})">
                            Component ${id}
                        </button>
                    `).join('')}
                </div>
                <p style="color: var(--text-secondary); font-size: var(--font-size-sm); margin-top: var(--spacing-md);">
                    Click to view component details
                </p>
            </div>
        `;
    }

    /**
     * Render vocabulary using this kanji
     */
    renderUsedIn() {
        if (this.subject.object !== 'kanji' || !this.subject.data.amalgamation_subject_ids || 
            this.subject.data.amalgamation_subject_ids.length === 0) {
            return '';
        }

        return `
            <div class="card">
                <h3 class="card-title">Used In (${this.subject.data.amalgamation_subject_ids.length} items)</h3>
                <div class="components-list">
                    ${this.subject.data.amalgamation_subject_ids.slice(0, 10).map(id => `
                        <button class="component-item" onclick="window.showItemDetail(${id})">
                            Vocabulary ${id}
                        </button>
                    `).join('')}
                </div>
                ${this.subject.data.amalgamation_subject_ids.length > 10 ? `
                    <p style="color: var(--text-secondary); font-size: var(--font-size-sm); margin-top: var(--spacing-md);">
                        Showing 10 of ${this.subject.data.amalgamation_subject_ids.length} items
                    </p>
                ` : ''}
            </div>
        `;
    }

    // Helper methods

    getSRSStageName(stage) {
        const names = {
            0: 'Locked', 1: 'Apprentice I', 2: 'Apprentice II', 3: 'Apprentice III', 4: 'Apprentice IV',
            5: 'Guru I', 6: 'Guru II', 7: 'Master', 8: 'Enlightened', 9: 'Burned'
        };
        return names[stage] || 'Unknown';
    }

    getSRSCategory(stage) {
        if (stage >= 1 && stage <= 4) return 'apprentice';
        if (stage >= 5 && stage <= 6) return 'guru';
        if (stage === 7) return 'master';
        if (stage === 8) return 'enlightened';
        if (stage === 9) return 'burned';
        return 'locked';
    }

    calculateComponentAccuracy(correct, incorrect) {
        const total = correct + incorrect;
        return total > 0 ? (correct / total * 100) : 100;
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

    formatDate(date) {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    formatDateTime(date) {
        return date.toLocaleString('en-US', { 
            month: 'short', day: 'numeric', year: 'numeric',
            hour: 'numeric', minute: '2-digit'
        });
    }

    getTimeUntil(date) {
        const now = new Date();
        const diff = date - now;
        
        if (diff < 0) return 'Available now';
        
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        if (days > 0) return `In ${days}d ${hours}h`;
        if (hours > 0) return `In ${hours}h ${minutes}m`;
        return `In ${minutes}m`;
    }
}

export default ItemDetail;
