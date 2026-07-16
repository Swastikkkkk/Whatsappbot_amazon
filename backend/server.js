require('dotenv').config();
const express = require('express');
const axios   = require('axios');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  ScanCommand,
  GetCommand,
  UpdateCommand,
} = require('@aws-sdk/lib-dynamodb');
const cron = require('node-cron');

// ─── Config ───────────────────────────────────────────────────────────────────
const WA_TOKEN     = process.env.WA_TOKEN;
const WA_PHONE_ID  = process.env.WA_PHONE_ID;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const PORT         = process.env.PORT || 3000;
const WA_URL       = `https://graph.facebook.com/v19.0/${WA_PHONE_ID}/messages`;

// ─── DynamoDB ─────────────────────────────────────────────────────────────────
const db = DynamoDBDocumentClient.from(new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId:     process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
}));

// ─── In-memory sessions ───────────────────────────────────────────────────────
// { "919XXXXXXXX": { reorder_id, product_name, quantity, date, awaitingQty } }
const sessions = {};

// ─── DynamoDB helpers ─────────────────────────────────────────────────────────

async function getPendingReorders() {
  const today  = new Date().toISOString().split('T')[0];
  const cutoff = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]; // 7-day window
  const res = await db.send(new ScanCommand({
    TableName: 'PendingReorders',
    // Only filter on fields that actually exist in the table
    FilterExpression: '#s = :pending AND predicted_date BETWEEN :today AND :cutoff',
    ExpressionAttributeNames: { '#s': 'status' },
    ExpressionAttributeValues: { ':pending': 'pending', ':today': today, ':cutoff': cutoff },
  }));
  return res.Items || [];
}

async function getUserById(userId) {
  const res = await db.send(new GetCommand({
    TableName: process.env.DYNAMODB_USERS_TABLE || 'Users',
    // Try both common key names — DynamoDB is case-sensitive
    Key: { user_id: userId },
  }));
  return res.Item;
}

async function confirmReorder(reorderId) {
  await db.send(new UpdateCommand({
    TableName: 'PendingReorders',
    Key: { reorder_id: reorderId },
    UpdateExpression: 'SET #s = :v, updated_at = :now',
    ExpressionAttributeNames: { '#s': 'status' },
    ExpressionAttributeValues: { ':v': 'confirmed', ':now': new Date().toISOString() },
  }));
}

async function cancelReorder(reorderId) {
  await db.send(new UpdateCommand({
    TableName: 'PendingReorders',
    Key: { reorder_id: reorderId },
    UpdateExpression: 'SET #s = :v, updated_at = :now',
    ExpressionAttributeNames: { '#s': 'status' },
    ExpressionAttributeValues: { ':v': 'cancelled', ':now': new Date().toISOString() },
  }));
}

async function updateQuantity(reorderId, qty) {
  await db.send(new UpdateCommand({
    TableName: 'PendingReorders',
    Key: { reorder_id: reorderId },
    UpdateExpression: 'SET predicted_quantity = :q, #s = :v, updated_at = :now',
    ExpressionAttributeNames: { '#s': 'status' },
    ExpressionAttributeValues: { ':q': qty, ':v': 'confirmed', ':now': new Date().toISOString() },
  }));
}

async function markNotified(reorderId) {
  // DynamoDB will add wa_notified / wa_notified_at as new attributes automatically
  await db.send(new UpdateCommand({
    TableName: 'PendingReorders',
    Key: { reorder_id: reorderId },
    UpdateExpression: 'SET wa_notified = :yes, wa_notified_at = :now',
    ExpressionAttributeValues: { ':yes': true, ':now': new Date().toISOString() },
  }));
}

// ─── WhatsApp helpers ─────────────────────────────────────────────────────────

const waHeaders = () => ({
  Authorization: `Bearer ${WA_TOKEN}`,
  'Content-Type': 'application/json',
});

