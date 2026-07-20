// blinkitVision.js
// WhatsApp photo -> Claude vision -> extracted item list.
// Open-vocabulary: extracted items are searched directly against live
// Comparify data by the caller (index.js), not filtered through any local
// mock catalog first. Whatever Claude reads off the photo gets a real search.

require("dotenv").config();
const axios = require("axios");

const WA_TOKEN = process.env.WA_TOKEN;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";

/** Downloads a WhatsApp media file by its media_id, returns { base64, mimeType }. */
async function downloadWhatsAppMedia(mediaId) {
  const metaRes = await axios.get(`https://graph.facebook.com/v23.0/${mediaId}`, {
    headers: { Authorization: `Bearer ${WA_TOKEN}` }
  });
  const { url, mime_type } = metaRes.data;

  const fileRes = await axios.get(url, {
    headers: { Authorization: `Bearer ${WA_TOKEN}` },
    responseType: "arraybuffer"
  });

  return { base64: Buffer.from(fileRes.data).toString("base64"), mimeType: mime_type };
}

/** Sends the image to Claude, asks for a plain grocery item list. Returns string[]. */
async function extractItemsFromImage(base64, mimeType) {
  let res;
  try {
    res = await axios.post(
      CLAUDE_API_URL,
      {
        model: "claude-sonnet-4-6",
        max_tokens: 500,
        messages: [{
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mimeType, data: base64 } },
            { type: "text", text: "This is a photo of a grocery/shopping list or items, possibly handwritten or in a mix of languages/scripts (e.g. Hindi, Hinglish). Extract just the item names, one per line, in plain English grocery terms a store would recognize (translate/transliterate if needed), no quantities, no numbering, no extra text. If nothing readable, respond with NONE." }
          ]
        }]
      },
      { headers: { "x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.log("Vision extraction error:", err.response?.status, JSON.stringify(err.response?.data));
    throw err;
  }

  const text = (res.data.content || []).filter(b => b.type === "text").map(b => b.text).join("\n");
  if (!text || text.trim().toUpperCase() === "NONE") return [];
  return text.split("\n").map(l => l.trim()).filter(Boolean);
}

/**
 * Full pipeline: mediaId -> extracted item names, raw. No catalog filtering here —
 * the caller searches these directly against live Comparify data, so anything
 * Claude can read off the photo gets a real chance at a real search, not just
 * items that happen to already be in a hardcoded local list.
 */
async function photoToCart(mediaId) {
  const { base64, mimeType } = await downloadWhatsAppMedia(mediaId);
  const extracted = await extractItemsFromImage(base64, mimeType);
  return { extracted };
}

module.exports = { photoToCart, downloadWhatsAppMedia, extractItemsFromImage };