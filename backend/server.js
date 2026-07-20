
// require("dotenv").config();

// const express = require("express");
// const axios = require("axios");
// const Razorpay = require("razorpay");

// const app = express();
// app.use(express.json());

// const PORT = process.env.PORT || 3000;

// const WA_TOKEN = process.env.WA_TOKEN;
// const WA_PHONE_ID = process.env.WA_PHONE_ID;
// const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

// const GRAPH_URL = `https://graph.facebook.com/v23.0/${WA_PHONE_ID}/messages`;

// const razorpay = new Razorpay({
//     key_id: process.env.RAZORPAY_KEY_ID,
//     key_secret: process.env.RAZORPAY_KEY_SECRET,
// });

// const sessions = {};

// console.log("====================================");
// console.log("SmartCart WhatsApp Bot Starting (Blinkit + District)...");
// console.log("PORT:", PORT);
// console.log("PHONE ID:", WA_PHONE_ID);
// console.log("TOKEN FOUND:", !!WA_TOKEN);
// console.log("VERIFY TOKEN:", VERIFY_TOKEN);
// console.log("====================================");

// const profile = {
//     name: "Swastik",
//     orders: 14,
//     points: 420,
//     address: "Home - 221B Baker Street"
// };

// function log(step) {
//     console.log(`\n${step}`);
// }

// async function send(payload) {
//     console.log("\nSending Payload");
//     console.log(JSON.stringify(payload, null, 2));
//     try {
//         const res = await axios.post(
//             GRAPH_URL,
//             payload,
//             { headers: { Authorization: `Bearer ${WA_TOKEN}`, "Content-Type": "application/json" } }
//         );
//         console.log("Meta Response");
//         console.log(res.data);
//         return res.data;
//     } catch (err) {
//         console.log("\nMETA ERROR");
//         if (err.response) {
//             console.log(err.response.status);
//             console.log(JSON.stringify(err.response.data, null, 2));
//         } else {
//             console.log(err.message);
//         }
//         throw err;
//     }
// }

// const extras = require("./whatsappExtras")(send, WA_TOKEN, WA_PHONE_ID);

// const { sendCartCarousel } = require("./sendCartCarousel")(send, WA_TOKEN, process.env.META_APP_ID);

// const reorderEngine = require("./reorderEngine")({ sendButtons, sendText });

// const appFlows = require("./appFlows")({
//     send, sendText, sendButtons, sendList, sendLocationRequest, extras, getSession, cartTotal, addToCart, randomOrderId, reorderEngine
// });

// const districtSocial = require("./districtSocial")({ sendText, sendButtons, sendList, getSession, extras });

// const blinkitVision = require("./blinkitVision");

// const recipeToCart = require("./recipeToCart");

// const comparifyBridge = require("./comparifyBridge");

// async function markAsReadWithTyping(messageId) {
//     return send({
//         messaging_product: "whatsapp",
//         status: "read",
//         message_id: messageId,
//         typing_indicator: { type: "text" }
//     });
// }

// async function sendLocationRequest(to, bodyText) {
//     return send({
//         messaging_product: "whatsapp",
//         to,
//         type: "interactive",
//         interactive: {
//             type: "location_request_message",
//             body: { text: bodyText || "Where should this go?" },
//             action: { name: "send_location" }
//         }
//     });
// }

// async function sendText(to, text) {
//     return send({ messaging_product: "whatsapp", to, type: "text", text: { body: text } });
// }

// async function sendButtons(to, bodyText, buttons) {
//     const interactive = {
//         type: "button",
//         body: { text: bodyText },
//         action: { buttons: buttons.map(b => ({ type: "reply", reply: { id: b.id, title: b.title } })) }
//     };
//     return send({ messaging_product: "whatsapp", to, type: "interactive", interactive });
// }

// async function sendImage(to, link, caption) {
//     return send({ messaging_product: "whatsapp", to, type: "image", image: { link, caption: caption || undefined } });
// }

// async function sendList(to, bodyText, buttonLabel, sections, headerText) {
//     const interactive = { type: "list", body: { text: bodyText }, action: { button: buttonLabel, sections } };
//     if (headerText) interactive.header = { type: "text", text: headerText };
//     return send({ messaging_product: "whatsapp", to, type: "interactive", interactive });
// }

// function getSession(phone) {
//     if (!sessions[phone]) {
//         sessions[phone] = { cart: [], activeItem: -1, lastOrder: null };
//     }
//     return sessions[phone];
// }

// function resetSession(phone) {
//     const existing = sessions[phone];
//     sessions[phone] = { cart: [], activeItem: -1, lastOrder: null, location: existing?.location, app: existing?.app };
//     return sessions[phone];
// }

// function cartTotal(cart) {
//     return cart.reduce((sum, i) => sum + (i.price * i.qty), 0);
// }

// function addToCart(session, name, price) {
//     const idx = session.cart.findIndex(i => i.name === name);
//     if (idx >= 0) {
//         session.cart[idx].qty += 1;
//         session.activeItem = idx;
//     } else {
//         session.cart.push({ name, price, qty: 1 });
//         session.activeItem = session.cart.length - 1;
//     }
// }

