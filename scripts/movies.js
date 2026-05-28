document.addEventListener('DOMContentLoaded', () => {
  new CollectionManager({
    endpoint: 'movies',
    containerId: 'movies-grid',
    statsId: 'movies-stats',
    searchId: 'movies-search',
    dataKey: 'movies',
    emptyMessage: 'No matching movies found.',
    statsLabel: 'movies logged',
    searchKeys: ['title', 'year', 'director'],
    renderItem: (movie) => `
      <div class="simple-list-item">
        <div class="item-main">
          <span class="item-title">${movie.title}</span>
          ${movie.director ? `<span class="item-subtitle">Directed by ${movie.director}</span>` : ''}
        </div>
        <span class="item-year">${movie.year}</span>
      </div>
    `
  });
});
