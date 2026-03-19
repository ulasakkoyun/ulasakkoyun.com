let allBooks = [];

async function loadBooks() {
    try {
        const apiBase = window.API_BASE_URL || 'https://portfolio-api.ulasakkoyun26.workers.dev';
        const response = await fetch(`${apiBase}/books`, { cache: 'no-store' });
        if (!response.ok) throw new Error('Worker books request failed');

        const payload = await response.json();
        allBooks = Array.isArray(payload.books) ? payload.books : [];

        if (allBooks.length === 0) {
            throw new Error('Empty books payload from Worker');
        }

        updateBooksStats(allBooks.length, allBooks.length);
        renderBooks(allBooks);
        setupBookSearch();
    } catch (error) {
        console.error('Error loading books:', error);
        updateBooksStats(0, 0, true);
        document.getElementById('books-grid').innerHTML =
            '<p class="error-message">Failed to load books. Please try again later.</p>';
    }
}

function renderBooks(books) {
    const grid = document.getElementById('books-grid');

    if (!books || books.length === 0) {
        grid.innerHTML = '<p class="empty-message">No matching books found.</p>';
        return;
    }

    grid.innerHTML = books.map(book => `
    <div class="simple-list-item">
            <div class="item-main">
                <span class="item-title">${book.title}</span>
                                <span class="item-subtitle">${book.author}</span>
            </div>
                        <span class="item-year">${book.year || 'Book'}</span>
    </div>
  `).join('');
}

function updateBooksStats(visibleCount, totalCount, hasError = false) {
    const statsElement = document.getElementById('books-stats');
    if (!statsElement) return;

    if (hasError) {
        statsElement.textContent = 'Book stats unavailable';
        return;
    }

    statsElement.textContent = visibleCount === totalCount
        ? `${totalCount} books saved`
        : `${visibleCount} of ${totalCount} books shown`;
}

function setupBookSearch() {
    const searchInput = document.getElementById('books-search');
    if (!searchInput) return;

    searchInput.addEventListener('input', function () {
        const query = searchInput.value.trim().toLowerCase();
        const filteredBooks = allBooks.filter((book) =>
            String(book.title || '').toLowerCase().includes(query)
            || String(book.author || '').toLowerCase().includes(query)
            || String(book.year || '').toLowerCase().includes(query)
        );

        renderBooks(filteredBooks);
        updateBooksStats(filteredBooks.length, allBooks.length);
    });
}

document.addEventListener('DOMContentLoaded', loadBooks);
