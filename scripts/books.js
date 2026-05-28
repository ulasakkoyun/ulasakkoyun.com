document.addEventListener('DOMContentLoaded', () => {
    new CollectionManager({
        endpoint: 'books',
        containerId: 'books-grid',
        statsId: 'books-stats',
        searchId: 'books-search',
        dataKey: 'books',
        emptyMessage: 'No matching books found.',
        statsLabel: 'books saved',
        searchKeys: ['title', 'author', 'year'],
        renderItem: (book) => `
      <div class="simple-list-item">
        <div class="item-main">
          <span class="item-title">${book.title}</span>
          <span class="item-subtitle">${book.author}</span>
        </div>
        <span class="item-year">${book.year || 'Book'}</span>
      </div>
    `
    });
});
