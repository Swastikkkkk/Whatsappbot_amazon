// // reorderEngine.js
// // Predicts when a user is "due" to reorder an item, based on their own order history.
// // Real model: per-item average interval between orders + last-ordered timestamp.
// // Works across apps. Persists to localDb.js (JSON file) so history survives restarts --
// // swap localDb.js internals for Firebase later without touching this file.

// const localDb = require("./localDb");

// module.exports = function (ctx) {

//   const { sendButtons, sendText, imageFor } = ctx;

//   // orderLog[phone] = [{ item, price, app, image, timestamp }] -- backed by localDb
//   const orderLog = localDb.getCollection("orderLog");

//   const nudgedAt = {};

//   /** Call this every time an order is placed, for any item, any app. Persists immediately. */
//   function logOrder(phone, item, price, app, image, timestamp) {
//     if (!app) app = "Blinkit";
//     if (!timestamp) timestamp = Date.now();
//     if (!orderLog[phone]) orderLog[phone] = [];
//     orderLog[phone].push({ item, price, app, image: image || imageFor(item), timestamp });
//     localDb.persist();
//   }

//   /** Computes { avgIntervalMs, lastOrderedAt, dueAt } for one item, or null if <2 data points. */
//   function predictItem(phone, item) {
//     const history = (orderLog[phone] || []).filter(o => o.item === item).sort((a, b) => a.timestamp - b.timestamp);
//     if (history.length < 2) return null;

//     const gaps = [];
//     for (let i = 1; i < history.length; i++) gaps.push(history[i].timestamp - history[i - 1].timestamp);

//     const avgIntervalMs = gaps.reduce((a, b) => a + b, 0) / gaps.length;
//     const last = history[history.length - 1];
//     const dueAt = last.timestamp + avgIntervalMs;

//     return { avgIntervalMs, lastOrderedAt: last.timestamp, dueAt, price: last.price, app: last.app, image: last.image, orderCount: history.length };
//   }

//   /** Returns all items currently "due" for a user, across their whole history. */
//   function getDueItems(phone, now) {
//     if (!now) now = Date.now();
//     const items = [...new Set((orderLog[phone] || []).map(o => o.item))];
//     const due = [];
//     for (const item of items) {
//       const pred = predictItem(phone, item);
//       if (pred && now >= pred.dueAt) due.push({ item, ...pred });
//     }
//     return due;
//   }

//   async function checkAndNudge(phone, now) {
//     if (!now) now = Date.now();
//     const due = getDueItems(phone, now);
//     const toNudge = due.filter(d => {
//       const key = phone + "|" + d.item;
//       const lastNudge = nudgedAt[key] || 0;
//       return now - lastNudge > 6 * 60 * 60 * 1000;
//     });

//     for (const d of toNudge) {
//       nudgedAt[phone + "|" + d.item] = now;
//       const daysAgo = Math.round((now - d.lastOrderedAt) / (1000 * 60 * 60 * 24));
//       const timePhrase = daysAgo >= 7 ? `${Math.round(daysAgo / 7)} week(s)` : `${daysAgo} day(s)`;

//       await sendButtons(
//         phone,
//         `It's been ${timePhrase} since you had ${d.item} from ${d.app}.\n\nMissing it?`,
//         [
//           { id: `REORDER_ITEM_${encodeURIComponent(d.item)}`, title: "Order Again" },
//           { id: "HOME", title: "Not now" }
//         ],
//         { image: d.image }
//       );
//     }

//     return toNudge;
//   }

//   async function escalate(phone, item, price) {
//     return sendButtons(
//       phone,
//       `Still need ${item}? Add it to your cart now and pay on delivery.`,
//       [
//         { id: `REORDER_COD_${encodeURIComponent(item)}_${price}`, title: "Add + COD" },
//         { id: "HOME", title: "Skip" }
//       ]
//     );
//   }

//   return { logOrder, predictItem, getDueItems, checkAndNudge, escalate, _orderLog: orderLog };
// };
// reorderEngine.js
// Predicts when a user is "due" to reorder an item, based on their own order history.
// Real model: per-item average interval between orders + last-ordered timestamp.
// Works across apps. Persists to localDb.js (JSON file) so history survives restarts --
// swap localDb.js internals for Firebase later without touching this file.

const localDb = require("./localDb");

module.exports = function (ctx) {

  const { sendButtons, sendText } = ctx;

  // orderLog[phone] = [{ item, price, app, timestamp }] -- backed by localDb
  const orderLog = localDb.getCollection("orderLog");

  const nudgedAt = {};

  /** Call this every time an order is placed, for any item, any app. Persists immediately. */
  function logOrder(phone, item, price, app, timestamp) {
    if (!app) app = "Blinkit";
    if (!timestamp) timestamp = Date.now();
    if (!orderLog[phone]) orderLog[phone] = [];
    orderLog[phone].push({ item, price, app, timestamp });
    localDb.persist();
  }

  /** Computes { avgIntervalMs, lastOrderedAt, dueAt } for one item, or null if <2 data points. */
  function predictItem(phone, item) {
    const history = (orderLog[phone] || []).filter(o => o.item === item).sort((a, b) => a.timestamp - b.timestamp);
    if (history.length < 2) return null;

    const gaps = [];
    for (let i = 1; i < history.length; i++) gaps.push(history[i].timestamp - history[i - 1].timestamp);

    const avgIntervalMs = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    const last = history[history.length - 1];
    const dueAt = last.timestamp + avgIntervalMs;

    return { avgIntervalMs, lastOrderedAt: last.timestamp, dueAt, price: last.price, app: last.app, orderCount: history.length };
  }

  /** Returns all items currently "due" for a user, across their whole history. */
  function getDueItems(phone, now) {
    if (!now) now = Date.now();
    const items = [...new Set((orderLog[phone] || []).map(o => o.item))];
    const due = [];
    for (const item of items) {
      const pred = predictItem(phone, item);
      if (pred && now >= pred.dueAt) due.push({ item, ...pred });
    }
    return due;
  }

  async function checkAndNudge(phone, now) {
    if (!now) now = Date.now();
    const due = getDueItems(phone, now);
    const toNudge = due.filter(d => {
      const key = phone + "|" + d.item;
      const lastNudge = nudgedAt[key] || 0;
      return now - lastNudge > 6 * 60 * 60 * 1000;
    });

    for (const d of toNudge) {
      nudgedAt[phone + "|" + d.item] = now;
      const daysAgo = Math.round((now - d.lastOrderedAt) / (1000 * 60 * 60 * 24));
      const timePhrase = daysAgo >= 7 ? `${Math.round(daysAgo / 7)} week(s)` : `${daysAgo} day(s)`;

      await sendButtons(
        phone,
        `Been ${timePhrase} since you had ${d.item} from ${d.app}. Missing it?`,
        [
          { id: `REORDER_ITEM_${encodeURIComponent(d.item)}`, title: "Order Again" },
          { id: "HOME", title: "Not now" }
        ]
      );
    }

    return toNudge;
  }

  async function escalate(phone, item, price) {
    return sendButtons(
      phone,
      `Still need ${item}? Add it and pay on delivery.`,
      [
        { id: `REORDER_COD_${encodeURIComponent(item)}_${price}`, title: "Add + COD" },
        { id: "HOME", title: "Skip" }
      ]
    );
  }

  return { logOrder, predictItem, getDueItems, checkAndNudge, escalate, _orderLog: orderLog };
};