// function randomOrderId() {
//     return "AZ" + Math.floor(1000 + Math.random() * 9000);
// }

// async function sendHome(to) {
//     resetSession(to);
//     log("Home Sent");

//     return sendList(
//         to,
//         `Hey ${profile.name} 👋 what are we doing today?`,
//         "Menu",
//         [
//             {
//                 title: "Apps",
//                 rows: [
//                     { id: "BLINKIT_HOME",  title: "Blinkit",  description: "Groceries in 10 min" },
//                     { id: "DISTRICT_HOME", title: "District", description: "Dining, sports, events" }
//                 ]
//             },
//             {
//                 title: "Account",
//                 rows: [
//                     { id: "SUPPORT", title: "Need help?", description: "Talk to our team" }
//                 ]
//             }
//         ],
//         "SmartCart"
//     );
// }

// async function sendProfile(to) {
//     log("Profile Viewed");
//     return sendButtons(
//         to,
//         `${profile.name} · ${profile.orders} orders · ${profile.points} points\n📍 ${profile.address}`,
//         [
//             { id: "ADDRESSES", title: "Addresses" },
//             { id: "LOGOUT",    title: "Logout" }
//         ]
//     );
// }

// async function sendSupportContact(to) {
//     log("Support Contact Sent");
//     await extras.sendContactCard(to);
//     return extras.sendCTAButton(to, "Stuck on something? We're around.", "Chat with us", "https://example.com/help");
// }

// async function sendTrack(to) {
//     const session = getSession(to);
//     log("Track Viewed");
//     if (!session.lastOrder) {
//         return sendButtons(to, "Nothing on the way right now.", [{ id: "HOME", title: "Home" }]);
//     }
//     return sendButtons(
//         to,
//         `Order #${session.lastOrder.id} — ${session.lastOrder.status}`,
//         [{ id: "HOME", title: "Home" }]
//     );
// }

// async function sendDropAlert(to, eventName) {
//     log(`Drop Alert Sent: ${eventName}`);
//     return extras.sendCTAButton(
//         to,
//         `${eventName} tickets just dropped 🔥 Good seats won't last.`,
//         "Grab tickets",
//         `https://example.com/app/events/${encodeURIComponent(eventName)}`
//     );
// }

// async function sendAppSwitcher(to) {
//     return sendList(
//         to,
//         "Switch to which app?",
//         "Select App",
//         [{
//             title: "Apps",
//             rows: [
//                 { id: "BLINKIT_HOME",  title: "Blinkit",  description: "Groceries in 10 min" },
//                 { id: "DISTRICT_HOME", title: "District", description: "Dining, sports, events" }
//             ]
//         }]
//     );
// }

// app.get("/health", (req, res) => {
//     res.json({ success: true, running: true, sessions });
// });

// // Proxy endpoint — lets the Alexa Lambda use this server's IP for Comparify
// // calls, since Comparify has this IP trusted and Lambda's own IP gets blocked.
// app.post("/proxy/comparify-prices", async (req, res) => {
//     try {
//         const { itemNames, lat, lng } = req.body;
//         const realPrices = await comparifyBridge.getRealPricesForCatalog(itemNames, lat, lng);
//         res.json({ success: true, realPrices });
//     } catch (e) {
//         console.log("Proxy comparify error:", e.message);
//         res.status(500).json({ success: false, error: e.message });
//     }
// });

// app.get("/webhook", (req, res) => {
//     const mode = req.query["hub.mode"];
//     const token = req.query["hub.verify_token"];
//     const challenge = req.query["hub.challenge"];

//     if (mode === "subscribe" && token === VERIFY_TOKEN) {
//         log("Webhook Verified");
//         return res.status(200).send(challenge);
//     }
//     res.sendStatus(403);
// });

// app.post("/webhook", async (req, res) => {
//     res.sendStatus(200);

//     console.log("\nNEW EVENT");
//     console.log(JSON.stringify(req.body, null, 2));

//     try {
//         const message = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
//         if (!message) {
//             console.log("No message found");
//             return;
//         }

//         const from = message.from;
//         const session = getSession(from);

//         console.log("FROM:", from);
//         console.log("TYPE:", message.type);

//         try {
//             await markAsReadWithTyping(message.id);
//         } catch (e) {
//             console.log("Read receipt failed:", e.message);
//         }

//         if (message.type === "image") {
//             log(`Photo Received: ${message.image.id}`);
//             await sendText(from, "Got it, let me read your list...");

//             try {
//                 const { extracted } = await blinkitVision.photoToCart(message.image.id);

//                 if (extracted.length === 0) {
//                     await sendText(from, "Couldn't make out any items there — mind trying a clearer shot?");
//                     return;
//                 }

//                 const lat = session.location?.latitude || 28.5;
//                 const lng = session.location?.longitude || 77.4;
//                 const realPrices = await comparifyBridge.getRealPricesForCatalog(extracted, lat, lng);

//                 const addedLines = [];
//                 const skippedLines = [];

