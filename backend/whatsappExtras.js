// whatsappExtras.js
// Drop this file next to server.js. Import the functions you need.
//
// Usage in server.js:
//   const extras = require("./whatsappExtras")(send, WA_TOKEN, WA_PHONE_ID);
//   await extras.sendContactCard(to);
//   await extras.sendSticker(to);
//   await extras.sendReceiptPDF(to, orderId, cart, total);
//   await extras.sendCTAButton(to, "Track your order live", "Track Order", "https://example.com/track/123");
//   await extras.sendFlow(to, "YOUR_FLOW_ID");

const axios = require("axios");
const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const FormData = require("form-data");

module.exports = function (send, WA_TOKEN, WA_PHONE_ID) {

    const MEDIA_URL = `https://graph.facebook.com/v23.0/${WA_PHONE_ID}/media`;

    /* ============================================================
       1. CONTACT MESSAGE (vCard-style tappable contact)
    ============================================================ */

    async function sendContactCard(to) {
        return send({
            messaging_product: "whatsapp",
            to,
            type: "contacts",
            contacts: [
                {
                    name: {
                        formatted_name: "SmartCart Support",
                        first_name: "SmartCart",
                        last_name: "Support"
                    },
                    phones: [
                        { phone: "+919582626655", type: "WORK", wa_id: "919582626655" }
                    ],
                    emails: [
                        { email: "support@smartcart.demo", type: "WORK" }
                    ],
                    org: {
                        company: "SmartCart",
                        title: "Customer Support"
                    }
                }
            ]
        });
    }

    /* ============================================================
       2. STICKER MESSAGE
       Note: WhatsApp requires a real .webp sticker file (animated
       or static). This uses a public sample sticker link for demo
       purposes — swap the URL for your own .webp asset.
    ============================================================ */

    async function sendSticker(to, stickerLink) {
        return send({
            messaging_product: "whatsapp",
            to,
            type: "sticker",
            sticker: { link: stickerLink || "https://raw.githubusercontent.com/WhatsApp/stickers/main/Android/app/src/main/assets/1/01_Cuppy_smile.webp" }
        });
    }

    /* ============================================================
       3. PDF RECEIPT — generate, upload as media, send as document
    ============================================================ */

    function generateReceiptPDF(orderId, cart, total) {

        const filePath = path.join(require("os").tmpdir(), `receipt-${orderId}.pdf`);
        const doc = new PDFDocument({ margin: 50 });

        doc.pipe(fs.createWriteStream(filePath));

        doc.fontSize(20).text("SmartCart", { align: "center" });
        doc.moveDown(0.5);
        doc.fontSize(12).text(`Order Receipt #${orderId}`, { align: "center" });
        doc.moveDown(1);

        doc.fontSize(10).text(`Date: ${new Date().toLocaleString()}`);
        doc.moveDown(1);

        doc.fontSize(12).text("Items", { underline: true });
        doc.moveDown(0.5);

        cart.forEach(item => {
            doc.fontSize(10).text(`${item.name}  x${item.qty}`, { continued: true });
            doc.text(`₹${item.price * item.qty}`, { align: "right" });
        });

        doc.moveDown(1);
        doc.fontSize(12).text(`Total: ₹${total}`, { align: "right" });

        doc.moveDown(2);
        doc.fontSize(9).fillColor("gray").text("Thank you for ordering with SmartCart!", { align: "center" });

        doc.end();

        return new Promise((resolve, reject) => {
            doc.on("end", () => resolve(filePath));
            doc.on("error", reject);
        });
    }

    async function uploadMediaFile(filePath, mimeType) {

        const form = new FormData();
        form.append("messaging_product", "whatsapp");
        form.append("file", fs.createReadStream(filePath), { contentType: mimeType });

        const res = await axios.post(MEDIA_URL, form, {
            headers: {
                Authorization: `Bearer ${WA_TOKEN}`,
                ...form.getHeaders()
            }
        });

        return res.data.id; // media_id
    }

    async function sendReceiptPDF(to, orderId, cart, total) {

        const filePath = await generateReceiptPDF(orderId, cart, total);
        const mediaId = await uploadMediaFile(filePath, "application/pdf");

        const result = await send({
            messaging_product: "whatsapp",
            to,
            type: "document",
            document: {
                id: mediaId,
                filename: `SmartCart_Receipt_${orderId}.pdf`,
                caption: `🧾 Your receipt for order #${orderId}`
            }
        });

        fs.unlink(filePath, () => {}); // cleanup temp file
        return result;
    }

    /* ============================================================
       4. INTERACTIVE CTA URL BUTTON
    ============================================================ */

    async function sendCTAButton(to, bodyText, buttonText, url, headerText) {

        const interactive = {
            type: "cta_url",
            body: { text: bodyText },
            action: {
                name: "cta_url",
                parameters: { display_text: buttonText, url }
            }
        };

        if (headerText) interactive.header = { type: "text", text: headerText };

        return send({
            messaging_product: "whatsapp",
            to,
            type: "interactive",
            interactive
        });
    }

    return {
        sendContactCard,
        sendSticker,
        generateReceiptPDF,
        sendReceiptPDF,
        sendCTAButton
    };
};