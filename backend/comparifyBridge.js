// comparifyBridge.js
// Real grocery price/availability data via Comparify's partner API.
// .env: COMPARIFY_API_KEY=your_key

require("dotenv").config();
const axios = require("axios");

const API_KEY = process.env.COMPARIFY_API_KEY;
const BASE_URL = "https://partners.comparify.pro";
const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

/** Raw search: returns Comparify `cards` array for a query. */
async function searchProduct(query, lat, long) {
  try {
    const res = await axios.get(`${BASE_URL}/api/search`, {
      params: { query, lat, long },
      headers: { "X-API-Key": API_KEY }
    });
    return res.data.cards || [];
  } catch (err) {
    console.log("Comparify search error:", err.response?.status, JSON.stringify(err.response?.data));
    return [];
  }
}

/**
 * Uses Claude to pick which of the real Comparify results actually matches what
 * the user wants. This replaces brittle string-matching: Claude knows "Rajma" ==
 * "Kidney Beans", that "Ginger Ale" is NOT kidney beans, and that any rice variant
 * satisfies "rice". Returns the chosen card's index, or -1 if genuinely none match.
 */
async function pickBestMatch(query, blinkitCards) {
  if (blinkitCards.length === 0) return -1;
  if (blinkitCards.length === 1) return 0; // only one option, trust the search

  const list = blinkitCards.map((c, i) => `${i}: ${c.name} (Rs${c.platforms.blinkit.price})`).join("\n");

  let res;
  try {
    res = await axios.post(
      CLAUDE_API_URL,
      {
        model: "claude-sonnet-4-6",
        max_tokens: 20,
        messages: [{
          role: "user",
          content: `A user wants to buy: "${query}"\n\nHere are real grocery products found in the store:\n${list}\n\nWhich product number best matches what the user wants? Consider synonyms and translations (e.g. "rajma" = kidney beans, "chawal" = rice, and any variant/size of the right product counts). If several fit, pick the most standard/basic one. If NONE genuinely match the product the user asked for (e.g. user wants kidney beans but options are all unrelated), respond with -1.\n\nRespond with ONLY the number, nothing else.`
        }]
      },
      { headers: { "x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.log("pickBestMatch error:", err.response?.status, JSON.stringify(err.response?.data));
    return 0; // fall back to first in-stock result rather than failing entirely
  }

  const raw = (res.data.content || []).filter(b => b.type === "text").map(b => b.text).join("").trim();
  const idx = parseInt(raw, 10);
  if (isNaN(idx) || idx < -1 || idx >= blinkitCards.length) return 0;
  return idx;
}

/** Asks Claude for one alternate common search term for an item (regional name, common suffix variant, etc). */
async function getSearchVariant(query) {
  try {
    const res = await axios.post(
      CLAUDE_API_URL,
      {
        model: "claude-sonnet-4-6",
        max_tokens: 20,
        messages: [{
          role: "user",
          content: `Give ONE alternate way an Indian grocery app search might list "${query}" — e.g. a regional-language name (Hindi transliteration), or the item with a common quantity like "1kg" appended. Respond with ONLY that alternate search term, nothing else.`
        }]
      },
      { headers: { "x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "Content-Type": "application/json" } }
    );
    return (res.data.content || []).filter(b => b.type === "text").map(b => b.text).join("").trim();
  } catch (err) {
    return null;
  }
}

/**
 * Gets a verified in-stock Blinkit product for a query. Searches multiple
 * realistic query variants (base term, base+quantity, regional synonym) and
 * pools all results, since a single exact query string often misses real stock
 * that's indexed under a slightly different name (e.g. "Tomato" missing "Tomato
 * 1kg" or "Tamatar" listings). Claude then picks the best real match from the
 * combined pool.
 */
async function getBlinkitPrice(query, lat, long) {
  const variant = await getSearchVariant(query);
  const queriesToTry = [query, `${query} 1kg`, variant].filter(Boolean);

  const allCardsById = new Map();
  for (const q of queriesToTry) {
    const cards = await searchProduct(q, lat, long);
    console.log(`Comparify "${q}" (variant of "${query}") -> ${cards.length} cards`);
    for (const c of cards) {
      if (!allCardsById.has(c.id)) allCardsById.set(c.id, c);
    }
  }

  const allCards = [...allCardsById.values()];
  if (allCards.length === 0) {
    console.log(`Comparify "${query}" -> 0 cards across all query variants tried`);
    return null;
  }

  const inStock = allCards.filter(c => c.platforms && c.platforms.blinkit && c.platforms.blinkit.inStock);
  if (inStock.length === 0) {
    console.log(`Comparify "${query}" -> ${allCards.length} cards found but none in-stock on Blinkit. All candidates:`, allCards.map(c => c.name));
    return null;
  }

  const idx = await pickBestMatch(query, inStock);
  if (idx === -1) {
    console.log(`Comparify "${query}" -> Claude judged none of the options a real match. Candidates were:`, inStock.map(c => c.name));
    return null;
  }

  const chosen = inStock[idx];
  console.log(`Comparify "${query}" -> chose "${chosen.name}" -> Rs${chosen.platforms.blinkit.price}`);
  return { ...chosen.platforms.blinkit, matchedName: chosen.name };
}

/** Batch: verified real Blinkit prices for a list of item names. */
async function getRealPricesForCatalog(itemNames, lat, long) {
  console.log(`Comparify batch lookup at lat=${lat}, long=${long} for:`, itemNames);
  const results = await Promise.all(
    itemNames.map(async name => {
      const data = await getBlinkitPrice(name, lat, long);
      return [name, data];
    })
  );
  return Object.fromEntries(results);
}

/** ETA for all platforms at a location. */
async function getDeliveryETA(lat, long, pincode) {
  try {
    const res = await axios.get(`${BASE_URL}/api/eta`, {
      params: { userLocation: JSON.stringify({ latitude: lat, longitude: long }), pincode },
      headers: { "X-API-Key": API_KEY }
    });
    return res.data;
  } catch (err) {
    console.log("Comparify ETA error:", err.response?.status, JSON.stringify(err.response?.data));
    return null;
  }
}

module.exports = { searchProduct, getBlinkitPrice, getRealPricesForCatalog, getDeliveryETA, pickBestMatch };