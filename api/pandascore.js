const API_BASE = 'https://api.pandascore.co';

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
    res.status(response.status).send(text);
  } catch (err) {
    res.status(500).json({ error: 'Proxy request failed' });
  }
}
