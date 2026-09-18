// Vercel serverless entry point. Vercel expects a request handler exported
// from a file under /api — an Express app instance is itself a valid
// handler, so we just re-export the one built in server.js. server.js
// checks `process.env.VERCEL` and skips its own app.listen() in that case,
// since Vercel calls this handler per-request instead of running a
// long-lived server.
module.exports = require('../server');