//                 for (const name of extracted) {
//                     const real = realPrices[name];
//                     if (real && real.inStock) {
//                         const displayName = real.matchedName || name;
//                         addToCart(session, displayName, real.price);
//                         reorderEngine.logOrder(from, displayName, real.price, "Blinkit");
//                         addedLines.push(`✓ ${displayName} — ₹${real.price}`);
//                         if (real.imageUrl) {
//                             await sendImage(from, real.imageUrl, `${displayName} — ₹${real.price}`);
//                         }
//                     } else {
//                         skippedLines.push(name);
//                     }
//                 }

//                 if (addedLines.length === 0) {
//                     await sendText(from, "Found the items but none are in stock right now, sorry!");
//                     return;
//                 }

//                 const skipLines = skippedLines.length ? `\n\nCouldn't find: ${skippedLines.join(", ")}` : "";

//                 await sendButtons(
//                     from,
//                     `Added ${addedLines.length} to your cart:\n\n${addedLines.join("\n")}${skipLines}`,
//                     [
//                         { id: "BLINKIT_CHECKOUT", title: "Checkout" },
//                         { id: "BLINKIT_BROWSE",   title: "Add more" }
//                     ]
//                 );
//             } catch (e) {
//                 console.log("Photo-to-cart failed:", e.message);
//                 await sendText(from, "Hmm, that didn't work. Mind trying again?");
//             }
//             return;
//         }

//         if (message.type === "location") {
//             log(`Location Received: ${message.location.latitude}, ${message.location.longitude}`);
//             session.location = message.location;

//             if (session.app === "BLINKIT") {
//                 await sendText(from, "Got it — showing what's actually in stock near you.");
//                 await appFlows.blinkitHome(from);
//                 return;
//             }

//             await sendText(from, "Location saved!");
//             return;
//         }

//         if (message.type === "text") {
//             const userText = message.text.body;
//             log(`User: ${userText}`);

//             if (session.app === "BLINKIT") {
//                 try {
//                     const dish = await recipeToCart.detectRecipeIntent(userText);
//                     if (dish) {
//                         await sendText(from, `Nice, figuring out what you need for ${dish}...`);

//                         const ingredients = await recipeToCart.getIngredientsForDish(dish);

//                         const lat = session.location?.latitude || 28.5;
//                         const lng = session.location?.longitude || 77.4;
//                         const realPrices = await comparifyBridge.getRealPricesForCatalog(ingredients, lat, lng);

//                         const addedLines = [];
//                         const skippedLines = [];

//                         for (const name of ingredients) {
//                             const real = realPrices[name];
//                             if (real && real.inStock) {
//                                 const displayName = real.matchedName || name;
//                                 addToCart(session, displayName, real.price);
//                                 reorderEngine.logOrder(from, displayName, real.price, "Blinkit");
//                                 addedLines.push(`✓ ${displayName} — ₹${real.price}`);
//                                 if (real.imageUrl) {
//                                     await sendImage(from, real.imageUrl, `${displayName} — ₹${real.price}`);
//                                 }
//                             } else {
//                                 skippedLines.push(name);
//                             }
//                         }

//                         if (addedLines.length === 0) {
//                             await sendText(from, `Got the ingredients for ${dish}, but none are in stock right now.`);
//                             return;
//                         }

//                         const skipLines = skippedLines.length ? `\n\nCouldn't find: ${skippedLines.join(", ")}` : "";

//                         await sendButtons(
//                             from,
//                             `Added ${addedLines.length} ingredient(s) for ${dish}:\n\n${addedLines.join("\n")}${skipLines}`,
//                             [
//                                 { id: "BLINKIT_CHECKOUT", title: "Checkout" },
//                                 { id: "BLINKIT_BROWSE",   title: "Add more" }
//                             ]
//                         );
//                         return;
//                     }
//                 } catch (e) {
//                     console.log("Recipe detection failed:", e.message);
//                 }

//                 try {
//                     const wantsToSendList = await recipeToCart.detectListIntent(userText);
//                     if (wantsToSendList) {
//                         await sendText(from, "Go for it — snap a photo of your list and I'll grab what's in stock.");
//                         return;
//                     }
//                 } catch (e) {
//                     console.log("List intent detection failed:", e.message);
//                 }
//             }

//             await sendHome(from);
//             return;
//         }

//         if (message.type !== "interactive") return;

//         const replyId = message.interactive.button_reply?.id || message.interactive.list_reply?.id;
//         if (!replyId) return;

//         session.lastReplyMessageId = message.id;
//         log(`${replyId} Clicked`);

//         if (replyId.startsWith("REORDER_COD_")) {
//             const parts = replyId.split("_");
//             const item = parts[2];
//             const price = parts[3];
//             addToCart(session, decodeURIComponent(item), Number(price));
//             reorderEngine.logOrder(from, decodeURIComponent(item), Number(price), "Blinkit");
//             await sendText(from, `${decodeURIComponent(item)} added, COD confirmed — on its way!`);
//             return;
//         }

//         if (replyId.startsWith("REORDER_ITEM_")) {
//             const itemName = decodeURIComponent(replyId.slice(13));
//             const pred = reorderEngine.predictItem(from, itemName);
//             addToCart(session, itemName, pred?.price || 0);
//             reorderEngine.logOrder(from, itemName, pred?.price || 0, pred?.app || "Blinkit");
//             await appFlows.blinkitCart(from);
//             return;
//         }

