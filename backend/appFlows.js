// // // appFlows.js
// // // Blinkit, District, Bistro flows. Zomato stays in index.js as the reference flow.
// // // Wire in: const appFlows = require("./appFlows")({ send, sendText, sendImage, sendButtons, sendList, extras, imageFor, getSession, cartTotal, addToCart, randomOrderId });

// // const comparifyBridge = require("./comparifyBridge");

// // // Default location for demo — swap for user's shared WhatsApp location once captured.
// // const DEFAULT_LAT = 28.5;
// // const DEFAULT_LNG = 77.4;

// // module.exports = function (ctx) {

// //   const { sendText, sendImage, sendButtons, sendList, extras, imageFor, getSession, cartTotal, addToCart, randomOrderId, reorderEngine } = ctx;

// //   /* ============================================================
// //      BLINKIT — Grocery / Daily Essentials (proactive, reorder-first)
// //   ============================================================ */

// //   const groceryCatalog = {
// //     DAIRY: {
// //       label: "🥛 Dairy & Bread",
// //       items: {
// //         MILK:   { name: "Amul Milk 1L",     price: 66,  img: imageFor("blinkit-milk") },
// //         BREAD:  { name: "Brown Bread",      price: 45,  img: imageFor("blinkit-bread") },
// //         EGGS:   { name: "Eggs (12 pc)",     price: 84,  img: imageFor("blinkit-eggs") },
// //         PANEER: { name: "Paneer 200g",      price: 89,  img: imageFor("blinkit-paneer") },
// //         CURD:   { name: "Amul Curd 400g",   price: 45,  img: imageFor("blinkit-curd") },
// //         BUTTER: { name: "Amul Butter 100g", price: 56,  img: imageFor("blinkit-butter") },
// //         CHEESE: { name: "Cheese Slices",    price: 99,  img: imageFor("blinkit-cheese") }
// //       }
// //     },
// //     SNACKS: {
// //       label: "🍪 Snacks & Munchies",
// //       items: {
// //         CHIPS:   { name: "Lays Chips",      price: 20, img: imageFor("blinkit-chips") },
// //         BISCUIT: { name: "Parle-G",         price: 10, img: imageFor("blinkit-biscuit") },
// //         MAGGI:   { name: "Maggi 4-pack",    price: 56, img: imageFor("blinkit-maggi") },
// //         KURKURE: { name: "Kurkure",         price: 20, img: imageFor("blinkit-kurkure") },
// //         OREO:    { name: "Oreo Biscuits",   price: 30, img: imageFor("blinkit-oreo") },
// //         BOURBON: { name: "Bourbon Biscuits",price: 35, img: imageFor("blinkit-bourbon") },
// //         NAMKEEN: { name: "Haldiram Namkeen",price: 65, img: imageFor("blinkit-namkeen") }
// //       }
// //     },
// //     FRESH: {
// //       label: "🥦 Fruits & Veggies",
// //       items: {
// //         ONION:  { name: "Onion 1kg",   price: 38, img: imageFor("blinkit-onion") },
// //         TOMATO: { name: "Tomato 1kg",  price: 42, img: imageFor("blinkit-tomato") },
// //         BANANA: { name: "Banana Dozen",price: 55, img: imageFor("blinkit-banana") },
// //         POTATO: { name: "Potato 1kg",  price: 30, img: imageFor("blinkit-potato") },
// //         APPLE:  { name: "Apple 1kg",   price: 120,img: imageFor("blinkit-apple") },
// //         CAPSICUM:{ name: "Capsicum 500g", price: 35, img: imageFor("blinkit-capsicum") }
// //       }
// //     }
// //   };

// //   // recentGroceryOrder mock removed — Reorder Usual now pulls from reorderEngine's real order log.

// //   async function blinkitHome(to) {
// //     const session = getSession(to);
// //     session.app = "BLINKIT";

// //     if (!session.location) {
// //       return ctx.sendLocationRequest(to, "📍 Share your location so we can show real Blinkit prices & availability near you");
// //     }

// //     await sendImage(to, imageFor("blinkit-banner"), "🛒 Blinkit — 10 min delivery");

// //     return sendList(
// //       to,
// //       "🛒 What do you need today?",
// //       "Menu",
// //       [{
// //         title: "Quick Actions",
// //         rows: [
// //           { id: "BLINKIT_REORDER", title: "🔁 Reorder Usual",   description: "See your last 5 orders" },
// //           { id: "BLINKIT_BROWSE",  title: "🧺 Browse Categories", description: "Dairy, Snacks, Fresh & more" },
// //           { id: "BLINKIT_SUB",     title: "📅 Set Weekly Repeat", description: "Auto-reorder essentials" },
// //           { id: "APP_SWITCH",      title: "🔄 Switch App",        description: "District" }
// //         ]
// //       }],
// //       "Blinkit"
// //     );
// //   }

// //   async function blinkitReorder(to) {
// //     const session = getSession(to);
// //     const history = (reorderEngine._orderLog[to] || [])
// //       .filter(o => o.app === "Blinkit")
// //       .sort((a, b) => b.timestamp - a.timestamp);

// //     // Dedupe to most recent 5 distinct items.
// //     const seen = new Set();
// //     const lastFive = [];
// //     for (const o of history) {
// //       if (!seen.has(o.item)) {
// //         seen.add(o.item);
// //         lastFive.push(o);
// //       }
// //       if (lastFive.length >= 5) break;
// //     }

// //     if (lastFive.length === 0) {
// //       return sendText(to, "You haven't ordered anything on Blinkit yet — browse categories to get started, then Reorder Usual will remember your history.");
// //     }

// //     session.blinkitHistoryCache = lastFive;

// //     const rows = lastFive.map((o, idx) => ({
// //       id: `BLINKITHISTADD_${idx}`,
// //       title: o.item,
// //       description: `Rs${o.price} — last ordered ${new Date(o.timestamp).toLocaleDateString()}`
// //     }));

// //     return sendList(to, "Your last 5 orders", "Add to Cart", [{ title: "Order History", rows }]);
// //   }

// //   async function blinkitAddFromHistory(to, idx) {
// //     const session = getSession(to);
// //     const item = session.blinkitHistoryCache?.[Number(idx)];
// //     if (!item) return sendText(to, "That item expired, try Reorder Usual again.");

