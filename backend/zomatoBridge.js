// zomatoBridge.js
// Bridges WhatsApp bot <-> Claude API (with Zomato MCP attached).
// Scope: single account only (your own Zomato login/address), per earlier discussion.
// Drop-in: require this from index.js, call askZomato() where you currently touch the mock `restaurants` object.

require("dotenv").config();
const axios = require("axios");

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";
const ZOMATO_MCP_URL = "https://mcp-server.zomato.com/mcp";
const YOUR_ADDRESS_ID = process.env.ZOMATO_ADDRESS_ID; // from get_saved_addresses_for_user, hardcoded for this account

/**
 * Sends a natural-language food query to Claude with Zomato MCP attached.
 * Returns { text, restaurants, raw } where restaurants is parsed from mcp_tool_result blocks.
 */
async function askZomato(userText) {
  const systemPrompt = `You have access to Zomato via MCP tools. The user's delivery address_id is ${YOUR_ADDRESS_ID}.
Use get_restaurants_for_keyword for searches. Do not create carts or checkout unless explicitly asked.
Keep responses short — you're feeding a WhatsApp bot, not chatting directly with the user.`;

  let res;
  try {
    res = await axios.post(
      CLAUDE_API_URL,
      {
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: "user", content: userText }],
        mcp_servers: [
          { type: "url", url: ZOMATO_MCP_URL, name: "zomato-mcp" }
        ]
      },
      {
        headers: {
          "x-api-key": ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
          "anthropic-beta": "mcp-client-2025-04-04" // required beta header for mcp_servers
        }
      }
    );
  } catch (err) {
    console.log("Claude API error:", err.response?.status, JSON.stringify(err.response?.data, null, 2));
    throw err;
  }

  const content = res.data.content || [];

  const textBlocks = content
    .filter(b => b.type === "text")
    .map(b => b.text)
    .join("\n");

  const toolResults = content.filter(b => b.type === "mcp_tool_result");

  const restaurants = [];
  for (const block of toolResults) {
    const raw = block?.content?.[0]?.text;
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed?.results)) {
        for (const r of parsed.results) {
          restaurants.push({
            res_id: r.res_id,
            name: r.name,
            rating: r.rating,
            eta: r.eta,
            offer: r.res_offer,
            image: r.res_image
          });
        }
      }
    } catch {
      // not JSON, ignore — text already captured above
    }
  }

  return { text: textBlocks, restaurants, raw: content };
}

/**
 * Maps parsed restaurants into your existing WhatsApp list-row format,
 * so you can pass this straight into sendList() from index.js.
 */
function restaurantsToWhatsAppRows(restaurants) {
  return restaurants.slice(0, 10).map(r => ({
    id: `ZOMATO_${r.res_id}`,
    title: r.name.slice(0, 24), // WhatsApp row title limit
    description: `${r.rating ? r.rating + "★" : ""} • ${r.eta || ""}${r.offer ? " • " + r.offer : ""}`.slice(0, 72)
  }));
}

module.exports = { askZomato, restaurantsToWhatsAppRows };