async function sendText(to, text) {
  try {
    const res = await axios.post(WA_URL, {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: text },
    }, { headers: waHeaders() });
    console.log('[WA] Text sent ✅');
    return res.data;
  } catch (err) {
    console.error('[WA] sendText failed:', JSON.stringify(err.response?.data || err.message));
    throw err;
  }
}

// Sent to any user who messages us without an active session (onboarding / opt-in)
async function sendOptIn(to) {
  const payload = {
    messaging_product: 'whatsapp',
    to,
    type: 'interactive',
    interactive: {
      type: 'button',
      body: {
        text:
          `👋 Hey! Welcome to *Amazon Now Smart Reorder*.\n\n` +
          `I keep an eye on what you buy regularly and ping you when you're running low — ` +
          `so you never run out of essentials like milk, soap, or snacks.\n\n` +
          `Want me to notify you when it's time to reorder something?`,
      },
      footer: { text: 'Amazon Now • Never run out again' },
      action: {
        buttons: [
          { type: 'reply', reply: { id: 'OPTIN_YES', title: '✅ Yes, sign me up!' } },
          { type: 'reply', reply: { id: 'OPTIN_NO',  title: '❌ Not right now'    } },
        ],
      },
    },
  };

  try {
    const res = await axios.post(WA_URL, payload, { headers: waHeaders() });
    console.log('[WA] Opt-in buttons sent ✅');
    return res.data;
  } catch (err) {
    console.error('[WA] sendOptIn failed:', JSON.stringify(err.response?.data || err.message));
    // Fallback to plain text
    await sendText(to,
      `👋 Hey! Welcome to *Amazon Now Smart Reorder*.\n\n` +
      `I notify you when you're running low on things you buy regularly.\n\n` +
      `Reply *JOIN* to opt in or *STOP* to skip.`
    );
  }
}

async function sendButtons(to, productName, quantity, date, reorderId) {
  // Save session BEFORE sending so button replies are handled immediately
  sessions[to] = { reorder_id: reorderId, product_name: productName, quantity, date };

  const payload = {
    messaging_product: 'whatsapp',
    to,
    type: 'interactive',
    interactive: {
      type: 'button',
      body: {
        text:
          `🛒 *Amazon Now*\n\n` +
          `Hey! Based on your order history, you usually reorder *${productName}* around this time.\n\n` +
          `📦 Quantity: ${quantity}\n` +
          `📅 Delivery by: ${date}\n\n` +
          `Want us to place this order?`,
      },
      footer: { text: 'Amazon Now • Smart Reorder' },
      action: {
        buttons: [
          { type: 'reply', reply: { id: `YES_${reorderId}`,  title: '✅ Yes, order it!'  } },
          { type: 'reply', reply: { id: `NO_${reorderId}`,   title: '❌ No thanks'        } },
          { type: 'reply', reply: { id: `EDIT_${reorderId}`, title: '✏️ Change quantity'  } },
        ],
      },
    },
  };

  try {
    const res = await axios.post(WA_URL, payload, { headers: waHeaders() });
    console.log('[WA] Buttons sent ✅', JSON.stringify(res.data));
    return res.data;
  } catch (err) {
    console.error('[WA] sendButtons failed:', JSON.stringify(err.response?.data || err.message));
    console.log('[WA] Falling back to plain text...');
    await sendText(to,
      `🛒 *Amazon Now*\n\n` +
      `Hey! You usually reorder *${productName}* around this time.\n\n` +
      `📦 Quantity: ${quantity}\n` +
      `📅 Delivery by: ${date}\n\n` +
      `Reply:\n*YES* — confirm order\n*NO* — skip\n*CHANGE 3* — different quantity`
    );
  }
}

// ─── Poller ───────────────────────────────────────────────────────────────────