//         if (replyId.startsWith("DSCONNECT_")) {
//             const otherPhone = replyId.slice(10);
//             await districtSocial.connectUsers(from, otherPhone, profile.name, "Your Match");
//             return;
//         }

//         if (replyId.startsWith("DSVOTE_")) {
//             await districtSocial.castVote(from, replyId.slice(7));
//             return;
//         }

//         if (replyId.startsWith("BLINKITCAT_")) {
//             await appFlows.blinkitCategoryItems(from, replyId.slice(11));
//             return;
//         }

//         if (replyId.startsWith("BLINKITHISTADD_")) {
//             await appFlows.blinkitAddFromHistory(from, replyId.slice(15));
//             return;
//         }

//         if (replyId.startsWith("BLINKITQTY_INC_")) {
//             const idx = Number(replyId.slice(16));
//             if (session.cart[idx]) session.cart[idx].qty += 1;
//             await appFlows.blinkitCartCarousel(from);
//             return;
//         }

//         if (replyId.startsWith("BLINKITQTY_DEC_")) {
//             const idx = Number(replyId.slice(16));
//             if (session.cart[idx]) {
//                 if (session.cart[idx].qty > 1) {
//                     session.cart[idx].qty -= 1;
//                 } else {
//                     session.cart.splice(idx, 1);
//                 }
//             }
//             await appFlows.blinkitCartCarousel(from);
//             return;
//         }

//         if (replyId.startsWith("BLINKITQTY_DEL_")) {
//             const idx = Number(replyId.slice(16));
//             if (session.cart[idx]) session.cart.splice(idx, 1);
//             await appFlows.blinkitCartCarousel(from);
//             return;
//         }

//         if (replyId.startsWith("BLINKITADD_")) {
//             const parts = replyId.split("_");
//             const catKey = parts[1];
//             const code = parts[2];
//             const item = appFlows.groceryCatalog[catKey].items[code];
//             const real = session.blinkitRealPrices ? session.blinkitRealPrices[item.name] : null;

//             if (!real || !real.inStock) {
//                 await sendText(from, `${item.name} isn't in stock right now — try another?`);
//                 return;
//             }

//             addToCart(session, item.name, real.price);
//             reorderEngine.logOrder(from, item.name, real.price, "Blinkit");
//             if (real.imageUrl) {
//                 await sendImage(from, real.imageUrl, `${item.name} — ₹${real.price}`);
//             } else {
//                 await sendText(from, `Added ${item.name} — ₹${real.price}`);
//             }
//             await appFlows.blinkitCart(from);
//             return;
//         }

//         if (replyId.startsWith("DISTRICTCAT_")) {
//             await appFlows.districtCategoryPicked(from, replyId.slice(12));
//             return;
//         }

//         if (replyId.startsWith("DISTRICTSLOT_")) {
//             await appFlows.districtSlotConfirmed(from, replyId.slice(13));
//             return;
//         }

//         switch (replyId) {

//             case "APP_SWITCH":
//                 await sendAppSwitcher(from);
//                 break;

//             case "BLINKIT_HOME":
//                 await appFlows.blinkitHome(from);
//                 break;

//             case "BLINKIT_REORDER":
//                 await appFlows.blinkitReorder(from);
//                 break;

//             case "BLINKIT_BROWSE":
//                 await appFlows.blinkitCategories(from);
//                 break;

//             case "BLINKIT_VIEW_CART":
//                 try {
//                     await sendCartCarousel(from, session.cart.map(i => ({
//                         name: i.name,
//                         qty: i.qty,
//                         price: i.price
//                     })), profile.name);
//                     if (session.cart.length > 3) {
//                         await sendText(from, `That's the first 3 of ${session.cart.length} — full total below.`);
//                         await appFlows.blinkitCart(from);
//                     }
//                 } catch (e) {
//                     console.log("Carousel template send failed (likely not yet approved), falling back:", e.message);
//                     await appFlows.blinkitCartCarousel(from);
//                 }
//                 break;

//             case "BLINKIT_SUB":
//             case "BLINKIT_SUB_TOGGLE":
//                 const nowOn = appFlows.toggleWeeklyRepeat(from);
//                 await sendText(from, nowOn ? "Weekly repeat's on — I'll nudge you every Monday based on what you usually get." : "Turned off weekly repeat.");
//                 await appFlows.blinkitHome(from);
//                 break;

//             case "BLINKIT_CHECKOUT":
//                 await appFlows.blinkitCheckoutStart(from);
//                 break;

//             case "BLINKIT_PAY_RAZORPAY": {
//                 const subtotal = cartTotal(session.cart);
//                 const deliveryFee = subtotal >= 199 ? 0 : 25;
//                 const total = subtotal + deliveryFee;

//                 try {
//                     const paymentLink = await razorpay.paymentLink.create({
//                         amount: total * 100,
//                         currency: "INR",
//                         description: `SmartCart order — ₹${total}`,
//                         customer: { contact: from },
//                         notify: { sms: false, email: false },
//                         notes: { phone: from }
//                     });

