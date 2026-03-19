export default {
	async fetch(request, env) {
		const url = new URL(request.url);

		if (request.method === 'OPTIONS') {
			return new Response(null, {
				status: 204,
				headers: corsHeaders(request, env),
			});
		}

		if (url.pathname === '/admin-check') {
			return handleAdminCheck(request, env);
		}

		if (url.pathname === '/counter') {
			return handleCounter(request, env);
		}

		if (url.pathname === '/movies') {
			return handleMovies(request, env);
		}

		if (url.pathname === '/books') {
			return handleBooks(request, env);
		}

		if (url.pathname === '/series') {
			return handleSeries(request, env);
		}

		return json({ error: 'Not found' }, 404, request, env);
	},
};


async function handleCounter(request, env) {
	if (request.method !== 'GET') {
		return json({ error: 'Method not allowed' }, 405, request, env);
	}

	const counterKey = 'total_visits';
	const currentRaw = await env.VISITOR_KV.get(counterKey);
	const current = Number(currentRaw || 0);

	const userAgent = (request.headers.get('user-agent') || '').toLowerCase();
	if (isBotUserAgent(userAgent)) {
		return json({ count: current, skipped: 'bot' }, 200, request, env);
	}

	const visitorFingerprint = await getVisitorFingerprint(request);
	const uniqueVisitKey = `uv:1h:${visitorFingerprint}`;
	const hasRecentVisit = await env.VISITOR_KV.get(uniqueVisitKey);

	if (hasRecentVisit) {
		return json({ count: current, skipped: 'recent' }, 200, request, env);
	}

	const next = current + 1;

	await env.VISITOR_KV.put(counterKey, String(next));
	await env.VISITOR_KV.put(uniqueVisitKey, '1', { expirationTtl: 3600 });

	return json({ count: next }, 200, request, env);
}

async function handleAdminCheck(request, env) {
	if (request.method !== 'GET') {
		return json({ error: 'Method not allowed' }, 405, request, env);
	}

	if (!isAuthorizedRequest(request, env)) {
		return new Response('Unauthorized', {
			status: 401,
			headers: {
				'content-type': 'text/plain; charset=utf-8',
				'cache-control': 'no-store',
				...corsHeaders(request, env),
			},
		});
	}

	return new Response('Authorized', {
		status: 200,
		headers: {
			'content-type': 'text/plain; charset=utf-8',
			'cache-control': 'no-store',
			...corsHeaders(request, env),
		},
	});
}

async function handleMovies(request, env) {
	if (request.method !== 'GET') {
		return json({ error: 'Method not allowed' }, 405, request, env);
	}

	if (!env.MOVIES_DB) {
		return json({ error: 'D1 binding MOVIES_DB is missing' }, 500, request, env);
	}

	try {
		try {
			const result = await env.MOVIES_DB
				.prepare('SELECT title, year, director FROM movies ORDER BY id ASC')
				.all();

			const movies = Array.isArray(result.results) ? result.results : [];

			if (movies.length === 0) {
				return json({ error: 'Movies table is empty' }, 404, request, env);
			}

			return json({ movies }, 200, request, env);
		} catch {
			const fallbackResult = await env.MOVIES_DB
				.prepare('SELECT title, year FROM movies ORDER BY id ASC')
				.all();

			const movies = Array.isArray(fallbackResult.results) ? fallbackResult.results : [];

			if (movies.length === 0) {
				return json({ error: 'Movies table is empty' }, 404, request, env);
			}

			return json({ movies }, 200, request, env);
		}
	} catch {
		return json({ error: 'Failed to query movies from D1' }, 500, request, env);
	}
}