async function pollAndNotify() {
  const today  = new Date().toISOString().split('T')[0];
  const cutoff = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
  console.log(`[Poller] Scanning DynamoDB at ${new Date().toISOString()} | date window: ${today} → ${cutoff}`);
  try {
    const reorders = await getPendingReorders();
    console.log(`[Poller] Scan returned ${reorders.length} item(s):`, reorders.map(r => ({
      id: r.reorder_id,
      status: r.status,
      predicted_date: r.predicted_date,
      wa_notified: r.wa_notified ?? false,
    })));
    if (!reorders.length) { console.log('[Poller] Nothing due — no pending items in date window.'); return; }

    for (const r of reorders) {
      // Skip items already notified (wa_notified may not exist yet — treat missing as false)
      if (r.wa_notified === true) {
        console.log(`[Poller] ${r.reorder_id} already notified, skipping`);
        continue;
      }

      // Resolve user phone — fallback to demo number if Users table not set up
      let phone = '919582626655'; // demo fallback
      try {
        const user = await getUserById(r.user_id);
        if (user?.phone_number) phone = user.phone_number;
      } catch (e) {
        console.warn(`[Poller] Could not fetch user ${r.user_id}, using fallback phone`);
      }

      // Hardcoded product name — no Products table dependency
      const productName = 'Amul Full Cream Milk';

      await sendButtons(
        phone,
        productName,
        r.predicted_quantity,
        r.predicted_date,
        r.reorder_id
      );
      await markNotified(r.reorder_id);
      console.log(`[Poller] ✅ ${phone} notified for ${productName} (${r.reorder_id})`);
    }
  } catch (err) {
    console.error('[Poller] ❌', err.message);
  }
}

// ─── Express ──────────────────────────────────────────────────────────────────

const app = express();
app.use(express.json());

// Meta webhook verification
app.get('/webhook', (req, res) => {
  if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === VERIFY_TOKEN) {
    console.log('[Webhook] ✅ Verified by Meta');
    return res.send(req.query['hub.challenge']);
  }
  console.warn('[Webhook] ❌ Verification failed');
  res.sendStatus(403);
});

