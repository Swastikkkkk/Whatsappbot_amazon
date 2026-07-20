// sendCartCarousel.js
// Sends the ALREADY-APPROVED "smartcart_cart_carousel" template, filled with
// live cart data each time. Run setupCartCarouselTemplate.js once first and
// wait for approval — this file does not submit anything for approval, it
// just sends real data through the template that's already live.

const { uploadImage } = require("./uploadMedia");

module.exports = function (send, WA_TOKEN, META_APP_ID) {

  const TEMPLATE_NAME = "smartcart_cart_carousel";
  const MAX_CARDS = 3; // must match however many card slots were approved in setupCartCarouselTemplate.js

  /**
   * Sends the live cart as the approved carousel template.
   * cartItems: [{ name, qty, price, imageUrl }]
   * Button payloads carry the item's index so your webhook can route
   * BLINKITQTY_INC_<i> / BLINKITQTY_DEC_<i> / BLINKITQTY_DEL_<i> exactly like
   * the stacked-message version already does.
   */
  async function sendCartCarousel(to, cartItems, userName) {

    if (cartItems.length === 0) return null;

    const cards = [];

    // WhatsApp carousel templates have a fixed max card count from approval —
    // if the real cart has more items than that, cap it and tell the user the
    // rest are in the text summary instead (see blinkitCart for the full list).
    const itemsToShow = cartItems.slice(0, MAX_CARDS);

    for (let i = 0; i < itemsToShow.length; i++) {
      const item = itemsToShow[i];
      const imageUrl = item.imageUrl || `https://picsum.photos/seed/${encodeURIComponent(item.name)}/800/600`;

      const handle = await uploadImage(imageUrl, META_APP_ID, WA_TOKEN);

      cards.push({
        card_index: i,
        components: [
          { type: "header", parameters: [{ type: "image", image: { id: handle } }] },
          {
            type: "body",
            parameters: [
              { type: "text", text: item.name },
              { type: "text", text: String(item.qty) },
              { type: "text", text: String(item.price) },
              { type: "text", text: String(item.qty * item.price) }
            ]
          },
          {
            type: "button",
            sub_type: "quick_reply",
            index: "0",
            parameters: [{ type: "payload", payload: `BLINKITQTY_INC_${i}` }]
          },
          {
            type: "button",
            sub_type: "quick_reply",
            index: "1",
            parameters: [{ type: "payload", payload: `BLINKITQTY_DEC_${i}` }]
          }
        ]
      });
    }

    return send({
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: {
        name: TEMPLATE_NAME,
        language: { code: "en_US" },
        components: [
          { type: "body", parameters: [{ type: "text", text: userName || "there" }] },
          { type: "carousel", cards }
        ]
      }
    });
  }

  return { sendCartCarousel };
};