// //     addToCart(session, item.item, item.price);
// //     reorderEngine.logOrder(to, item.item, item.price, "Blinkit", item.image);

// //     if (item.image) await sendImage(to, item.image, `Added: ${item.item} - Rs${item.price}`);
// //     return blinkitCartCarousel(to);
// //   }

// //   async function blinkitCategories(to) {
// //     const rows = Object.keys(groceryCatalog).map(key => ({
// //       id: `BLINKITCAT_${key}`,
// //       title: groceryCatalog[key].label,
// //       description: ""
// //     }));
// //     rows.push({ id: "BLINKIT_HOME", title: "⬅️ Back", description: "" });

// //     return sendList(to, "🧺 Categories", "Select", [{ title: "Categories", rows }]);
// //   }

// //   async function blinkitCategoryItems(to, catKey) {
// //     const cat = groceryCatalog[catKey];
// //     const session = getSession(to);
// //     const lat = session.location?.latitude || DEFAULT_LAT;
// //     const lng = session.location?.longitude || DEFAULT_LNG;

// //     const itemNames = Object.values(cat.items).map(i => i.name);

// //     let realPrices = {};
// //     try {
// //       realPrices = await comparifyBridge.getRealPricesForCatalog(itemNames, lat, lng);
// //     } catch (e) {
// //       console.log("Comparify fetch failed:", e.message);
// //     }

// //     session.blinkitRealPrices = { ...(session.blinkitRealPrices || {}), ...realPrices };

// //     // Only items Comparify actually found in stock get shown — no mock fallback.
// //     const availableCodes = Object.keys(cat.items).filter(code => {
// //       const real = realPrices[cat.items[code].name];
// //       return real?.inStock;
// //     });

// //     if (availableCodes.length === 0) {
// //       return sendButtons(
// //         to,
// //         `😕 Couldn't find live Blinkit stock for anything in ${cat.label} right now. Try another category?`,
// //         [{ id: "BLINKIT_BROWSE", title: "⬅️ Back to Categories" }]
// //       );
// //     }

// //     for (const code of availableCodes) {
// //       const item = cat.items[code];
// //       const real = realPrices[item.name];
// //       await sendImage(to, real.imageUrl, `${item.name}\n₹${real.price} (live Blinkit price)`);
// //     }

// //     const rows = availableCodes.map(code => {
// //       const item = cat.items[code];
// //       const real = realPrices[item.name];
// //       return { id: `BLINKITADD_${catKey}_${code}`, title: item.name, description: `₹${real.price} (live)` };
// //     });
// //     rows.push({ id: "BLINKIT_BROWSE", title: "⬅️ Back to Categories", description: "" });

// //     return sendList(to, cat.label, "Add Items", [{ title: cat.label, rows }]);
// //   }

// //   async function blinkitCart(to) {
// //     const session = getSession(to);
// //     if (session.cart.length === 0) return sendText(to, "🛒 Your cart is empty. Type Hi to start.");

// //     const lines = session.cart
// //       .map(i => `${i.name}\n  Qty: ${i.qty}  ×  ₹${i.price}  =  ₹${i.price * i.qty}`)
// //       .join("\n\n");

// //     const subtotal = cartTotal(session.cart);
// //     const deliveryFee = subtotal >= 199 ? 0 : 25;
// //     const total = subtotal + deliveryFee;
// //     const itemCount = session.cart.reduce((s, i) => s + i.qty, 0);

// //     return sendButtons(
// //       to,
// //       `🛒 Your Basket (${itemCount} item${itemCount > 1 ? "s" : ""})\n\n${lines}\n\n━━━━━━━━━━\nSubtotal: ₹${subtotal}\nDelivery: ${deliveryFee === 0 ? "FREE" : "₹" + deliveryFee}\n━━━━━━━━━━\nTotal: ₹${total}\n\n⏱ Estimated delivery: 10 min`,
// //       [
// //         { id: "BLINKIT_VIEW_CART",  title: "🎠 View Cart" },
// //         { id: "BLINKIT_SUB_TOGGLE", title: "📅 Repeat Weekly" },
// //         { id: "BLINKIT_CHECKOUT",   title: "✅ Checkout" }
// //       ],
// //       { image: imageFor("blinkit-cart") }
// //     );
// //   }

// //   // Carousel-style cart: one image card per item with +/- and remove, sent
// //   // as a sequence (WhatsApp media-carousel templates need pre-approval and
// //   // static content, so this achieves the same scroll-through feel dynamically).
// //   async function blinkitCartCarousel(to) {
// //     const session = getSession(to);
// //     if (session.cart.length === 0) return sendText(to, "🛒 Your cart is empty.");

// //     for (let i = 0; i < session.cart.length; i++) {
// //       const item = session.cart[i];
// //       const real = session.blinkitRealPrices?.[item.name];
// //       const img = real?.imageUrl || item.image || imageFor(item.name);

// //       await sendButtons(
// //         to,
// //         `${item.name}\nQty: ${item.qty}  ×  ₹${item.price} = ₹${item.qty * item.price}`,
// //         [
// //           { id: `BLINKITQTY_INC_${i}`, title: "➕" },
// //           { id: `BLINKITQTY_DEC_${i}`, title: "➖" },
// //           { id: `BLINKITQTY_DEL_${i}`, title: "🗑 Remove" }
// //         ],
// //         { image: img }
// //       );
// //     }

// //     return sendButtons(
// //       to,
// //       "That's your full cart. Ready to checkout?",
// //       [
// //         { id: "BLINKIT_CHECKOUT", title: "✅ Checkout" },
// //         { id: "BLINKIT_BROWSE",   title: "➕ Add More" }
// //       ]
// //     );
// //   }

// //   async function blinkitCheckoutStart(to) {
// //     const session = getSession(to);
// //     if (session.cart.length === 0) return sendText(to, "🛒 Your cart is empty.");

// //     const subtotal = cartTotal(session.cart);
// //     const deliveryFee = subtotal >= 199 ? 0 : 25;
// //     const total = subtotal + deliveryFee;

// //     return sendButtons(
// //       to,
// //       `💳 Choose payment method\n\nTotal: ₹${total}`,
// //       [
// //         { id: "BLINKIT_PAY_RAZORPAY", title: "💳 Pay via Razorpay" },
// //         { id: "BLINKIT_PAY_COD",      title: "💵 Cash on Delivery" }
// //       ]
// //     );
// //   }

