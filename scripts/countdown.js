async function updateVisitCounter() {
    const visitCounterElement = document.getElementById('visit-counter-text');
    if (!visitCounterElement) return;

    try {
        const counterEndpoint = window.COUNTER_ENDPOINT || 'https://portfolio-api.ulasakkoyun26.workers.dev/counter';
        const response = await fetch(counterEndpoint, { cache: 'no-store' });
        if (!response.ok) throw new Error('Counter request failed');

        const data = await response.json();
        const count = Number(data.count || 0).toLocaleString();
        visitCounterElement.innerHTML = `This website has been visited <span class="visit-count">${count}</span> times since it was <br>created out of boredom on Jul 29, 2025.<br>UA`;
    } catch (error) {
        visitCounterElement.textContent = 'Visitor count is unavailable right now.';
    }
}

document.addEventListener('DOMContentLoaded', function () {
    updateVisitCounter();
});
