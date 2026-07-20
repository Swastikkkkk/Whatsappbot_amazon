// setupCartCarouselTemplate.js
// RUN THIS ONCE to submit the carousel template for approval.
// After approval (check WhatsApp Manager -> Message Templates), use
// sendCartCarousel.js to actually send live cart data through it —
// you do NOT resubmit this every time the cart changes.

require("dotenv").config();
const axios = require("axios");
const { uploadImage } = require("./uploadMedia");

// Placeholder images for template approval only — Meta needs *an* example
// image per card slot to review the template. Real product images get
// swapped in at send-time by sendCartCarousel.js, not here.
const placeholderCards = [
    { name: "Sample Item 1", price: "99" },
    { name: "Sample Item 2", price: "149" },
    { name: "Sample Item 3", price: "199" }
];

const PLACEHOLDER_IMG = "https://picsum.photos/seed/cart-template-sample/800/600";

(async () => {

    console.log("Uploading placeholder images for template review...");
    const cardComponents = [];

    for (const c of placeholderCards) {
        const handle = await uploadImage(PLACEHOLDER_IMG, process.env.META_APP_ID, process.env.WA_TOKEN);
        console.log(`Uploaded placeholder for: ${c.name} -> ${handle}`);

        cardComponents.push({
            components: [
                { type: "HEADER", format: "IMAGE", example: { header_handle: [handle] } },
                {
                    type: "BODY",
                    text: "Item: {{1}}. Quantity selected: {{2}}. Price per unit: Rs {{3}}. Total for this item: Rs {{4}}.",
                    example: { body_text: [[c.name, "1", c.price, c.price]] }
                },
                {
                    type: "BUTTONS",
                    buttons: [
                        { type: "QUICK_REPLY", text: "+ Add" },
                        { type: "QUICK_REPLY", text: "- Remove" }
                    ]
                }
            ]
        });
    }

    console.log("Submitting template for approval...");

    try {
        const { data } = await axios.post(
            `https://graph.facebook.com/v23.0/${process.env.WABA_ID}/message_templates`,
            {
                name: "smartcart_cart_carousel",
                language: "en_US",
                category: "MARKETING", // Meta requires MARKETING category for carousel templates — UTILITY is rejected
                components: [
                    { type: "BODY", text: "Hi {{1}}, here is a summary of the items currently in your shopping cart:", example: { body_text: [["Swastik"]] } },
                    { type: "CAROUSEL", cards: cardComponents }
                ]
            },
            { headers: { Authorization: `Bearer ${process.env.WA_TOKEN}` } }
        );

        console.log("Template submitted:", data);
        console.log("");
        console.log("NEXT STEP: check approval status in WhatsApp Manager -> Message Templates.");
        console.log("Once approved, use sendCartCarousel.js to send live cart data through");
        console.log("this SAME approved template — you do not resubmit for approval again.");
    } catch (err) {
        console.log("ERROR:", err.response ? err.response.data : err.message);
    }

})();