// //   async function blinkitCheckout(to, method = "COD") {
// //     const session = getSession(to);
// //     const orderId = randomOrderId();
// //     const subtotal = cartTotal(session.cart);
// //     const deliveryFee = subtotal >= 199 ? 0 : 25;
// //     const total = subtotal + deliveryFee;

// //     session.lastOrder = { id: orderId, cart: session.cart, total, status: "placed", app: "BLINKIT", paymentMethod: method };
// //     session.cart = [];

// //     const payLine = method === "RAZORPAY" ? "Payment received via Razorpay ✅" : "Pay ₹" + total + " on delivery (COD)";

// //     await sendImage(to, imageFor("blinkit-confirmed-" + orderId), `✅ Order Confirmed! #${orderId}\nTotal: ₹${total}\n${payLine}\n\n🛵 Arriving in 10 minutes`);

// //     setTimeout(() => sendText(to, "📦 Your Blinkit order is out for delivery — 3 min away!"), 4000);
// //     setTimeout(() => sendText(to, "🎉 Delivered! Enjoy."), 8000);
// //   }

// //   function toggleWeeklyRepeat(to) {
// //     const session = getSession(to);
// //     session.blinkitWeeklyRepeat = !session.blinkitWeeklyRepeat;
// //     return session.blinkitWeeklyRepeat;
// //   }

// //   /* ============================================================
// //      DISTRICT — Flow A (book activity) + Flow B (solo-to-group)
// //   ============================================================ */

// //   const districtCategories = {
// //     DINING:    { label: "🍽 Dining Out",  img: imageFor("district-dining") },
// //     MOVIES:    { label: "🎬 Movies",      img: imageFor("district-movies") },
// //     PICKLEBALL:{ label: "🏓 Pickleball",  img: imageFor("district-pickleball") },
// //     PADDLE:    { label: "🏸 Paddle",      img: imageFor("district-paddle") },
// //     ADVENTURE: { label: "🧗 Adventure",   img: imageFor("district-adventure") },
// //     EVENTS:    { label: "🎟 Events / IPL",img: imageFor("district-events") }
// //   };

// //   const mockSlots = [
// //     { id: "SLOT1", label: "Today, 6:00 PM", venue: "Smash Arena, Sector 29" },
// //     { id: "SLOT2", label: "Today, 8:00 PM", venue: "CourtHouse, Sector 18" },
// //     { id: "SLOT3", label: "Tomorrow, 7:00 AM", venue: "Smash Arena, Sector 29" }
// //   ];

// //   const mockBuddies = [
// //     { name: "Rahul", skill: "Intermediate", rating: "4.6★" },
// //     { name: "Priya", skill: "Beginner",      rating: "4.8★" }
// //   ];

// //   async function districtHome(to) {
// //     const session = getSession(to);
// //     session.app = "DISTRICT";

// //     await sendImage(to, imageFor("district-banner"), "🎟 District — Dine, Play, Book");

// //     const rows = Object.keys(districtCategories).map(key => ({
// //       id: `DISTRICTCAT_${key}`,
// //       title: districtCategories[key].label,
// //       description: ""
// //     }));
// //     rows.push({ id: "APP_SWITCH", title: "🔄 Switch App", description: "Blinkit" });

// //     return sendList(to, "🎟 What are you up for?", "Explore", [{ title: "Categories", rows }]);
// //   }

// //   async function districtCategoryPicked(to, catKey) {
// //     const session = getSession(to);
// //     session.districtCategory = catKey;
// //     const cat = districtCategories[catKey];

// //     await sendImage(to, cat.img, cat.label);

// //     // Sport categories get the solo-vs-group choice; others go straight to slot picking.
// //     const isSport = ["PICKLEBALL", "PADDLE", "ADVENTURE"].includes(catKey);

// //     if (isSport) {
// //       return sendButtons(
// //         to,
// //         `${cat.label}\n\nPlaying solo or looking for people?`,
// //         [
// //           { id: "DISTRICT_SOLO",  title: "🎯 Book Solo" },
// //           { id: "DISTRICT_GROUP", title: "🤝 Find People" }
// //         ]
// //       );
// //     }

// //     return districtShowSlots(to);
// //   }

// //   async function districtShowSlots(to) {
// //     const rows = mockSlots.map(s => ({ id: `DISTRICTSLOT_${s.id}`, title: s.label, description: s.venue }));
// //     return sendList(to, "📍 Available Slots", "Select", [{ title: "Slots", rows }]);
// //   }

// //   async function districtGroupMatch(to) {
// //     const lines = mockBuddies.map(b => `👤 ${b.name} — ${b.skill} — ${b.rating}`).join("\n");
// //     return sendButtons(
// //       to,
// //       `🤝 Found 2 people for your slot!\n\n${lines}`,
// //       [
// //         { id: "DISTRICT_JOIN_GROUP", title: "✅ Join Group" },
// //         { id: "DISTRICT_SOLO",       title: "🎯 Book Solo Instead" }
// //       ]
// //     );
// //   }

// //   async function districtSlotConfirmed(to, slotId) {
// //     const session = getSession(to);
// //     const slot = mockSlots.find(s => s.id === slotId);
// //     session.districtSlot = slot;

// //     return sendButtons(
// //       to,
// //       `Confirm Booking\n\n${districtCategories[session.districtCategory]?.label || "Activity"}\n📍 ${slot.venue}\n🕐 ${slot.label}`,
// //       [
// //         { id: "DISTRICT_PAY", title: "💳 Pay & Confirm" },
// //         { id: "DISTRICT_HOME", title: "❌ Cancel" }
// //       ]
// //     );
// //   }

// //   async function districtBookingDone(to, split) {
// //     const orderId = randomOrderId();
// //     const session = getSession(to);

// //     const splitNote = split ? "\n\n💸 Split payment link sent to your group." : "";

// //     await sendImage(
// //       to,
// //       imageFor("district-ticket-" + orderId),
// //       `🎟 Booking Confirmed! #${orderId}${splitNote}\n\nShow this at the venue.`
// //     );
// //   }