async function handleBooks(request, env) {
	if (request.method !== 'GET') {
		return json({ error: 'Method not allowed' }, 405, request, env);
	}

	if (!env.BOOKS_DB) {
		return json({ error: 'D1 binding BOOKS_DB is missing' }, 500, request, env);
	}

	try {
		try {
			const result = await env.BOOKS_DB
				.prepare('SELECT title, author, year FROM books ORDER BY id ASC')
				.all();

			const books = Array.isArray(result.results) ? result.results : [];

			if (books.length === 0) {
				return json({ error: 'Books table is empty' }, 404, request, env);
			}

			return json({ books }, 200, request, env);
		} catch {
			const fallbackResult = await env.BOOKS_DB
				.prepare('SELECT title, author FROM books ORDER BY id ASC')
				.all();

			const books = Array.isArray(fallbackResult.results) ? fallbackResult.results : [];

			if (books.length === 0) {
				return json({ error: 'Books table is empty' }, 404, request, env);
			}

			return json({ books }, 200, request, env);
		}
	} catch {
		return json({ error: 'Failed to query books from D1' }, 500, request, env);
	}
}

async function handleSeries(request, env) {
	if (request.method !== 'GET') {
		return json({ error: 'Method not allowed' }, 405, request, env);
	}

	if (!env.SERIES_DB) {
		return json({ error: 'D1 binding SERIES_DB is missing' }, 500, request, env);
	}

	try {
		const result = await env.SERIES_DB
			.prepare(`SELECT title,
				CASE
					WHEN end_year IS NULL THEN CAST(start_year AS TEXT) || '-'
					WHEN end_year = start_year THEN CAST(start_year AS TEXT)
					ELSE CAST(start_year AS TEXT) || '-' || CAST(end_year AS TEXT)
				END AS year
			FROM series
			ORDER BY start_year DESC, title ASC`)
			.all();

		const series = Array.isArray(result.results) ? result.results : [];

		if (series.length === 0) {
			return json({ error: 'Series table is empty' }, 404, request, env);
		}

		return json({ series }, 200, request, env);
	} catch {
		try {
			const fallbackResult = await env.SERIES_DB
				.prepare('SELECT title, year FROM series ORDER BY id ASC')
				.all();

			const series = Array.isArray(fallbackResult.results) ? fallbackResult.results : [];

			if (series.length === 0) {
				return json({ error: 'Series table is empty' }, 404, request, env);
			}

			return json({ series }, 200, request, env);
		} catch {
			return json({ error: 'Failed to query series from D1' }, 500, request, env);
		}
	}
}

function json(data, status = 200, request, env) {
	return new Response(JSON.stringify(data), {
		status,
		headers: {
			'content-type': 'application/json; charset=utf-8',
			'cache-control': 'no-store',
			...corsHeaders(request, env),
		},
	});
}

function corsHeaders(request, env) {
	const headers = {
		'access-control-allow-methods': 'GET, OPTIONS',
		'access-control-allow-headers': 'authorization, content-type',
		'vary': 'origin',
	};

	const origin = request?.headers.get('origin');
	const allowedOrigins = parseAllowedOrigins(env?.ALLOWED_ORIGINS);

	if (origin && allowedOrigins.has(origin)) {
		headers['access-control-allow-origin'] = origin;
	}

	return headers;
}

function parseAllowedOrigins(rawOrigins) {
	return new Set(
		String(rawOrigins || '')
			.split(',')
			.map((origin) => origin.trim())
			.filter(Boolean),
	);
}

function isAuthorizedRequest(request, env) {
	const adminToken = String(env?.ADMIN_API_TOKEN || '');
	const provided = request.headers.get('authorization') || '';

	if (!adminToken || !provided) {
		return false;
	}

	return provided === adminToken || provided === `Bearer ${adminToken}`;
}

function isBotUserAgent(userAgent) {
	return /bot|crawler|spider|headless|slurp|curl|wget/i.test(userAgent);
}

async function getVisitorFingerprint(request) {
	const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || 'unknown-ip';
	const userAgent = request.headers.get('user-agent') || 'unknown-ua';
	const language = request.headers.get('accept-language') || 'unknown-lang';
	return hashText(`${ip}|${userAgent}|${language}`);
}

async function hashText(value) {
	const encoded = new TextEncoder().encode(value);
	const digest = await crypto.subtle.digest('SHA-256', encoded);
	const bytes = Array.from(new Uint8Array(digest));
	return bytes.map((byte) => byte.toString(16).padStart(2, '0')).join('');
}
