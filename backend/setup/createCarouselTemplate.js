require("dotenv").config();
const axios = require("axios");
const { uploadImage } = require("../uploadMedia");

const cards = [
    { name: "Farmhouse Pizza",   price: "349", img: "https://picsum.photos/seed/dominos-farmhouse/800/600",       payload: "ADD_DOMINOS_FARMHOUSE" },
    { name: "Crispy Burger",     price: "199", img: "https://picsum.photos/seed/bk-crispyburger/800/600",         payload: "ADD_BURGERKING_CRISPYBURGER" },
    { name: "Chicken Biryani",   price: "349", img: "https://picsum.photos/seed/behrouz-chickenbiryani/800/600", payload: "ADD_BEHROUZ_CHICKENBIRYANI" }
];

(async () => {

    console.log("Uploading card images...");
    const cardComponents = [];

    for (const c of cards) {
        const handle = await uploadImage(c.img, process.env.META_APP_ID, process.env.WA_TOKEN);
        console.log(`Uploaded: ${c.name} -> ${handle}`);

        cardComponents.push({
            components: [
                { type: "HEADER", format: "IMAGE", example: { header_handle: [handle] } },
                { type: "BODY", text: "{{1}} - only ₹{{2}}", example: { body_text: [[c.name, c.price]] } },
                { type: "BUTTONS", buttons: [{ type: "QUICK_REPLY", text: "Add to Cart" }] }
            ]
        });
    }

    console.log("Submitting template for approval...");

    const { data } = await axios.post(
        `https://graph.facebook.com/v23.0/${process.env.WABA_ID}/message_templates`,
        {
            name: "smartcart_carousel_demo",
            language: "en_US",
            category: "MARKETING",
            components: [{ type: "CAROUSEL", cards: cardComponents }]
        },
        { headers: { Authorization: `Bearer ${process.env.WA_TOKEN}` } }
    );

    console.log("Template submitted:", data);
    console.log("Check approval status in WhatsApp Manager -> Message Templates.");

})().catch(err => {
    console.log("ERROR:", err.response ? err.response.data : err.message);
});