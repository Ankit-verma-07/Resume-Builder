// server/search.js
const fetch = require("node-fetch"); // Node 18+ has global fetch; keep this if you already installed node-fetch

const API_KEY = "AIzaSyAKvmI8SB4x3LV2MFtckXI5q0PqzhnaYQ4";
const CX_ID   = "e07779dd46cf547d9";

/**
 * Fresh Google search (last 30 days), biased to English & India region.
 * Returns minimal, clean objects.
 */
async function searchGoogle(query, opts = {}) {
  const { freshness = "d30", region = "IN", lang = "en" } = opts;
  const url =
    `https://www.googleapis.com/customsearch/v1` +
    `?key=${API_KEY}` +
    `&cx=${CX_ID}` +
    `&q=${encodeURIComponent(query)}` +
    `&dateRestrict=${freshness}` +
    `&gl=${region}` +
    `&lr=lang_${lang}`;

  const res = await fetch(url);
  const data = await res.json();

  if (!res.ok) {
    const msg = data?.error?.message || `Google CSE error (${res.status})`;
    throw new Error(msg);
  }

  const items = Array.isArray(data.items) ? data.items : [];
  // Keep only what we’ll actually use
  return items.map(({ title, link, snippet }) => ({ title, link, snippet }));
}

module.exports = { searchGoogle };
