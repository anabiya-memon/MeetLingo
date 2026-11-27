const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, 'public');
const PORT = Number(process.env.PORT) || 3000;
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon'
};

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  });
  res.end(JSON.stringify(data));
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 20000) {
        reject(new Error('Request is too large.'));
        req.destroy();
      }
    });
    req.on('end', () => {
      try { resolve(JSON.parse(body || '{}')); }
      catch (_) { reject(new Error('Invalid JSON request.')); }
    });
    req.on('error', reject);
  });
}

async function translate(text) {
  const params = new URLSearchParams({ q: text, langpair: 'en|ur' });
  const response = await fetch(`https://api.mymemory.translated.net/get?${params.toString()}`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(15000)
  });

  if (!response.ok) throw new Error('The translation service is temporarily unavailable. Please try again.');
  const data = await response.json();
  if (data?.responseStatus && Number(data.responseStatus) >= 400) {
    throw new Error(data.responseDetails || 'The translation service could not translate this sentence.');
  }
  const translatedText = data?.responseData?.translatedText;
  if (typeof translatedText !== 'string' || !translatedText.trim()) {
    throw new Error('No translation was returned. Please try a shorter sentence.');
  }
  return { translation: translatedText, match: Number(data?.responseData?.match || 0) };
}

const server = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (req.method === 'GET' && requestUrl.pathname === '/api/health') {
    return sendJson(res, 200, { ok: true, service: 'meeting-translator' });
  }

  if (req.method === 'POST' && requestUrl.pathname === '/api/translate') {
    try {
      const body = await readJson(req);
      const text = typeof body.text === 'string' ? body.text.trim() : '';
      if (!text) return sendJson(res, 400, { error: 'Please enter some English text first.' });
      if (Buffer.byteLength(text, 'utf8') > 500) return sendJson(res, 413, { error: 'Please translate a shorter sentence (the translation service allows 500 bytes per request).' });
      const result = await translate(text);
      return sendJson(res, 200, result);
    } catch (error) {
      const message = error.message || 'Could not reach the translation service. Check your internet connection.';
      return sendJson(res, 502, { error: message });
    }
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD, POST' });
    return res.end('Method Not Allowed');
  }

  let pathname;
  try { pathname = decodeURIComponent(requestUrl.pathname); }
  catch (_) { res.writeHead(400); return res.end('Bad Request'); }
  if (pathname === '/') pathname = '/index.html';
  const filePath = path.resolve(ROOT, `.${pathname}`);
  if (!filePath.startsWith(`${ROOT}${path.sep}`) && filePath !== path.join(ROOT, 'index.html')) {
    res.writeHead(403); return res.end('Forbidden');
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('Not Found');
    }
    res.writeHead(200, {
      'Content-Type': MIME_TYPES[path.extname(filePath)] || 'application/octet-stream',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff'
    });
    if (req.method === 'HEAD') return res.end();
    res.end(content);
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`MeetLingo is ready at http://localhost:${PORT}`);
  console.log('Keep this window open while using the translator. Press Ctrl+C to stop.');
});