//                     await extras.sendCTAButton(
//                         from,
//                         `Tap below to pay ₹${total} securely via Razorpay`,
//                         "Pay Now",
//                         paymentLink.short_url
//                     );
//                 } catch (e) {
//                     console.log("Razorpay link creation failed:", e.message);
//                     await sendText(from, "Payment link couldn't be created right now — try Cash on Delivery instead?");
//                 }
//                 break;
//             }

//             case "BLINKIT_PAY_COD":
//                 await appFlows.blinkitCheckout(from, "COD");
//                 break;

//             case "DISTRICT_HOME":
//                 await appFlows.districtHome(from);
//                 break;

//             case "DISTRICT_SOLO":
//                 await districtSocial.lookingBroadcast(from, profile.name, session.districtCategory || "Pickleball", "This Weekend");
//                 break;

//             case "DISTRICT_GROUP":
//                 await districtSocial.startGroupVote(from, 4);
//                 break;

//             case "DISTRICT_JOIN_GROUP":
//                 await sendText(from, "You're in! We'll share contacts once everyone confirms.");
//                 break;

//             case "DISTRICT_PAY": {
//                 const catKey = session.districtCategory;
//                 const catLabel = appFlows.districtCategories[catKey]?.label || "Activity";
//                 const nudgeCategory = catKey === "MOVIES" ? "Movies" : catKey === "EVENTS" ? "IPL" : "Activity";
//                 districtSocial.recordEvent(from, nudgeCategory, catLabel);
//                 await appFlows.districtBookingDone(from, false);
//                 break;
//             }

//             case "TRACK":
//                 await sendTrack(from);
//                 break;

//             case "PROFILE":
//                 await sendProfile(from);
//                 break;

//             case "ADDRESSES":
//                 await sendButtons(
//                     from,
//                     `📍 ${profile.address}`,
//                     [{ id: "HOME", title: "Home" }]
//                 );
//                 break;

//             case "LOGOUT":
//                 log("Logged Out");
//                 await sendText(from, "Logged out — see you next time!");
//                 resetSession(from);
//                 break;

//             case "SUPPORT":
//                 await sendSupportContact(from);
//                 break;

//             case "HOME":
//                 await sendHome(from);
//                 break;

//             default:
//                 await sendHome(from);
//         }

//     } catch (err) {
//         console.log("Handler error:", err.message);
//     }

// });

// // Point Razorpay Dashboard -> Settings -> Webhooks at:
// //   http://<your-public-url>/webhook/razorpay
// // (needs a public URL like ngrok — Razorpay's servers can't reach localhost directly)
// // Event to enable: payment_link.paid
// app.post("/webhook/razorpay", express.json(), async (req, res) => {
//     res.sendStatus(200); // ack immediately, Razorpay retries on non-200

//     const event = req.body.event;
//     console.log("Razorpay webhook event:", event);

//     if (event === "payment_link.paid") {
//         const entity = req.body.payload.payment_link.entity;
//         const phone = entity.notes?.phone;
//         const amount = entity.amount / 100;

//         if (!phone) return;

//         try {
//             await appFlows.blinkitCheckout(phone, "RAZORPAY");
//             await sendText(phone, `Payment of ₹${amount} received ✅`);
//         } catch (e) {
//             console.log("Webhook payment handling failed:", e.message);
//         }
//     }
// });

// app.post("/test/text", async (req, res) => {
//     await sendText(req.body.phone, "Hey from your server 👋");
//     res.json({ success: true });
// });

// app.post("/test/home", async (req, res) => {
//     await sendHome(req.body.phone);
//     res.json({ success: true });
// });

// app.post("/test/location-request", async (req, res) => {
//     await sendLocationRequest(req.body.phone, "Where should this go?");
//     res.json({ success: true });
// });

// app.post("/test/contact", async (req, res) => {
//     await extras.sendContactCard(req.body.phone);
//     res.json({ success: true });
// });

// app.post("/test/sticker", async (req, res) => {
//     await extras.sendSticker(req.body.phone);
//     res.json({ success: true });
// });

// app.post("/test/district-pod", async (req, res) => {
//     districtSocial.recordPairPlay(profile.name, req.body.buddy || "Rahul", req.body.sport || "Badminton");
//     districtSocial.recordPairPlay(profile.name, req.body.buddy || "Rahul", req.body.sport || "Badminton");
//     await districtSocial.checkAndSuggestPod(req.body.phone, profile.name, req.body.buddy || "Rahul", req.body.sport || "Badminton");
//     res.json({ success: true });
// });

// app.post("/test/district-nudge", async (req, res) => {
//     await districtSocial.ambientFreeNudge(req.body.phone, req.body.buddy || "Priya", req.body.activity || "padel");
//     res.json({ success: true });
// });

// app.post("/test/district-followup", async (req, res) => {
//     await districtSocial.postEventFollowup(req.body.phone, req.body.activity || "pickleball", req.body.group || ["Rahul", "Priya"]);
//     res.json({ success: true });
// });

