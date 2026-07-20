// localDb.js
// Simple local JSON-file persistence. Swap for Firebase later — just replace
// the internals of load()/save() below, the get/set API stays the same so
// nothing else in the app needs to change.

const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "localdb.json");

function load() {
  try {
    const raw = fs.readFileSync(DB_PATH, "utf8");
    return JSON.parse(raw);
  } catch (e) {
    // File doesn't exist yet or is corrupt — start fresh.
    return {};
  }
}

function save(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  } catch (e) {
    console.log("localDb save failed:", e.message);
  }
}

let db = load();

/** Gets a top-level collection (e.g. "orderLog", "sessions"), creating it empty if missing. */
function getCollection(name) {
  if (!db[name]) db[name] = {};
  return db[name];
}

/** Persists the current in-memory db state to disk. Call after any mutation. */
function persist() {
  save(db);
}

/** Wipes everything — useful for demo resets. */
function reset() {
  db = {};
  persist();
}

module.exports = { getCollection, persist, reset };