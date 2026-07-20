// recipeToCart.js
// "I want to make rajma rice" -> Claude generates ingredients -> caller searches
// each directly against live Comparify data. Open-vocabulary: no local catalog
// gate here. Whatever Claude names as an ingredient gets a real search.

require("dotenv").config();
const axios = require("axios");

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";

/** Uses Claude to decide: is this text a "make a dish" request, and if so what dish? Returns dish name or null. */
async function detectRecipeIntent(text) {
  let res;
  try {
    res = await axios.post(
      CLAUDE_API_URL,
      {
        model: "claude-sonnet-4-6",
        max_tokens: 50,
        messages: [{
          role: "user",
          content: `The user sent this message to a grocery shopping bot: "${text}"\n\nThis may be in English, Hindi, Hinglish, or another language/script. Is this a request to cook/make a specific dish (e.g. "I want to make rajma rice", "curry chawal banana hai", "help me cook biryani")? If yes, respond with ONLY the dish name in plain English, lowercase, nothing else. If no, respond with ONLY the word NONE.`
        }]
      },
      { headers: { "x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.log("Recipe intent detection error:", err.response?.status, JSON.stringify(err.response?.data));
    return null;
  }

  const text2 = (res.data.content || []).filter(b => b.type === "text").map(b => b.text).join("").trim().toLowerCase();
  if (!text2 || text2 === "none") return null;
  return text2;
}

/** Detects if the user is signaling they have a shopping list to send as a photo (not a specific dish). */
async function detectListIntent(text) {
  let res;
  try {
    res = await axios.post(
      CLAUDE_API_URL,
      {
        model: "claude-sonnet-4-6",
        max_tokens: 10,
        messages: [{
          role: "user",
          content: `The user sent this to a grocery shopping bot: "${text}"\n\nAre they saying they have a shopping/grocery list they want to buy (e.g. "I have a list of items to buy", "I need to buy groceries", "I have a shopping list")? Respond with ONLY "YES" or "NO".`
        }]
      },
      { headers: { "x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.log("List intent detection error:", err.response?.status, JSON.stringify(err.response?.data));
    return false;
  }

  const text2 = (res.data.content || []).filter(b => b.type === "text").map(b => b.text).join("").trim().toUpperCase();
  return text2 === "YES";
}

/** Gets a grocery-shoppable ingredient list for a dish name from Claude. Returns string[] of SIMPLE searchable base terms. */
async function getIngredientsForDish(dishName) {
  let res;
  try {
    res = await axios.post(
      CLAUDE_API_URL,
      {
        model: "claude-sonnet-4-6",
        max_tokens: 300,
        messages: [{
          role: "user",
          content: `List the core grocery ingredients needed to cook "${dishName}" for a home cook.\n\nIMPORTANT: use the SIMPLEST, most common search term for each — the plain base word a grocery store search box would understand, NOT an over-specific variety. For example: say "Rice" not "Basmati Rice", "Kidney Beans" not "Rajma Masala Mix", "Oil" not "Cold Pressed Groundnut Oil", "Onion" not "Red Onion". Use common English grocery names even if the dish was Hindi/Hinglish.\n\nOne item per line, no quantities, no numbering, max 8 items, only real purchasable grocery items (skip water; skip salt unless central).`
        }]
      },
      { headers: { "x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.log("Ingredient generation error:", err.response?.status, JSON.stringify(err.response?.data));
    return [];
  }

  const text = (res.data.content || []).filter(b => b.type === "text").map(b => b.text).join("\n");
  return text.split("\n").map(l => l.trim()).filter(Boolean);
}

module.exports = { detectRecipeIntent, detectListIntent, getIngredientsForDish };