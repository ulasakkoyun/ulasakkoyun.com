let allMovies = [];

async function loadMovies() {
  try {
    const apiBase = window.API_BASE_URL || 'https://portfolio-api.ulasakkoyun26.workers.dev';
    const response = await fetch(`${apiBase}/movies`, { cache: 'no-store' });
    if (!response.ok) throw new Error('Worker movies request failed');

    const payload = await response.json();
    allMovies = Array.isArray(payload.movies) ? payload.movies : [];

    if (allMovies.length === 0) {
      throw new Error('Empty movies payload from Worker');
    }

    updateMoviesStats(allMovies.length, allMovies.length);
    renderMovies(allMovies);
    setupMovieSearch();
  } catch (error) {
    console.error('Error loading movies:', error);
    updateMoviesStats(0, 0, true);
    document.getElementById('movies-grid').innerHTML =
      '<p class="error-message">Failed to load movies. Please try again later.</p>';
  }
}

function renderMovies(movies) {
  const grid = document.getElementById('movies-grid');

  if (!movies || movies.length === 0) {
    grid.innerHTML = '<p class="empty-message">No matching movies found.</p>';
    return;
  }

  grid.innerHTML = movies.map(movie => `
    <div class="simple-list-item">
      <div class="item-main">
        <span class="item-title">${movie.title}</span>
        ${movie.director ? `<span class="item-subtitle">Directed by ${movie.director}</span>` : ''}
      </div>
      <span class="item-year">${movie.year}</span>
    </div>
  `).join('');
}

function updateMoviesStats(visibleCount, totalCount, hasError = false) {
  const statsElement = document.getElementById('movies-stats');
  if (!statsElement) return;

  if (hasError) {
    statsElement.textContent = 'Movie stats unavailable';
    return;
  }

  statsElement.textContent = visibleCount === totalCount
    ? `${totalCount} movies logged`
    : `${visibleCount} of ${totalCount} movies shown`;
}

function setupMovieSearch() {
  const searchInput = document.getElementById('movies-search');
  if (!searchInput) return;

  searchInput.addEventListener('input', function () {
    const query = searchInput.value.trim().toLowerCase();
    const filteredMovies = allMovies.filter((movie) =>
      String(movie.title || '').toLowerCase().includes(query)
      || String(movie.year || '').toLowerCase().includes(query)
      || String(movie.director || '').toLowerCase().includes(query)
    );

    renderMovies(filteredMovies);
    updateMoviesStats(filteredMovies.length, allMovies.length);
  });
}

document.addEventListener('DOMContentLoaded', loadMovies);