// //   return {
// //     blinkitHome, blinkitReorder, blinkitAddFromHistory, blinkitCategories, blinkitCategoryItems,
// //     blinkitCart, blinkitCartCarousel, blinkitCheckoutStart, blinkitCheckout, toggleWeeklyRepeat, groceryCatalog,
// //     districtHome, districtCategoryPicked, districtShowSlots, districtGroupMatch, districtSlotConfirmed, districtBookingDone, districtCategories, mockSlots
// //   };
// // };
// // appFlows.js
// // Blinkit, District, Bistro flows. Zomato stays in index.js as the reference flow.
// // Wire in: const appFlows = require("./appFlows")({ send, sendText, sendButtons, sendList, extras, getSession, cartTotal, addToCart, randomOrderId });

// const comparifyBridge = require("./comparifyBridge");

// // Default location for demo — swap for user's shared WhatsApp location once captured.
// const DEFAULT_LAT = 28.5;
// const DEFAULT_LNG = 77.4;

// module.exports = function (ctx) {

//   const { sendText, sendButtons, sendList, extras, getSession, cartTotal, addToCart, randomOrderId, reorderEngine } = ctx;

//   /* ============================================================
//      BLINKIT — Grocery / Daily Essentials (proactive, reorder-first)
//   ============================================================ */

//   const groceryCatalog = {
//     DAIRY: {
//       label: "🥛 Dairy & Bread",
//       items: {
//         MILK:   { name: "Amul Milk 1L",     price: 66 },
//         BREAD:  { name: "Brown Bread",      price: 45 },
//         EGGS:   { name: "Eggs (12 pc)",     price: 84 },
//         PANEER: { name: "Paneer 200g",      price: 89 },
//         CURD:   { name: "Amul Curd 400g",   price: 45 },
//         BUTTER: { name: "Amul Butter 100g", price: 56 },
//         CHEESE: { name: "Cheese Slices",    price: 99 }
//       }
//     },
//     SNACKS: {
//       label: "🍪 Snacks & Munchies",
//       items: {
//         CHIPS:   { name: "Lays Chips",       price: 20 },
//         BISCUIT: { name: "Parle-G",          price: 10 },
//         MAGGI:   { name: "Maggi 4-pack",     price: 56 },
//         KURKURE: { name: "Kurkure",          price: 20 },
//         OREO:    { name: "Oreo Biscuits",    price: 30 },
//         BOURBON: { name: "Bourbon Biscuits", price: 35 },
//         NAMKEEN: { name: "Haldiram Namkeen", price: 65 }
//       }
//     },
//     FRESH: {
//       label: "🥦 Fruits & Veggies",
//       items: {
//         ONION:    { name: "Onion 1kg",    price: 38 },
//         TOMATO:   { name: "Tomato 1kg",   price: 42 },
//         BANANA:   { name: "Banana Dozen", price: 55 },
//         POTATO:   { name: "Potato 1kg",   price: 30 },
//         APPLE:    { name: "Apple 1kg",    price: 120 },
//         CAPSICUM: { name: "Capsicum 500g",price: 35 }
//       }
//     }
//   };

//   // recentGroceryOrder mock removed — Reorder Usual now pulls from reorderEngine's real order log.

//   async function blinkitHome(to) {
//     const session = getSession(to);
//     session.app = "BLINKIT";

//     if (!session.location) {
//       return ctx.sendLocationRequest(to, "📍 Where am I delivering to?");
//     }

//     return sendList(
//       to,
//       "What do you need today?",
//       "Menu",
//       [{
//         title: "Quick Actions",
//         rows: [
//           { id: "BLINKIT_REORDER", title: "🔁 Reorder Usual",   description: "See your last 5 orders" },
//           { id: "BLINKIT_BROWSE",  title: "🧺 Browse",           description: "Dairy, Snacks, Fresh & more" },
//           { id: "BLINKIT_SUB",     title: "📅 Weekly Repeat",    description: "Auto-reorder essentials" },
//           { id: "APP_SWITCH",      title: "🔄 Switch App",       description: "District" }
//         ]
//       }],
//       "Blinkit"
//     );
//   }

//   async function blinkitReorder(to) {
//     const session = getSession(to);
//     const history = (reorderEngine._orderLog[to] || [])
//       .filter(o => o.app === "Blinkit")
//       .sort((a, b) => b.timestamp - a.timestamp);

//     // Dedupe to most recent 5 distinct items.
//     const seen = new Set();
//     const lastFive = [];
//     for (const o of history) {
//       if (!seen.has(o.item)) {
//         seen.add(o.item);
//         lastFive.push(o);
//       }
//       if (lastFive.length >= 5) break;
//     }

//     if (lastFive.length === 0) {
//       return sendText(to, "Nothing on record yet — browse around a bit and I'll remember what you like.");
//     }

//     session.blinkitHistoryCache = lastFive;

//     const rows = lastFive.map((o, idx) => ({
//       id: `BLINKITHISTADD_${idx}`,
//       title: o.item,
//       description: `₹${o.price} — last time ${new Date(o.timestamp).toLocaleDateString()}`
//     }));

//     return sendList(to, "What you usually get", "Add to Cart", [{ title: "Order History", rows }]);
//   }

//   async function blinkitAddFromHistory(to, idx) {
//     const session = getSession(to);
//     const item = session.blinkitHistoryCache?.[Number(idx)];
//     if (!item) return sendText(to, "That one's expired — hit Reorder Usual again.");

//     addToCart(session, item.item, item.price);
//     reorderEngine.logOrder(to, item.item, item.price, "Blinkit");

//     await sendText(to, `Added ${item.item} — ₹${item.price}`);
//     return blinkitCartCarousel(to);
//   }

//   async function blinkitCategories(to) {
//     const rows = Object.keys(groceryCatalog).map(key => ({
//       id: `BLINKITCAT_${key}`,
//       title: groceryCatalog[key].label,
//       description: ""
//     }));
//     rows.push({ id: "BLINKIT_HOME", title: "⬅️ Back", description: "" });

//     return sendList(to, "Categories", "Select", [{ title: "Categories", rows }]);
//   }

//   async function blinkitCategoryItems(to, catKey) {
//     const cat = groceryCatalog[catKey];
//     const session = getSession(to);
//     const lat = session.location?.latitude || DEFAULT_LAT;
//     const lng = session.location?.longitude || DEFAULT_LNG;

//     const itemNames = Object.values(cat.items).map(i => i.name);

