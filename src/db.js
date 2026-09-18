/**
 * db.js — a tiny synchronous JSON-file datastore.
 *
 * This exists so the whole backend can run with ZERO external services
 * (no Postgres/MySQL server to install) — perfect for local dev, a demo,
 * or a small deployment. Every table is just an array kept in memory and
 * flushed to disk (data/db.json) after every write.
 *
 * SWAPPING TO A REAL DATABASE LATER:
 * Every route file only calls the methods below (db.users.find(), etc.),
 * never touches the JSON file directly. To move to Postgres, replace this
 * file with one that runs the same method names against SQL queries
 * (e.g. using `pg` or an ORM like Prisma/Drizzle) — no route code changes.
 */
const fs = require('fs');
const path = require('path');

// Vercel's serverless runtime ships a read-only filesystem — only /tmp is
// writable, and it isn't guaranteed to persist between invocations. Locally
// (and on a normal long-running host like Render/Railway) we keep using the
// real project-relative data/ folder so it persists properly on disk.
const DATA_DIR = process.env.VERCEL
  ? '/tmp/nestora-data'
  : path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'db.json');

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ users: [], properties: [], reports: [], leads: [], reviews: [], meta: { nextUserId: 1, nextPropertyId: 1, nextReportId: 1, nextLeadId: 1, nextReviewId: 1 } }, null, 2));
  }
}
ensureDataFile();

let state = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));

function persist() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2));
}

function makeTable(name, idField) {
  return {
    all() {
      return state[name];
    },
    find(predicate) {
      return state[name].find(predicate) || null;
    },
    filter(predicate) {
      return state[name].filter(predicate);
    },
    findById(id) {
      return state[name].find((r) => r[idField] === Number(id)) || null;
    },
    insert(record) {
      const id = state.meta[`next${cap(name)}Id`]++;
      const row = { [idField]: id, ...record };
      state[name].push(row);
      persist();
      return row;
    },
    update(id, patch) {
      const row = state[name].find((r) => r[idField] === Number(id));
      if (!row) return null;
      Object.assign(row, patch);
      persist();
      return row;
    },
    remove(id) {
      const idx = state[name].findIndex((r) => r[idField] === Number(id));
      if (idx === -1) return false;
      state[name].splice(idx, 1);
      persist();
      return true;
    },
  };
}

function cap(name) {
  // 'users' -> 'User', 'properties' -> 'Property', 'reports' -> 'Report'
  const singular = { users: 'User', properties: 'Property', reports: 'Report', leads: 'Lead', reviews: 'Review' }[name];
  return singular;
}

module.exports = {
  users: makeTable('users', 'id'),
  properties: makeTable('properties', 'id'),
  reports: makeTable('reports', 'id'),
  leads: makeTable('leads', 'id'),
  reviews: makeTable('reviews', 'id'),
  _raw: () => state,
  _reload: () => { state = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8')); },
};
