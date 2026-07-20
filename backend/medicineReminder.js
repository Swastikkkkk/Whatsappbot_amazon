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

/* ============================================================
   FAMILY NUMBERS
============================================================ */

const FAMILY = {
  brother: "919560187186", // gets the Yes button
  sister:  "917827130963",
  dad:     "919958360016",
  mom:     "919971872399"
};

/* ============================================================
   WHATSAPP SEND HELPERS
============================================================ */

async function send(payload) {
  console.log("\nSending Payload");
  console.log(JSON.stringify(payload, null, 2));
  try {
    const res = await axios.post(GRAPH_URL, payload, {
      headers: { Authorization: `Bearer ${WA_TOKEN}`, "Content-Type": "application/json" }
    });
    console.log("Meta Response", res.data);
    return res.data;
  } catch (err) {
    console.log("\nMETA ERROR");
    if (err.response) {
      console.log(err.response.status, JSON.stringify(err.response.data, null, 2));
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
  return send({
    messaging_product: "whatsapp",
    to,
    type: "interactive",
    interactive: {
      type: "button",
      body: { text: bodyText },
      action: { buttons: buttons.map(b => ({ type: "reply", reply: { id: b.id, title: b.title } })) }
    }
  });
}

/* ============================================================
   MEDICINE REMINDER LOGIC
   - Fires at 9:00 AM and 9:00 PM daily
   - Pings brother with a Yes button
   - Re-pings brother every 5 min if he doesn't confirm
   - After 15 min of silence, also pings sister/dad/mom
   - Keeps nagging everyone every 5 min until confirmed
   - Resets clean for the next scheduled slot
============================================================ */

const SCHEDULE = [
  { key: "morning", hour: 9,  minute: 0, label: "morning" },
  { key: "evening", hour: 21, minute: 0, label: "evening" }
];

const RETRY_INTERVAL_MS = 5 * 60 * 1000;   // re-ping brother every 5 min
const ESCALATE_AFTER_MS = 15 * 60 * 1000;  // notify family after 15 min silence

const medState = {
  morning: { confirmed: true, startedAt: null, familyNotified: false, retryHandle: null },
  evening: { confirmed: true, startedAt: null, familyNotified: false, retryHandle: null }
};

async function pingBrother(doseKey, label) {
  const buttonId = doseKey === "morning" ? "MED_YES_MORNING" : "MED_YES_EVENING";
  await sendButtons(
    FAMILY.brother,
    `💊 Time for your ${label} medicine — did you take it?`,
    [{ id: buttonId, title: "✅ Yes, done" }]
  );
}

async function pingFamily(doseKey, label) {
  const members = [FAMILY.sister, FAMILY.dad, FAMILY.mom];
  for (const number of members) {
    await sendText(number, `⚠️ He hasn't confirmed his ${label} medicine yet (15+ min). Can someone check on him?`);
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

  medState[doseKey] = { confirmed: false, startedAt: Date.now(), familyNotified: false, retryHandle: null };

  await pingBrother(doseKey, label);

  medState[doseKey].retryHandle = setInterval(async () => {
    const s = medState[doseKey];
    if (s.confirmed) {
      clearRetry(doseKey);
      return;
    }

    const elapsed = Date.now() - s.startedAt;

    if (!s.familyNotified && elapsed >= ESCALATE_AFTER_MS) {
      s.familyNotified = true;
      try { await pingFamily(doseKey, label); } catch (e) { console.log("Family escalation failed:", e.message); }
    }

    try { await pingBrother(doseKey, label); } catch (e) { console.log("Brother re-ping failed:", e.message); }

    if (s.familyNotified) {
      try { await pingFamily(doseKey, label); } catch (e) { console.log("Family re-ping failed:", e.message); }
    }

  }, RETRY_INTERVAL_MS);
}

function confirmDose(doseKey) {
  if (!medState[doseKey]) return;
  medState[doseKey].confirmed = true;
  clearRetry(doseKey);
}

function medicineTick() {
  const now = new Date();
  for (const slot of SCHEDULE) {
    if (now.getHours() === slot.hour && now.getMinutes() === slot.minute) {
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

app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("Webhook Verified");
    return res.status(200).send(challenge);
  }
  res.sendStatus(403);
});

app.post("/webhook", async (req, res) => {
  res.sendStatus(200);

  try {
    const message = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (!message) return;

    if (message.type !== "interactive") return;

    const replyId = message.interactive.button_reply?.id || message.interactive.list_reply?.id;
    if (!replyId) return;

    console.log(`${replyId} Clicked`);

    if (replyId === "MED_YES_MORNING") {
      confirmDose("morning");
      await sendText(message.from, "Marked as taken ✅ nice work.");
      return;
    }

    if (replyId === "MED_YES_EVENING") {
      confirmDose("evening");
      await sendText(message.from, "Marked as taken ✅ nice work.");
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

/* ============================================================
   START
============================================================ */

app.listen(PORT, () => {
  console.log(`Medicine reminder bot running on http://localhost:${PORT}`);
  console.log("Checking every minute for 9:00 AM / 9:00 PM triggers...");
  setInterval(medicineTick, 60 * 1000);
});