//     let realPrices = {};
//     try {
//       realPrices = await comparifyBridge.getRealPricesForCatalog(itemNames, lat, lng);
//     } catch (e) {
//       console.log("Comparify fetch failed:", e.message);
//     }

//     session.blinkitRealPrices = { ...(session.blinkitRealPrices || {}), ...realPrices };

//     // Only items Comparify actually found in stock get shown — no mock fallback.
//     const availableCodes = Object.keys(cat.items).filter(code => {
//       const real = realPrices[cat.items[code].name];
//       return real?.inStock;
//     });

//     if (availableCodes.length === 0) {
//       return sendButtons(
//         to,
//         `Nothing live in stock for ${cat.label} right now — try another category?`,
//         [{ id: "BLINKIT_BROWSE", title: "⬅️ Back" }]
//       );
//     }

//     const rows = availableCodes.map(code => {
//       const item = cat.items[code];
//       const real = realPrices[item.name];
//       return { id: `BLINKITADD_${catKey}_${code}`, title: item.name, description: `₹${real.price}` };
//     });
//     rows.push({ id: "BLINKIT_BROWSE", title: "⬅️ Back to Categories", description: "" });

//     return sendList(to, cat.label, "Add Items", [{ title: cat.label, rows }]);
//   }

//   async function blinkitCart(to) {
//     const session = getSession(to);
//     if (session.cart.length === 0) return sendText(to, "Cart's empty — say Hi to start browsing.");

//     const lines = session.cart
//       .map(i => `${i.name}  x${i.qty}  —  ₹${i.price * i.qty}`)
//       .join("\n");

//     const subtotal = cartTotal(session.cart);
//     const deliveryFee = subtotal >= 199 ? 0 : 25;
//     const total = subtotal + deliveryFee;
//     const itemCount = session.cart.reduce((s, i) => s + i.qty, 0);

//     return sendButtons(
//       to,
//       `Your basket (${itemCount} item${itemCount > 1 ? "s" : ""})\n\n${lines}\n\nDelivery: ${deliveryFee === 0 ? "free" : "₹" + deliveryFee}\nTotal: ₹${total}\n\n~10 min delivery`,
//       [
//         { id: "BLINKIT_VIEW_CART",  title: "🎠 View Cart" },
//         { id: "BLINKIT_SUB_TOGGLE", title: "📅 Repeat Weekly" },
//         { id: "BLINKIT_CHECKOUT",   title: "✅ Checkout" }
//       ]
//     );
//   }

//   // Cart walkthrough: one card per item with +/- and remove, sent as a
//   // sequence (WhatsApp media-carousel templates need pre-approval and
//   // static content, so this achieves the same scroll-through feel dynamically).
//   async function blinkitCartCarousel(to) {
//     const session = getSession(to);
//     if (session.cart.length === 0) return sendText(to, "Cart's empty.");

//     for (let i = 0; i < session.cart.length; i++) {
//       const item = session.cart[i];

//       await sendButtons(
//         to,
//         `${item.name}\n${item.qty} × ₹${item.price} = ₹${item.qty * item.price}`,
//         [
//           { id: `BLINKITQTY_INC_${i}`, title: "➕" },
//           { id: `BLINKITQTY_DEC_${i}`, title: "➖" },
//           { id: `BLINKITQTY_DEL_${i}`, title: "🗑 Remove" }
//         ]
//       );
//     }

//     return sendButtons(
//       to,
//       "That's everything. Ready to checkout?",
//       [
//         { id: "BLINKIT_CHECKOUT", title: "✅ Checkout" },
//         { id: "BLINKIT_BROWSE",   title: "➕ Add More" }
//       ]
//     );
//   }

//   async function blinkitCheckoutStart(to) {
//     const session = getSession(to);
//     if (session.cart.length === 0) return sendText(to, "Cart's empty.");

//     const subtotal = cartTotal(session.cart);
//     const deliveryFee = subtotal >= 199 ? 0 : 25;
//     const total = subtotal + deliveryFee;

//     return sendButtons(
//       to,
//       `How do you want to pay?\n\nTotal: ₹${total}`,
//       [
//         { id: "BLINKIT_PAY_RAZORPAY", title: "💳 Razorpay" },
//         { id: "BLINKIT_PAY_COD",      title: "💵 Cash on Delivery" }
//       ]
//     );
//   }

//   async function blinkitCheckout(to, method = "COD") {
//     const session = getSession(to);
//     const orderId = randomOrderId();
//     const subtotal = cartTotal(session.cart);
//     const deliveryFee = subtotal >= 199 ? 0 : 25;
//     const total = subtotal + deliveryFee;

//     session.lastOrder = { id: orderId, cart: session.cart, total, status: "placed", app: "BLINKIT", paymentMethod: method };
//     session.cart = [];

//     const payLine = method === "RAZORPAY" ? "Payment received via Razorpay ✅" : `Pay ₹${total} on delivery`;

//     await sendText(to, `Order #${orderId} confirmed — ₹${total}\n${payLine}\n\n🛵 ~10 min out`);

//     setTimeout(() => sendText(to, "Out for delivery, 3 min away!"), 4000);
//     setTimeout(() => sendText(to, "Delivered! Enjoy 🎉"), 8000);
//   }

//   function toggleWeeklyRepeat(to) {
//     const session = getSession(to);
//     session.blinkitWeeklyRepeat = !session.blinkitWeeklyRepeat;
//     return session.blinkitWeeklyRepeat;
//   }

//   /* ============================================================
//      DISTRICT — Flow A (book activity) + Flow B (solo-to-group)
//   ============================================================ */

//   const districtCategories = {
//     DINING:     { label: "🍽 Dining Out" },
//     MOVIES:     { label: "🎬 Movies" },
//     PICKLEBALL: { label: "🏓 Pickleball" },
//     PADDLE:     { label: "🏸 Paddle" },
//     ADVENTURE:  { label: "🧗 Adventure" },
//     EVENTS:     { label: "🎟 Events / IPL" }
//   };

//   const mockSlots = [
//     { id: "SLOT1", label: "Today, 6:00 PM", venue: "Smash Arena, Sector 29" },
//     { id: "SLOT2", label: "Today, 8:00 PM", venue: "CourtHouse, Sector 18" },
//     { id: "SLOT3", label: "Tomorrow, 7:00 AM", venue: "Smash Arena, Sector 29" }
//   ];

