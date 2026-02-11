const API_BASE = 'https://api.pandascore.co';
const proxyCache = new Map();

function getTtlSeconds(path) {
  const normalized = String(path || '');
  if (normalized.includes('/matches/running')) return 20;
  if (normalized.includes('/matches/upcoming')) return 60;
  if (normalized.includes('/matches/past')) return 120;
  if (normalized.includes('/matches')) return 90;
  if (normalized.includes('/teams')) return 300;
  return 120;
}

function buildCacheKey(path, query) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (key === 'path' || value === undefined) return;
    if (Array.isArray(value)) {
      value.forEach((item) => params.append(key, String(item)));
      return;
    }
    params.set(key, String(value));
  });
  return `${path}?${params.toString()}`;
}

function sendCachedResponse(res, entry, ttlSeconds) {
  res.setHeader('Content-Type', entry.contentType || 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', `public, s-maxage=${ttlSeconds}, stale-while-revalidate=300`);
  res.setHeader('X-Proxy-Cache', 'HIT');
  res.status(entry.status).send(entry.body);
}

export default async function handler(req, res) {
  const token = process.env.PANDASCORE_TOKEN;
  if (!token) {
    res.status(500).json({ error: 'PANDASCORE_TOKEN missing' });
    return;
  }

  const targetPath = req.query.path;
  if (!targetPath || Array.isArray(targetPath)) {
    res.status(400).json({ error: 'Missing path' });
    return;
  }
  const ttlSeconds = getTtlSeconds(targetPath);
  const cacheKey = buildCacheKey(targetPath, req.query);
  const cachedEntry = proxyCache.get(cacheKey);
  if (cachedEntry && cachedEntry.expiresAt > Date.now()) {
    sendCachedResponse(res, cachedEntry, ttlSeconds);
    return;
  }

  const url = new URL(`${API_BASE}/${targetPath}`);
  Object.entries(req.query).forEach(([key, value]) => {
    if (key === 'path') return;
    if (value === undefined) return;
    if (Array.isArray(value)) {
      value.forEach((item) => url.searchParams.append(key, item));
    } else {
      url.searchParams.set(key, value);
    }
  });

  try {
    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });
    const text = await response.text();
    const contentType = response.headers.get('content-type') || 'application/json; charset=utf-8';
    if (response.ok) {
      proxyCache.set(cacheKey, {
        status: response.status,
        body: text,
        contentType,
        expiresAt: Date.now() + ttlSeconds * 1000,
      });
      res.setHeader('X-Proxy-Cache', 'MISS');
      res.setHeader('Cache-Control', `public, s-maxage=${ttlSeconds}, stale-while-revalidate=300`);
    } else {
      res.setHeader('X-Proxy-Cache', 'BYPASS');
      res.setHeader('Cache-Control', 'no-store');
    }
    res.setHeader('Content-Type', contentType);
    res.status(response.status).send(text);
  } catch (err) {
    res.status(500).json({ error: 'Proxy request failed' });
  }
}