// Incoming WhatsApp messages
app.post('/webhook', async (req, res) => {
  res.sendStatus(200); // always ack Meta first

  try {
    const value = req.body?.entry?.[0]?.changes?.[0]?.value;
    const msg   = value?.messages?.[0];
    if (!msg) return;

    const from = msg.from;
    console.log(`[Webhook] From: ${from} | Type: ${msg.type}`);

    // ── Opt-in button tap (OPTIN_YES / OPTIN_NO) ─────────────────────────────
    if (msg.type === 'interactive' && msg.interactive?.type === 'button_reply') {
      const btnId     = msg.interactive.button_reply.id;
      const action    = btnId.split('_')[0];
      const session   = sessions[from];

      // Handle opt-in flow first (no active reorder needed)
      if (btnId === 'OPTIN_YES') {
        await sendText(from,
          `🎉 You're all set!\n\n` +
          `I'll message you here on WhatsApp whenever you're predicted to run low on something. ` +
          `You'll get a quick prompt to confirm, skip, or adjust the quantity — takes 2 seconds.\n\n` +
          `Sit back and never run out again! 🛒`
        );
        // ── Demo: immediately send a hardcoded reorder nudge ──────────────────
        await sendButtons(
          from,
          'Amul Full Cream Milk',
          2,
          'June 16, 2026 • Morning delivery (8–10 AM)',
          'DEMO-REORDER-001'
        );
        return;
      }

      if (btnId === 'OPTIN_NO') {
        await sendText(from,
          `No problem! 👍 If you change your mind, just say *hi* and I'll be here.`
        );
        return;
      }

      // ── Reorder button tap (YES / NO / EDIT) ─────────────────────────────
      const reorderId = btnId.slice(action.length + 1);

      console.log(`[Webhook] Button: ${action} for ${reorderId}`);

      if (!session) {
        await sendText(from, "Couldn't find an active reorder. It may have already been processed.");
        return;
      }

      if (action === 'YES') {
        await confirmReorder(reorderId);
        await sendText(from,
          `✅ *Order placed on Amazon Now!*\n\n` +
          `📦 *${session.product_name}* × ${session.quantity}\n` +
          `📅 Arriving by: ${session.date}\n\n` +
          `You're all set! 🎉`
        );
        delete sessions[from];

      } else if (action === 'NO') {
        await cancelReorder(reorderId);
        await sendText(from,
          `Got it! We've skipped the reorder for *${session.product_name}*. 👍\n\n` +
          `You can order anytime from Amazon Now.`
        );
        delete sessions[from];

      } else if (action === 'EDIT') {
        sessions[from].awaitingQty = true;
        await sendText(from,
          `✏️ How many units of *${session.product_name}* do you want?\n\nJust reply with a number e.g. *3*`
        );
      }
      return;
    }

    // ── Plain text reply ──────────────────────────────────────────────────────
    if (msg.type === 'text') {
      const text    = msg.text.body.trim();
      const upper   = text.toUpperCase();
      const session = sessions[from];

      console.log(`[Webhook] Text: "${text}" | Session: ${session ? session.reorder_id : 'none'}`);

      // No active session — show opt-in prompt with buttons
      if (!session) {
        await sendOptIn(from);
        return;
      }

      if (upper === 'YES') {
        await confirmReorder(session.reorder_id);
        await sendText(from,
          `✅ *Order placed on Amazon Now!*\n\n` +
          `📦 *${session.product_name}* × ${session.quantity}\n` +
          `📅 Arriving by: ${session.date}\n\n` +
          `You're all set! 🎉`
        );
        delete sessions[from];
        return;
      }

      if (upper === 'NO') {
        await cancelReorder(session.reorder_id);
        await sendText(from,
          `Got it! Skipped the reorder for *${session.product_name}*. 👍`
        );
        delete sessions[from];
        return;
      }

      const changeMatch = upper.match(/^CHANGE\s+(\d+)$/);
      if (changeMatch) {
        const qty = parseInt(changeMatch[1], 10);
        await updateQuantity(session.reorder_id, qty);
        await sendText(from,
          `✅ *Updated & Ordered!*\n\n📦 *${session.product_name}* × ${qty}\n📅 Arriving by: ${session.date}\n\nDone! 🎉`
        );
        delete sessions[from];
        return;
      }

      if (session.awaitingQty) {
        const qty = parseInt(text, 10);
        if (isNaN(qty) || qty <= 0 || qty > 100) {
          await sendText(from, `Please send a number between 1–100. How many *${session.product_name}* do you want?`);
          return;
        }
        await updateQuantity(session.reorder_id, qty);
        await sendText(from,
          `✅ *Updated & Ordered!*\n\n📦 *${session.product_name}* × ${qty}\n📅 Arriving by: ${session.date}\n\nDone! 🎉`
        );
        delete sessions[from];
        return;
      }

      await sendText(from,
        `Reply *YES* to confirm, *NO* to skip, or *CHANGE 3* to update quantity for *${session.product_name}*.`
      );
    }

  } catch (err) {
    console.error('[Webhook] Error:', err.message);
  }
});

// ── /api/demo — fires the full flow to any number, no DB needed ───────────────
app.post('/api/demo', async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'phone is required' });

  try {
    await sendButtons(phone, 'Amul Full Cream Milk', 2, 'June 20', 'DEMO-REORDER-001');
    res.json({ success: true, message: `Prompt sent to ${phone}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── /api/poll — manually trigger the DynamoDB poller ─────────────────────────
app.post('/api/poll', async (req, res) => {
  try {
    await pollAndNotify();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── /api/sessions — see active sessions (debug) ───────────────────────────────
app.get('/api/sessions', (req, res) => res.json(sessions));

app.get('/health', (req, res) => res.json({ status: 'ok', sessions: Object.keys(sessions).length }));

// ─── Cron — poll every 5 mins ─────────────────────────────────────────────────
cron.schedule('*/5 * * * *', pollAndNotify);
console.log('[Cron] Polling every 5 minutes');

app.listen(PORT, () => console.log(`🚀 Amazon Now WhatsApp bot running on port ${PORT}`));