// app.post("/test/district-waitlist", async (req, res) => {
//     await districtSocial.joinWaitlist(req.body.phone, profile.name, req.body.sport || "Badminton", req.body.slot || "7 PM Today");
//     res.json({ success: true });
// });

// app.post("/test/seed-orders", async (req, res) => {
//     const phone = req.body.phone;
//     const item = req.body.item;
//     const price = req.body.price;
//     const appName = req.body.app || "Blinkit";
//     const count = req.body.count || 4;
//     const intervalDays = req.body.intervalDays || 2;
//     const now = Date.now();
//     for (let i = count - 1; i >= 0; i--) {
//         reorderEngine.logOrder(phone, item, price, appName, now - i * intervalDays * 24 * 60 * 60 * 1000);
//     }
//     res.json({ success: true, prediction: reorderEngine.predictItem(phone, item) });
// });

// app.post("/test/check-due", async (req, res) => {
//     const now = req.body.fastForwardDays ? Date.now() + req.body.fastForwardDays * 24 * 60 * 60 * 1000 : Date.now();
//     const nudged = await reorderEngine.checkAndNudge(req.body.phone, now);
//     res.json({ success: true, nudged });
// });

// app.post("/test/seed-district-event", async (req, res) => {
//     const { phone, category, title, daysAgo = 15 } = req.body;
//     const timestamp = Date.now() - daysAgo * 24 * 60 * 60 * 1000;
//     districtSocial.recordEvent(phone, category, title, timestamp);
//     res.json({ success: true });
// });

// app.post("/test/check-district-nudge", async (req, res) => {
//     const movieMs = req.body.movieThresholdDays ? req.body.movieThresholdDays * 24 * 60 * 60 * 1000 : undefined;
//     const iplMs = req.body.iplThresholdMinutes ? req.body.iplThresholdMinutes * 60 * 1000 : undefined;
//     const movieSent = await districtSocial.checkMovieNudge(req.body.phone, Date.now(), movieMs);
//     const iplSent = await districtSocial.checkIplNudge(req.body.phone, Date.now(), iplMs);
//     res.json({ success: true, movieSent, iplSent });
// });

// app.post("/test/drop-alert", async (req, res) => {
//     await sendDropAlert(req.body.phone, req.body.event || "IPL Finals");
//     res.json({ success: true });
// });

// const TEN_MINUTES = 10 * 60 * 1000;
// const FIFTEEN_MINUTES = 15 * 60 * 1000;

// function knownPhones() {
//     const fromSessions = Object.keys(sessions);
//     const fromOrders = Object.keys(reorderEngine._orderLog || {});
//     const fromEvents = Object.keys(districtSocial._stores.eventLog || {});
//     return [...new Set([...fromSessions, ...fromOrders, ...fromEvents])];
// }

// setInterval(async () => {
//     const phones = knownPhones();
//     console.log(`[District nudge loop] checking ${phones.length} known user(s)`);
//     for (const phone of phones) {
//         try {
//             await districtSocial.checkMovieNudge(phone);
//             await districtSocial.checkIplNudge(phone);
//         } catch (e) {
//             console.log("District nudge loop error for", phone, e.message);
//         }
//     }
// }, TEN_MINUTES);

// setInterval(async () => {
//     const phones = knownPhones();
//     console.log(`[Blinkit reorder loop] checking ${phones.length} known user(s)`);
//     for (const phone of phones) {
//         try {
//             await reorderEngine.checkAndNudge(phone);
//         } catch (e) {
//             console.log("Blinkit reorder loop error for", phone, e.message);
//         }
//     }
// }, FIFTEEN_MINUTES);

// app.listen(PORT, () => {
//     console.log("");
//     console.log("====================================");
//     log("SERVER STARTED");
//     console.log("Server Running");
//     console.log(`http://localhost:${PORT}`);
//     console.log("Webhook:");
//     console.log(`http://localhost:${PORT}/webhook`);
//     console.log("====================================");
// });
require("dotenv").config();

const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

const WA_TOKEN = process.env.WA_TOKEN;
const WA_PHONE_ID = process.env.WA_PHONE_ID;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

const GRAPH_URL = `https://graph.facebook.com/v23.0/${WA_PHONE_ID}/messages`;

console.log("====================================");
console.log("Medicine Reminder Bot Starting...");
console.log("PORT:", PORT);
console.log("PHONE ID:", WA_PHONE_ID);
console.log("TOKEN FOUND:", !!WA_TOKEN);
console.log("====================================");

function log(step) {
    console.log(`\n${step}`);
}

/* ============================================================
   WHATSAPP SEND HELPERS (kept — still used by medicine reminder)
============================================================ */

async function send(payload) {
    console.log("\nSending Payload");
    console.log(JSON.stringify(payload, null, 2));
    try {
        const res = await axios.post(
            GRAPH_URL,
            payload,
            { headers: { Authorization: `Bearer ${WA_TOKEN}`, "Content-Type": "application/json" } }
        );
        console.log("Meta Response");
        console.log(res.data);
        return res.data;
    } catch (err) {
        console.log("\nMETA ERROR");
        if (err.response) {
            console.log(err.response.status);
            console.log(JSON.stringify(err.response.data, null, 2));
        } else {
            console.log(err.message);
        }
        throw err;
    }
}