//   const mockBuddies = [
//     { name: "Rahul", skill: "Intermediate", rating: "4.6★" },
//     { name: "Priya", skill: "Beginner",      rating: "4.8★" }
//   ];

//   async function districtHome(to) {
//     const session = getSession(to);
//     session.app = "DISTRICT";

//     const rows = Object.keys(districtCategories).map(key => ({
//       id: `DISTRICTCAT_${key}`,
//       title: districtCategories[key].label,
//       description: ""
//     }));
//     rows.push({ id: "APP_SWITCH", title: "🔄 Switch App", description: "Blinkit" });

//     return sendList(to, "What are you up for?", "Explore", [{ title: "Categories", rows }]);
//   }

//   async function districtCategoryPicked(to, catKey) {
//     const session = getSession(to);
//     session.districtCategory = catKey;
//     const cat = districtCategories[catKey];

//     // Sport categories get the solo-vs-group choice; others go straight to slot picking.
//     const isSport = ["PICKLEBALL", "PADDLE", "ADVENTURE"].includes(catKey);

//     if (isSport) {
//       return sendButtons(
//         to,
//         `${cat.label} — solo, or looking for people?`,
//         [
//           { id: "DISTRICT_SOLO",  title: "🎯 Solo" },
//           { id: "DISTRICT_GROUP", title: "🤝 Find People" }
//         ]
//       );
//     }

//     return districtShowSlots(to);
//   }

//   async function districtShowSlots(to) {
//     const rows = mockSlots.map(s => ({ id: `DISTRICTSLOT_${s.id}`, title: s.label, description: s.venue }));
//     return sendList(to, "Available Slots", "Select", [{ title: "Slots", rows }]);
//   }

//   async function districtGroupMatch(to) {
//     const lines = mockBuddies.map(b => `${b.name} — ${b.skill} — ${b.rating}`).join("\n");
//     return sendButtons(
//       to,
//       `Found 2 people for your slot!\n\n${lines}`,
//       [
//         { id: "DISTRICT_JOIN_GROUP", title: "✅ Join Group" },
//         { id: "DISTRICT_SOLO",       title: "Book Solo Instead" }
//       ]
//     );
//   }

//   async function districtSlotConfirmed(to, slotId) {
//     const session = getSession(to);
//     const slot = mockSlots.find(s => s.id === slotId);
//     session.districtSlot = slot;

//     return sendButtons(
//       to,
//       `Confirm?\n\n${districtCategories[session.districtCategory]?.label || "Activity"}\n📍 ${slot.venue}\n🕐 ${slot.label}`,
//       [
//         { id: "DISTRICT_PAY", title: "💳 Pay & Confirm" },
//         { id: "DISTRICT_HOME", title: "❌ Cancel" }
//       ]
//     );
//   }

//   async function districtBookingDone(to, split) {
//     const orderId = randomOrderId();

//     const splitNote = split ? "\n\nSplit link sent to your group." : "";

//     await sendText(to, `Booked! #${orderId}${splitNote}\n\nShow this at the venue.`);
//   }

//   return {
//     blinkitHome, blinkitReorder, blinkitAddFromHistory, blinkitCategories, blinkitCategoryItems,
//     blinkitCart, blinkitCartCarousel, blinkitCheckoutStart, blinkitCheckout, toggleWeeklyRepeat, groceryCatalog,
//     districtHome, districtCategoryPicked, districtShowSlots, districtGroupMatch, districtSlotConfirmed, districtBookingDone, districtCategories, mockSlots
//   };
// };
// appFlows.js
// Blinkit, District, Bistro flows. Zomato stays in index.js as the reference flow.
// Wire in: const appFlows = require("./appFlows")({ send, sendText, sendButtons, sendList, extras, getSession, cartTotal, addToCart, randomOrderId });

const comparifyBridge = require("./comparifyBridge");

// Default location for demo — swap for user's shared WhatsApp location once captured.
const DEFAULT_LAT = 28.5;
const DEFAULT_LNG = 77.4;

