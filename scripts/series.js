let allSeries = [];

async function loadSeries() {
    try {
        const apiBase = window.API_BASE_URL || 'https://portfolio-api.ulasakkoyun26.workers.dev';
        const response = await fetch(`${apiBase}/series`, { cache: 'no-store' });
        if (!response.ok) throw new Error('Worker series request failed');

        const payload = await response.json();
        allSeries = Array.isArray(payload.series) ? payload.series : [];

        if (allSeries.length === 0) {
            throw new Error('Empty series payload from Worker');
        }

        updateSeriesStats(allSeries.length, allSeries.length);
        renderSeries(allSeries);
        setupSeriesSearch();
    } catch (error) {
        console.error('Error loading series:', error);
        updateSeriesStats(0, 0, true);
        document.getElementById('series-grid').innerHTML =
            '<p class="error-message">Failed to load series. Please try again later.</p>';
    }
}

function renderSeries(series) {
    const grid = document.getElementById('series-grid');

    if (!series || series.length === 0) {
        grid.innerHTML = '<p class="empty-message">No matching series found.</p>';
        return;
    }

    grid.innerHTML = series.map(item => `
    <div class="simple-list-item">
      <span class="item-title">${item.title}</span>
      <span class="item-year">${item.year}</span>
    </div>
  `).join('');
}

function updateSeriesStats(visibleCount, totalCount, hasError = false) {
    const statsElement = document.getElementById('series-stats');
    if (!statsElement) return;

    if (hasError) {
        statsElement.textContent = 'Series stats unavailable';
        return;
    }

    statsElement.textContent = visibleCount === totalCount
        ? `${totalCount} series tracked`
        : `${visibleCount} of ${totalCount} series shown`;
}

function setupSeriesSearch() {
    const searchInput = document.getElementById('series-search');
    if (!searchInput) return;

    searchInput.addEventListener('input', function () {
        const query = searchInput.value.trim().toLowerCase();
        const filteredSeries = allSeries.filter((item) =>
            String(item.title || '').toLowerCase().includes(query)
            || String(item.year || '').toLowerCase().includes(query)
        );

        renderSeries(filteredSeries);
        updateSeriesStats(filteredSeries.length, allSeries.length);
    });
}

document.addEventListener('DOMContentLoaded', loadSeries);