async function sendText(to, text) {
    return send({ messaging_product: "whatsapp", to, type: "text", text: { body: text } });
}

async function sendButtons(to, bodyText, buttons) {
    const interactive = {
        type: "button",
        body: { text: bodyText },
        action: { buttons: buttons.map(b => ({ type: "reply", reply: { id: b.id, title: b.title } })) }
    };
    return send({ messaging_product: "whatsapp", to, type: "interactive", interactive });
}

/*
============================================================
BLINKIT / DISTRICT / RAZORPAY — COMMENTED OUT FOR NOW
Everything below this block is your previous SmartCart food-ordering
logic. Left in place so you can re-enable by uncommenting later —
nothing deleted, just switched off so this file only runs the
medicine reminder tonight.
============================================================

const Razorpay = require("razorpay");
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const sessions = {};

const profile = {
    name: "Swastik",
    orders: 14,
    points: 420,
    address: "Home - 221B Baker Street"
};

const extras = require("./whatsappExtras")(send, WA_TOKEN, WA_PHONE_ID);
const { sendCartCarousel } = require("./sendCartCarousel")(send, WA_TOKEN, process.env.META_APP_ID);
const reorderEngine = require("./reorderEngine")({ sendButtons, sendText });
const appFlows = require("./appFlows")({
    send, sendText, sendButtons, sendList, sendLocationRequest, extras, getSession, cartTotal, addToCart, randomOrderId, reorderEngine
});
const districtSocial = require("./districtSocial")({ sendText, sendButtons, sendList, getSession, extras });
const blinkitVision = require("./blinkitVision");
const recipeToCart = require("./recipeToCart");
const comparifyBridge = require("./comparifyBridge");

... [ rest of your Blinkit/District/Razorpay code — all of it stays here,
     just wrap the whole block in this comment. Everything from your
     original file between here and the app.listen() at the bottom
     goes inside this same /* ... * / comment block. ]

============================================================
END OF COMMENTED-OUT BLOCK
============================================================
*/

/* ============================================================
   FAMILY NUMBERS
============================================================ */

const FAMILY = {
  me:      "919582626655", // your own test number
  brother: "919560187186", // gets the Yes button
  mom:     "919971872399"
  // sister and dad removed for now — not yet added/verified as test recipients
  // (Meta rejects messages to unverified numbers in test mode).
  // Add back once verified: sister: "917827130963", dad: "919958360016"
};

/* ============================================================
   MEDICINE REMINDER LOGIC
   - Fires at 9:00 AM and 9:00 PM daily
   - Pings brother with a Yes button
   - If he taps Yes -> tells everyone (sister/dad/mom) he took it, done for this slot
   - If he doesn't respond -> re-pings him every 5 min
   - After 15 min of silence -> also pings sister/dad/mom to check on him
   - Keeps nagging everyone every 5 min until he confirms
============================================================ */

const SCHEDULE = [
  { key: "morning", hour: 9,  minute: 0, label: "morning" },
  { key: "evening", hour: 21, minute: 0, label: "evening" }
];

const RETRY_INTERVAL_MS = 5 * 60 * 1000;   // reminder cycle: every 5 min
const ESCALATE_AFTER_MS = 5 * 60 * 1000;   // alert Mom/Dad after 5 min of no reply

const medState = {
  morning: { confirmed: true, startedAt: null, familyNotified: false, retryHandle: null },
  evening: { confirmed: true, startedAt: null, familyNotified: false, retryHandle: null }
};

async function pingBrother(doseKey, label, attempt) {
  const buttonId = doseKey === "morning" ? "MED_YES_MORNING" : "MED_YES_EVENING";
  const body = attempt > 0
    ? `⏰ Still waiting — did you take your ${label} medicine? Tap below once you have.`
    : `💊 Hey! Time for your ${label} medicine. Tap below once you've taken it.`;
  await sendButtons(
    FAMILY.brother,
    body,
    [{ id: buttonId, title: "✅ Yes, taken" }]
  );
}

// Everyone except the brother — Mom (and Dad once his number's verified).
function familyMembers() {
  return [FAMILY.mom, FAMILY.dad].filter(Boolean);
}

async function pingFamilyEscalation(doseKey, label, minutesLate) {
  for (const number of familyMembers()) {
    await sendText(
      number,
      `⚠️ He hasn't confirmed his ${label} medicine (${minutesLate} min late). Could someone give him a nudge or check in?`
    );
  }
}

async function notifyFamilyConfirmed(label) {
  for (const number of familyMembers()) {
    await sendText(number, `✅ All good — he's taken his ${label} medicine.`);
  }
}

function clearRetry(doseKey) {
  if (medState[doseKey].retryHandle) {
    clearInterval(medState[doseKey].retryHandle);
    medState[doseKey].retryHandle = null;
  }
}

