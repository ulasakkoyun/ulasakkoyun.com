document.addEventListener('DOMContentLoaded', () => {
    new CollectionManager({
        endpoint: 'series',
        containerId: 'series-grid',
        statsId: 'series-stats',
        searchId: 'series-search',
        dataKey: 'series',
        emptyMessage: 'No matching series found.',
        statsLabel: 'series tracked',
        searchKeys: ['title', 'year'],
        renderItem: (item) => `
      <div class="simple-list-item">
        <span class="item-title">${item.title}</span>
        <span class="item-year">${item.year}</span>
      </div>
    `
    });
});
