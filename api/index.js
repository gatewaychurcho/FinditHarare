const server = require('../server.js');

module.exports = (req, res) => {
  try {
    // If Vercel rewrote the URL or routed via catch-all, restore the original incoming path
    const matchedPath = req.headers['x-matched-path'] || req.headers['x-forwarded-uri'] || req.headers['x-original-url'];
    if (matchedPath && (req.url === '/api' || req.url === '/api/' || req.url.startsWith('/api/index') || req.url.includes('[...'))) {
      const qIdx = req.url.indexOf('?');
      const qs = qIdx >= 0 ? req.url.slice(qIdx) : '';
      req.url = matchedPath + qs;
    }

    // Standard CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

    if (req.method === 'OPTIONS') {
      res.statusCode = 200;
      return res.end();
    }

    // Delegate HTTP request and response to server.js
    server.emit('request', req, res);
  } catch (err) {
    console.error('Vercel API error:', err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: err.message || 'Serverless Execution Error' }));
    }
  }
};
