import { describe, it, expect } from 'vitest';
import worker from '../src/index.js';

function createMockEnv(initialValues = {}) {
	const store = {
		total_visits: initialValues.total_visits ?? null,
	};

	const movieResults = initialValues.movies_results ?? [];
	const bookResults = initialValues.books_results ?? [];
	const seriesResults = initialValues.series_results ?? [];

	return {
		ALLOWED_ORIGINS: initialValues.ALLOWED_ORIGINS ?? 'http://localhost:3000,https://ulasakkoyun.com',
		ADMIN_API_TOKEN: initialValues.ADMIN_API_TOKEN ?? 'test-admin-token',
		VISITOR_KV: {
			async get(key) {
				return store[key] ?? null;
			},
			async put(key, newValue) {
				store[key] = newValue;
			},
		},
		MOVIES_DB: {
			prepare() {
				return {
					async all() {
						return { results: movieResults };
					},
				};
			},
		},
		BOOKS_DB: {
			prepare() {
				return {
					async all() {
						return { results: bookResults };
					},
				};
			},
		},
		SERIES_DB: {
			prepare() {
				return {
					async all() {
						return { results: seriesResults };
					},
				};
			},
		},
	};
}

describe('visitor counter worker', () => {
	it('increments and returns count for GET /counter', async () => {
		const env = createMockEnv({ total_visits: '41' });
		const request = new Request('http://example.com/counter', {
			headers: {
				'cf-connecting-ip': '203.0.113.10',
				'user-agent': 'Mozilla/5.0 Test Browser',
				'accept-language': 'en-US',
			},
		});
		const response = await worker.fetch(request, env);

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ count: 42 });
	});

	it('does not increment again for same visitor within 1 hour', async () => {
		const env = createMockEnv({ total_visits: '10' });
		const request = new Request('http://example.com/counter', {
			headers: {
				'cf-connecting-ip': '198.51.100.20',
				'user-agent': 'Mozilla/5.0 Same Visitor',
				'accept-language': 'tr-TR',
			},
		});

		const firstResponse = await worker.fetch(request, env);
		expect(firstResponse.status).toBe(200);
		expect(await firstResponse.json()).toEqual({ count: 11 });

		const secondResponse = await worker.fetch(request, env);
		expect(secondResponse.status).toBe(200);
		expect(await secondResponse.json()).toEqual({ count: 11, skipped: 'recent' });
	});

	it('returns movies for GET /movies', async () => {
		const env = createMockEnv({
			movies_results: [
				{ title: 'Interstellar', year: 2014, director: 'Christopher Nolan' },
				{ title: 'The Matrix', year: 1999, director: 'The Wachowskis' },
			],
		});
		const request = new Request('http://example.com/movies');
		const response = await worker.fetch(request, env);

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({
			movies: [
				{ title: 'Interstellar', year: 2014, director: 'Christopher Nolan' },
				{ title: 'The Matrix', year: 1999, director: 'The Wachowskis' },
			],
		});
	});

	it('returns books for GET /books', async () => {
		const env = createMockEnv({
			books_results: [
				{ title: '1984', author: 'George Orwell', year: '1949' },
				{ title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', year: '1925' },
			],
		});
		const request = new Request('http://example.com/books');
		const response = await worker.fetch(request, env);

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({
			books: [
				{ title: '1984', author: 'George Orwell', year: '1949' },
				{ title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', year: '1925' },
			],
		});
	});

	it('returns series for GET /series', async () => {
		const env = createMockEnv({
			series_results: [
				{ title: 'Game Of Thrones', year: '2011-2019' },
				{ title: 'House of the Dragon', year: '2022-' },
			],
		});
		const request = new Request('http://example.com/series');
		const response = await worker.fetch(request, env);

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({
			series: [
				{ title: 'Game Of Thrones', year: '2011-2019' },
				{ title: 'House of the Dragon', year: '2022-' },
			],
		});
	});

	it('returns 404 for non-counter paths', async () => {
		const env = createMockEnv({ total_visits: '5' });
		const request = new Request('http://example.com/health');
		const response = await worker.fetch(request, env);

		expect(response.status).toBe(404);
		expect(await response.json()).toEqual({ error: 'Not found' });
	});

	it('returns 401 for /admin-check when authorization header is missing', async () => {
		const env = createMockEnv();
		const request = new Request('http://example.com/admin-check');
		const response = await worker.fetch(request, env);

		expect(response.status).toBe(401);
		expect(await response.text()).toBe('Unauthorized');
	});

	it('returns 200 for /admin-check when bearer token matches', async () => {
		const env = createMockEnv({ ADMIN_API_TOKEN: 'abc123' });
		const request = new Request('http://example.com/admin-check', {
			headers: {
				authorization: 'Bearer abc123',
			},
		});
		const response = await worker.fetch(request, env);

		expect(response.status).toBe(200);
		expect(await response.text()).toBe('Authorized');
	});

	it('sets Access-Control-Allow-Origin only for allowlisted origins', async () => {
		const env = createMockEnv({ ALLOWED_ORIGINS: 'https://ulasakkoyun.com' });
		const allowedRequest = new Request('http://example.com/counter', {
			headers: {
				origin: 'https://ulasakkoyun.com',
				'user-agent': 'Mozilla/5.0 Test Browser',
			},
		});
		const deniedRequest = new Request('http://example.com/counter', {
			headers: {
				origin: 'https://not-allowed.com',
				'user-agent': 'Mozilla/5.0 Test Browser',
			},
		});

		const allowedResponse = await worker.fetch(allowedRequest, env);
		const deniedResponse = await worker.fetch(deniedRequest, env);

		expect(allowedResponse.headers.get('access-control-allow-origin')).toBe('https://ulasakkoyun.com');
		expect(deniedResponse.headers.get('access-control-allow-origin')).toBeNull();
	});
});