async function startDoseCheck(doseKey, label) {
  clearRetry(doseKey);

  medState[doseKey] = { confirmed: false, startedAt: Date.now(), familyNotified: false, attempt: 0, retryHandle: null };

  await pingBrother(doseKey, label, 0);

  medState[doseKey].retryHandle = setInterval(async () => {
    const s = medState[doseKey];
    if (s.confirmed) {
      clearRetry(doseKey);
      return;
    }

    s.attempt += 1;
    const minutesLate = Math.round((Date.now() - s.startedAt) / 60000);

    // First time we cross the escalation threshold, flag it.
    if (!s.familyNotified && (Date.now() - s.startedAt) >= ESCALATE_AFTER_MS) {
      s.familyNotified = true;
    }

    // Nudge the brother again every cycle.
    try { await pingBrother(doseKey, label, s.attempt); } catch (e) { console.log("Brother re-ping failed:", e.message); }

    // Once escalated, alert family every cycle too, until he confirms.
    if (s.familyNotified) {
      try { await pingFamilyEscalation(doseKey, label, minutesLate); } catch (e) { console.log("Family escalation failed:", e.message); }
    }

  }, RETRY_INTERVAL_MS);
}

/** Called when brother taps "Yes, done". Stops all reminders for this dose and tells the family. */
async function confirmDose(doseKey, label) {
  if (!medState[doseKey]) return;
  medState[doseKey].confirmed = true;
  clearRetry(doseKey);

  try {
    await notifyFamilyConfirmed(label);
  } catch (e) {
    console.log("notifyFamilyConfirmed failed:", e.message);
  }
}

function medicineTick() {
  // Force IST regardless of server timezone (Render runs in UTC).
  const istNow = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  for (const slot of SCHEDULE) {
    if (istNow.getHours() === slot.hour && istNow.getMinutes() === slot.minute) {
      const s = medState[slot.key];
      const alreadyStartedThisMinute = s.startedAt && (Date.now() - s.startedAt) < 60 * 1000;
      if (!alreadyStartedThisMinute) {
        startDoseCheck(slot.key, slot.label).catch(e => console.log("startDoseCheck failed:", e.message));
      }
    }
  }
}

/* ============================================================
   WEBHOOK
============================================================ */

app.get("/health", (req, res) => {
    res.json({ ok: true, time: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }) });
});

app.get("/webhook", (req, res) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
        log("Webhook Verified");
        return res.status(200).send(challenge);
    }
    res.sendStatus(403);
});

app.post("/webhook", async (req, res) => {
    res.sendStatus(200);

    try {
        const statuses = req.body.entry?.[0]?.changes?.[0]?.value?.statuses;
        if (statuses) {
            for (const s of statuses) {
                console.log(`STATUS: ${s.status} for ${s.recipient_id}`);
                if (s.status === "failed") {
                    console.log("FAILURE DETAILS:", JSON.stringify(s.errors, null, 2));
                }
            }
        }

        const message = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
        if (!message) {
            console.log("No message found");
            return;
        }

        console.log("FROM:", message.from);
        console.log("TYPE:", message.type);

        if (message.type !== "interactive") return;

        const replyId = message.interactive.button_reply?.id || message.interactive.list_reply?.id;
        if (!replyId) return;

        log(`${replyId} Clicked`);

        if (replyId === "MED_YES_MORNING") {
            await confirmDose("morning", "morning");
            await sendText(message.from, "Nice one ✅ marked as taken. Your family's been let know too.");
            return;
        }

        if (replyId === "MED_YES_EVENING") {
            await confirmDose("evening", "evening");
            await sendText(message.from, "Nice one ✅ marked as taken. Your family's been let know too.");
            return;
        }

    } catch (err) {
        console.log("Handler error:", err.message);
    }
});

/* ============================================================
   TEST ROUTE — trigger a check right now without waiting for 9am/9pm
============================================================ */

app.post("/test/medicine-reminder", async (req, res) => {
    const dose = req.body.dose === "evening" ? "evening" : "morning";
    await startDoseCheck(dose, dose);
    res.json({ success: true });
});

// Fires immediately to all three (you, mom, brother) at once — no schedule, no dose logic.
// Just for confirming delivery to all three numbers works right now.
app.post("/test/blast-all", async (req, res) => {
    const text = req.body.text || "Test message — checking delivery to everyone at once.";
    const recipients = [FAMILY.me, FAMILY.mom, FAMILY.brother];

    await Promise.all(recipients.map(number => sendText(number, text)));

    res.json({ success: true, sentTo: recipients });
});

/* ============================================================
   START
============================================================ */

app.listen(PORT, () => {
    console.log("");
    console.log("====================================");
    log("SERVER STARTED");
    console.log("Server Running");
    console.log(`http://localhost:${PORT}`);
    console.log("Webhook:");
    console.log(`http://localhost:${PORT}/webhook`);
    console.log("====================================");
    console.log("Medicine reminder scheduler active — checking every minute for 9:00 AM / 9:00 PM (IST).");
    setInterval(medicineTick, 60 * 1000);

    // Keep-alive: ping self every 10 min so Render's free tier doesn't sleep
    // (a sleeping service = frozen scheduler = missed 9am/9pm reminders).
    const SELF_URL = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
    setInterval(() => {
        axios.get(`${SELF_URL}/health`).catch(() => {});
    }, 10 * 60 * 1000);
});