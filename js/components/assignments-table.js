// Assignments Table Component
// Sortable, filterable table of all assignments

export class AssignmentsTable {
    constructor(assignments, subjects) {
        this.assignments = assignments;
        this.subjects = subjects;
        this.currentSort = { column: 'level', direction: 'asc' };
        this.filters = {
            type: 'all',
            level: 'all',
            srsStage: 'all',
            search: ''
        };
    }

    /**
     * Render assignments table
     * @returns {string} HTML string
     */
    render() {
        const filteredData = this.getFilteredData();
        const sortedData = this.sortData(filteredData);
        const paginatedData = sortedData.slice(0, 100); // Show first 100

        return `
            <div class="assignments-table-container">
                ${this.renderFilters()}
                ${this.renderStats(filteredData.length)}
                ${this.renderTable(paginatedData)}
                ${sortedData.length > 100 ? `
                    <div class="table-footer">
                        Showing 100 of ${sortedData.length} items. 
                        Use filters to narrow results.
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Render filter controls
     */
    renderFilters() {
        return `
            <div class="table-filters">
                <div class="filter-group">
                    <label>Type</label>
                    <select id="filter-type" onchange="window.updateTableFilter('type', this.value)">
                        <option value="all">All Types</option>
                        <option value="radical">Radicals</option>
                        <option value="kanji">Kanji</option>
                        <option value="vocabulary">Vocabulary</option>
                    </select>
                </div>

                <div class="filter-group">
                    <label>SRS Stage</label>
                    <select id="filter-srs" onchange="window.updateTableFilter('srsStage', this.value)">
                        <option value="all">All Stages</option>
                        <option value="apprentice">Apprentice</option>
                        <option value="guru">Guru</option>
                        <option value="master">Master</option>
                        <option value="enlightened">Enlightened</option>
                        <option value="burned">Burned</option>
                    </select>
                </div>

                <div class="filter-group filter-search">
                    <label>Search</label>
                    <input 
                        type="text" 
                        id="filter-search" 
                        placeholder="Search by character or meaning..."
                        oninput="window.updateTableFilter('search', this.value)"
                    />
                </div>

                <button class="btn-secondary" onclick="window.resetTableFilters()">
                    Reset Filters
                </button>
            </div>
        `;
    }

    /**
     * Render table stats
     */
    renderStats(count) {
        return `
            <div class="table-stats">
                <span class="stat-badge">${count} items</span>
            </div>
        `;
    }

    /**
     * Render table
     */
    renderTable(data) {
        return `
            <div class="table-wrapper">
                <table class="data-table">
                    <thead>
                        <tr>
                            ${this.renderHeaderCell('character', 'Character')}
                            ${this.renderHeaderCell('meanings', 'Meaning')}
                            ${this.renderHeaderCell('type', 'Type')}
                            ${this.renderHeaderCell('level', 'Level')}
                            ${this.renderHeaderCell('srs', 'SRS Stage')}
                            ${this.renderHeaderCell('accuracy', 'Accuracy')}
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map(item => this.renderRow(item)).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    /**
     * Render table header cell
     */
    renderHeaderCell(column, label) {
        const isActive = this.currentSort.column === column;
        const direction = isActive ? this.currentSort.direction : 'asc';
        const arrow = isActive ? (direction === 'asc' ? '↑' : '↓') : '';

        return `
            <th onclick="window.sortTable('${column}')" class="sortable ${isActive ? 'active' : ''}">
                ${label} ${arrow}
            </th>
        `;
    }

    /**
     * Render table row
     */
    renderRow(item) {
        const subject = this.subjects.find(s => s.id === item.data.subject_id);
        const character = subject?.data?.characters || 'N/A';
        const meanings = subject?.data?.meanings?.map(m => m.meaning).join(', ') || 'N/A';
        const srsStage = this.getSRSStageName(item.data.srs_stage);
        const accuracy = item.accuracy !== undefined ? `${item.accuracy.toFixed(0)}%` : 'N/A';

        return `
            <tr class="table-row" onclick="window.showItemDetail(${item.data.subject_id})">
                <td class="cell-character">${character}</td>
                <td class="cell-meanings">${meanings}</td>
                <td class="cell-type">
                    <span class="type-badge type-${item.data.subject_type}">${this.capitalize(item.data.subject_type)}</span>
                </td>
                <td class="cell-level">${item.data.level}</td>
                <td class="cell-srs">
                    <span class="srs-badge srs-${this.getSRSCategory(item.data.srs_stage)}">${srsStage}</span>
                </td>
                <td class="cell-accuracy">${accuracy}</td>
            </tr>
        `;
    }

    /**
     * Get filtered data
     */
    getFilteredData() {
        let filtered = [...this.assignments];

        // Type filter
        if (this.filters.type !== 'all') {
            filtered = filtered.filter(a => a.data.subject_type === this.filters.type);
        }

        // SRS stage filter
        if (this.filters.srsStage !== 'all') {
            const stageRanges = {
                apprentice: [1, 2, 3, 4],
                guru: [5, 6],
                master: [7],
                enlightened: [8],
                burned: [9]
            };
            const stages = stageRanges[this.filters.srsStage];
            filtered = filtered.filter(a => stages.includes(a.data.srs_stage));
        }

        // Search filter
        if (this.filters.search) {
            const search = this.filters.search.toLowerCase();
            filtered = filtered.filter(a => {
                const subject = this.subjects.find(s => s.id === a.data.subject_id);
                const character = subject?.data?.characters?.toLowerCase() || '';
                const meanings = subject?.data?.meanings?.map(m => m.meaning.toLowerCase()).join(' ') || '';
                return character.includes(search) || meanings.includes(search);
            });
        }

        return filtered;
    }

    /**
     * Sort data
     */
    sortData(data) {
        const sorted = [...data];
        const { column, direction } = this.currentSort;
        const multiplier = direction === 'asc' ? 1 : -1;

        sorted.sort((a, b) => {
            let aVal, bVal;

            switch (column) {
                case 'character':
                    const aSubject = this.subjects.find(s => s.id === a.data.subject_id);
                    const bSubject = this.subjects.find(s => s.id === b.data.subject_id);
                    aVal = aSubject?.data?.characters || '';
                    bVal = bSubject?.data?.characters || '';
                    break;
                case 'meanings':
                    const aSubj = this.subjects.find(s => s.id === a.data.subject_id);
                    const bSubj = this.subjects.find(s => s.id === b.data.subject_id);
                    aVal = aSubj?.data?.meanings?.[0]?.meaning || '';
                    bVal = bSubj?.data?.meanings?.[0]?.meaning || '';
                    break;
                case 'type':
                    aVal = a.data.subject_type;
                    bVal = b.data.subject_type;
                    break;
                case 'level':
                    aVal = a.data.level;
                    bVal = b.data.level;
                    break;
                case 'srs':
                    aVal = a.data.srs_stage;
                    bVal = b.data.srs_stage;
                    break;
                case 'accuracy':
                    aVal = a.accuracy || 0;
                    bVal = b.accuracy || 0;
                    break;
                default:
                    return 0;
            }

            if (aVal < bVal) return -1 * multiplier;
            if (aVal > bVal) return 1 * multiplier;
            return 0;
        });

        return sorted;
    }

    // Helper methods

    getSRSStageName(stage) {
        const names = {
            0: 'Locked',
            1: 'Apprentice I',
            2: 'Apprentice II',
            3: 'Apprentice III',
            4: 'Apprentice IV',
            5: 'Guru I',
            6: 'Guru II',
            7: 'Master',
            8: 'Enlightened',
            9: 'Burned'
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

    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}

export default AssignmentsTable;