module.exports = function (ctx) {

  const { sendText, sendImage, sendButtons, sendList, extras, getSession, cartTotal, addToCart, randomOrderId, reorderEngine } = ctx;

  /* ============================================================
     BLINKIT — Grocery / Daily Essentials (proactive, reorder-first)
  ============================================================ */

  const groceryCatalog = {
    DAIRY: {
      label: "🥛 Dairy & Bread",
      items: {
        MILK:   { name: "Amul Milk 1L",     price: 66 },
        BREAD:  { name: "Brown Bread",      price: 45 },
        EGGS:   { name: "Eggs (12 pc)",     price: 84 },
        PANEER: { name: "Paneer 200g",      price: 89 },
        CURD:   { name: "Amul Curd 400g",   price: 45 },
        BUTTER: { name: "Amul Butter 100g", price: 56 },
        CHEESE: { name: "Cheese Slices",    price: 99 }
      }
    },
    SNACKS: {
      label: "🍪 Snacks & Munchies",
      items: {
        CHIPS:   { name: "Lays Chips",       price: 20 },
        BISCUIT: { name: "Parle-G",          price: 10 },
        MAGGI:   { name: "Maggi 4-pack",     price: 56 },
        KURKURE: { name: "Kurkure",          price: 20 },
        OREO:    { name: "Oreo Biscuits",    price: 30 },
        BOURBON: { name: "Bourbon Biscuits", price: 35 },
        NAMKEEN: { name: "Haldiram Namkeen", price: 65 }
      }
    },
    FRESH: {
      label: "🥦 Fruits & Veggies",
      items: {
        ONION:    { name: "Onion 1kg",    price: 38 },
        TOMATO:   { name: "Tomato 1kg",   price: 42 },
        BANANA:   { name: "Banana Dozen", price: 55 },
        POTATO:   { name: "Potato 1kg",   price: 30 },
        APPLE:    { name: "Apple 1kg",    price: 120 },
        CAPSICUM: { name: "Capsicum 500g",price: 35 }
      }
    }
  };

  // recentGroceryOrder mock removed — Reorder Usual now pulls from reorderEngine's real order log.

  async function blinkitHome(to) {
    const session = getSession(to);
    session.app = "BLINKIT";

    if (!session.location) {
      return ctx.sendLocationRequest(to, "📍 Where am I delivering to?");
    }

    return sendList(
      to,
      "What do you need today?",
      "Menu",
      [{
        title: "Quick Actions",
        rows: [
          { id: "BLINKIT_REORDER", title: "🔁 Reorder Usual",   description: "See your last 5 orders" },
          { id: "BLINKIT_BROWSE",  title: "🧺 Browse",           description: "Dairy, Snacks, Fresh & more" },
          { id: "BLINKIT_SUB",     title: "📅 Weekly Repeat",    description: "Auto-reorder essentials" },
          { id: "APP_SWITCH",      title: "🔄 Switch App",       description: "District" }
        ]
      }],
      "Blinkit"
    );
  }

  async function blinkitReorder(to) {
    const session = getSession(to);
    const history = (reorderEngine._orderLog[to] || [])
      .filter(o => o.app === "Blinkit")
      .sort((a, b) => b.timestamp - a.timestamp);

    // Dedupe to most recent 5 distinct items.
    const seen = new Set();
    const lastFive = [];
    for (const o of history) {
      if (!seen.has(o.item)) {
        seen.add(o.item);
        lastFive.push(o);
      }
      if (lastFive.length >= 5) break;
    }

    if (lastFive.length === 0) {
      return sendText(to, "Nothing on record yet — browse around a bit and I'll remember what you like.");
    }

    session.blinkitHistoryCache = lastFive;

    const rows = lastFive.map((o, idx) => ({
      id: `BLINKITHISTADD_${idx}`,
      title: o.item,
      description: `₹${o.price} — last time ${new Date(o.timestamp).toLocaleDateString()}`
    }));

    return sendList(to, "What you usually get", "Add to Cart", [{ title: "Order History", rows }]);
  }

  async function blinkitAddFromHistory(to, idx) {
    const session = getSession(to);
    const item = session.blinkitHistoryCache?.[Number(idx)];
    if (!item) return sendText(to, "That one's expired — hit Reorder Usual again.");

    addToCart(session, item.item, item.price);
    reorderEngine.logOrder(to, item.item, item.price, "Blinkit");

    await sendText(to, `Added ${item.item} — ₹${item.price}`);
    return blinkitCartCarousel(to);
  }

  async function blinkitCategories(to) {
    const rows = Object.keys(groceryCatalog).map(key => ({
      id: `BLINKITCAT_${key}`,
      title: groceryCatalog[key].label,
      description: ""
    }));
    rows.push({ id: "BLINKIT_HOME", title: "⬅️ Back", description: "" });

    return sendList(to, "Categories", "Select", [{ title: "Categories", rows }]);
  }

  async function blinkitCategoryItems(to, catKey) {
    const cat = groceryCatalog[catKey];
    const session = getSession(to);
    const lat = session.location?.latitude || DEFAULT_LAT;
    const lng = session.location?.longitude || DEFAULT_LNG;

    const itemNames = Object.values(cat.items).map(i => i.name);

    let realPrices = {};
    try {
      realPrices = await comparifyBridge.getRealPricesForCatalog(itemNames, lat, lng);
    } catch (e) {
      console.log("Comparify fetch failed:", e.message);
    }

    session.blinkitRealPrices = { ...(session.blinkitRealPrices || {}), ...realPrices };

    // Only items Comparify actually found in stock get shown — no mock fallback.
    const availableCodes = Object.keys(cat.items).filter(code => {
      const real = realPrices[cat.items[code].name];
      return real?.inStock;
    });

    if (availableCodes.length === 0) {
      return sendButtons(
        to,
        `Nothing live in stock for ${cat.label} right now — try another category?`,
        [{ id: "BLINKIT_BROWSE", title: "⬅️ Back" }]
      );
    }

    for (const code of availableCodes) {
      const item = cat.items[code];
      const real = realPrices[item.name];
      if (real.imageUrl) {
        await sendImage(to, real.imageUrl, `${item.name} — ₹${real.price}`);
      }
    }

    const rows = availableCodes.map(code => {
      const item = cat.items[code];
      const real = realPrices[item.name];
      return { id: `BLINKITADD_${catKey}_${code}`, title: item.name, description: `₹${real.price}` };
    });
    rows.push({ id: "BLINKIT_BROWSE", title: "⬅️ Back to Categories", description: "" });

    return sendList(to, cat.label, "Add Items", [{ title: cat.label, rows }]);
  }

  async function blinkitCart(to) {
    const session = getSession(to);
    if (session.cart.length === 0) return sendText(to, "Cart's empty — say Hi to start browsing.");

    const lines = session.cart
      .map(i => `${i.name}  x${i.qty}  —  ₹${i.price * i.qty}`)
      .join("\n");

    const subtotal = cartTotal(session.cart);
    const deliveryFee = subtotal >= 199 ? 0 : 25;
    const total = subtotal + deliveryFee;
    const itemCount = session.cart.reduce((s, i) => s + i.qty, 0);

    return sendButtons(
      to,
      `Your basket (${itemCount} item${itemCount > 1 ? "s" : ""})\n\n${lines}\n\nDelivery: ${deliveryFee === 0 ? "free" : "₹" + deliveryFee}\nTotal: ₹${total}\n\n~10 min delivery`,
      [
        { id: "BLINKIT_VIEW_CART",  title: "🎠 View Cart" },
        { id: "BLINKIT_SUB_TOGGLE", title: "📅 Repeat Weekly" },
        { id: "BLINKIT_CHECKOUT",   title: "✅ Checkout" }
      ]
    );
  }

  // Cart walkthrough: one card per item with +/- and remove, sent as a
  // sequence (WhatsApp media-carousel templates need pre-approval and
  // static content, so this achieves the same scroll-through feel dynamically).
  async function blinkitCartCarousel(to) {
    const session = getSession(to);
    if (session.cart.length === 0) return sendText(to, "Cart's empty.");

    for (let i = 0; i < session.cart.length; i++) {
      const item = session.cart[i];

      await sendButtons(
        to,
        `${item.name}\n${item.qty} × ₹${item.price} = ₹${item.qty * item.price}`,
        [
          { id: `BLINKITQTY_INC_${i}`, title: "➕" },
          { id: `BLINKITQTY_DEC_${i}`, title: "➖" },
          { id: `BLINKITQTY_DEL_${i}`, title: "🗑 Remove" }
        ]
      );
    }

    return sendButtons(
      to,
      "That's everything. Ready to checkout?",
      [
        { id: "BLINKIT_CHECKOUT", title: "✅ Checkout" },
        { id: "BLINKIT_BROWSE",   title: "➕ Add More" }
      ]
    );
  }

  async function blinkitCheckoutStart(to) {
    const session = getSession(to);
    if (session.cart.length === 0) return sendText(to, "Cart's empty.");

    const subtotal = cartTotal(session.cart);
    const deliveryFee = subtotal >= 199 ? 0 : 25;
    const total = subtotal + deliveryFee;

    return sendButtons(
      to,
      `How do you want to pay?\n\nTotal: ₹${total}`,
      [
        { id: "BLINKIT_PAY_RAZORPAY", title: "💳 Razorpay" },
        { id: "BLINKIT_PAY_COD",      title: "💵 Cash on Delivery" }
      ]
    );
  }

  async function blinkitCheckout(to, method = "COD") {
    const session = getSession(to);
    const orderId = randomOrderId();
    const subtotal = cartTotal(session.cart);
    const deliveryFee = subtotal >= 199 ? 0 : 25;
    const total = subtotal + deliveryFee;

    session.lastOrder = { id: orderId, cart: session.cart, total, status: "placed", app: "BLINKIT", paymentMethod: method };
    session.cart = [];

    const payLine = method === "RAZORPAY" ? "Payment received via Razorpay ✅" : `Pay ₹${total} on delivery`;

    await sendText(to, `Order #${orderId} confirmed — ₹${total}\n${payLine}\n\n🛵 ~10 min out`);

    setTimeout(() => sendText(to, "Out for delivery, 3 min away!"), 4000);
    setTimeout(() => sendText(to, "Delivered! Enjoy 🎉"), 8000);
  }

  function toggleWeeklyRepeat(to) {
    const session = getSession(to);
    session.blinkitWeeklyRepeat = !session.blinkitWeeklyRepeat;
    return session.blinkitWeeklyRepeat;
  }

  /* ============================================================
     DISTRICT — Flow A (book activity) + Flow B (solo-to-group)
  ============================================================ */

  const districtCategories = {
    DINING:     { label: "🍽 Dining Out" },
    MOVIES:     { label: "🎬 Movies" },
    PICKLEBALL: { label: "🏓 Pickleball" },
    PADDLE:     { label: "🏸 Paddle" },
    ADVENTURE:  { label: "🧗 Adventure" },
    EVENTS:     { label: "🎟 Events / IPL" }
  };

  const mockSlots = [
    { id: "SLOT1", label: "Today, 6:00 PM", venue: "Smash Arena, Sector 29" },
    { id: "SLOT2", label: "Today, 8:00 PM", venue: "CourtHouse, Sector 18" },
    { id: "SLOT3", label: "Tomorrow, 7:00 AM", venue: "Smash Arena, Sector 29" }
  ];

  const mockBuddies = [
    { name: "Rahul", skill: "Intermediate", rating: "4.6★" },
    { name: "Priya", skill: "Beginner",      rating: "4.8★" }
  ];

  async function districtHome(to) {
    const session = getSession(to);
    session.app = "DISTRICT";

    const rows = Object.keys(districtCategories).map(key => ({
      id: `DISTRICTCAT_${key}`,
      title: districtCategories[key].label,
      description: ""
    }));
    rows.push({ id: "APP_SWITCH", title: "🔄 Switch App", description: "Blinkit" });

    return sendList(to, "What are you up for?", "Explore", [{ title: "Categories", rows }]);
  }

  async function districtCategoryPicked(to, catKey) {
    const session = getSession(to);
    session.districtCategory = catKey;
    const cat = districtCategories[catKey];

    // Sport categories get the solo-vs-group choice; others go straight to slot picking.
    const isSport = ["PICKLEBALL", "PADDLE", "ADVENTURE"].includes(catKey);

    if (isSport) {
      return sendButtons(
        to,
        `${cat.label} — solo, or looking for people?`,
        [
          { id: "DISTRICT_SOLO",  title: "🎯 Solo" },
          { id: "DISTRICT_GROUP", title: "🤝 Find People" }
        ]
      );
    }

    return districtShowSlots(to);
  }

  async function districtShowSlots(to) {
    const rows = mockSlots.map(s => ({ id: `DISTRICTSLOT_${s.id}`, title: s.label, description: s.venue }));
    return sendList(to, "Available Slots", "Select", [{ title: "Slots", rows }]);
  }

  async function districtGroupMatch(to) {
    const lines = mockBuddies.map(b => `${b.name} — ${b.skill} — ${b.rating}`).join("\n");
    return sendButtons(
      to,
      `Found 2 people for your slot!\n\n${lines}`,
      [
        { id: "DISTRICT_JOIN_GROUP", title: "✅ Join Group" },
        { id: "DISTRICT_SOLO",       title: "Book Solo Instead" }
      ]
    );
  }

  async function districtSlotConfirmed(to, slotId) {
    const session = getSession(to);
    const slot = mockSlots.find(s => s.id === slotId);
    session.districtSlot = slot;

    return sendButtons(
      to,
      `Confirm?\n\n${districtCategories[session.districtCategory]?.label || "Activity"}\n📍 ${slot.venue}\n🕐 ${slot.label}`,
      [
        { id: "DISTRICT_PAY", title: "💳 Pay & Confirm" },
        { id: "DISTRICT_HOME", title: "❌ Cancel" }
      ]
    );
  }

  async function districtBookingDone(to, split) {
    const orderId = randomOrderId();

    const splitNote = split ? "\n\nSplit link sent to your group." : "";

    await sendText(to, `Booked! #${orderId}${splitNote}\n\nShow this at the venue.`);
  }

  return {
    blinkitHome, blinkitReorder, blinkitAddFromHistory, blinkitCategories, blinkitCategoryItems,
    blinkitCart, blinkitCartCarousel, blinkitCheckoutStart, blinkitCheckout, toggleWeeklyRepeat, groceryCatalog,
    districtHome, districtCategoryPicked, districtShowSlots, districtGroupMatch, districtSlotConfirmed, districtBookingDone, districtCategories, mockSlots
  };
};