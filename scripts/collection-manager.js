class CollectionManager {
    constructor(config) {
        this.endpoint = config.endpoint;
        this.containerId = config.containerId;
        this.statsId = config.statsId;
        this.searchId = config.searchId;
        this.dataKey = config.dataKey; // e.g., 'movies', 'books', 'series'
        this.emptyMessage = config.emptyMessage || 'No items found.';
        this.statsLabel = config.statsLabel || 'items'; // e.g., 'movies logged'
        this.renderItem = config.renderItem; // Function to render a single item
        this.searchKeys = config.searchKeys; // Array of keys to search against

        this.items = [];
        this.apiBase = window.API_BASE_URL || 'https://portfolio-api.ulasakkoyun26.workers.dev';

        this.init();
    }

    async init() {
        await this.loadData();
        this.setupSearch();
    }

    async loadData() {
        try {
            const response = await fetch(`${this.apiBase}/${this.endpoint}`, { cache: 'no-store' });
            if (!response.ok) throw new Error(`Worker ${this.endpoint} request failed`);

            const payload = await response.json();
            this.items = Array.isArray(payload[this.dataKey]) ? payload[this.dataKey] : [];

            if (this.items.length === 0) {
                throw new Error(`Empty ${this.dataKey} payload from Worker`);
            }

            this.updateStats(this.items.length, this.items.length);
            this.render(this.items);
        } catch (error) {
            console.error(`Error loading ${this.dataKey}:`, error);
            this.updateStats(0, 0, true);
            document.getElementById(this.containerId).innerHTML =
                `<p class="error-message">Failed to load ${this.dataKey}. Please try again later.</p>`;
        }
    }

    render(filteredItems) {
        const grid = document.getElementById(this.containerId);
        if (!grid) return;

        if (!filteredItems || filteredItems.length === 0) {
            grid.innerHTML = `<p class="empty-message">${this.emptyMessage}</p>`;
            return;
        }

        grid.innerHTML = filteredItems.map(this.renderItem).join('');
    }

    updateStats(visibleCount, totalCount, hasError = false) {
        const statsContainer = document.getElementById(this.statsId);
        if (!statsContainer) return;

        if (hasError) {
            statsContainer.innerHTML = '<p class="list-stats primary-stat">Stats unavailable</p>';
            return;
        }

        // Calculate this month's stats if created_at exists.
        let recentCount = 0;
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        for (const item of this.items) {
            if (item.created_at) {
                const itemDate = new Date(item.created_at);
                if (itemDate >= thirtyDaysAgo) {
                    recentCount++;
                }
            }
        }

        const mainText = visibleCount === totalCount
            ? `${totalCount} ${this.statsLabel}`
            : `${visibleCount} of ${totalCount} ${this.dataKey} shown`;

        statsContainer.innerHTML = `
      <p class="list-stats primary-stat">${mainText}</p>
    `;

        const recentContainer = document.getElementById(`${this.endpoint}-recent-stats`);
        if (recentContainer) {
            // Regardless of count (even if 0), write the sentence with the highlighted number.
            // We will make the text lowercase/normal case instead of uppercase!
            recentContainer.innerHTML = `<span class="modern-secondary-text"><span class="visit-count">${recentCount}</span> ${this.dataKey} saved this month</span>`;
        }
    }

    setupSearch() {
        const searchInput = document.getElementById(this.searchId);
        if (!searchInput) return;

        searchInput.addEventListener('input', () => {
            const query = searchInput.value.trim().toLowerCase();
            const filtered = this.items.filter((item) =>
                this.searchKeys.some((key) => String(item[key] || '').toLowerCase().includes(query))
            );

            this.render(filtered);
            this.updateStats(filtered.length, this.items.length);
        });
    }
}
