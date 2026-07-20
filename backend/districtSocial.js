// // districtSocial.js
// // Booking-free social coordination flows for District.
// // Wire in: const districtSocial = require("./districtSocial")({ sendText, sendButtons, sendList, imageFor, getSession });

// const localDb = require("./localDb");

// module.exports = function (ctx) {

//   const { sendText, sendButtons, sendList, imageFor, getSession, extras } = ctx;

//   /* ============================================================
//      IN-MEMORY MOCK STORES
//      In prod: DB tables. For demo, in-memory is enough to show the logic.
//   ============================================================ */

//   // Pool of people currently "looking" for a partner/activity.
//   // { phone, name, sport, when, skill }
//   const lookingPool = [];

//   // Waitlist entries per (sport, slotLabel)
//   const waitlist = [];

//   // Pair-play counters: key = sorted [nameA,nameB,sport].join("|") -> count
//   const pairHistory = {};

//   // Active group votes: sessionId (phone) -> { options: [...], votes: {optionId: count}, voters: Set }
//   const activeVotes = {};

//   // Real, persisted event-attendance history — { phone: [{ category, title, timestamp }] }.
//   // Backs the movie/IPL "it's been a while" nudges below. Same pattern as reorderEngine's
//   // orderLog, persisted via localDb.js.
//   const eventLog = localDb.getCollection("districtEvents");

//   /** Call whenever a user attends/books something in District, to build real nudge history. */
//   function recordEvent(phone, category, title, timestamp) {
//     if (!eventLog[phone]) eventLog[phone] = [];
//     eventLog[phone].push({ category, title: title || category, timestamp: timestamp || Date.now() });
//     localDb.persist();
//   }

//   function lastEventOf(phone, category) {
//     const events = (eventLog[phone] || []).filter(e => e.category === category).sort((a, b) => b.timestamp - a.timestamp);
//     return events[0] || null;
//   }

//   /* ============================================================
//      MOVIE / EVENT "IT'S BEEN A WHILE" NUDGES — driven by real
//      recorded history, not a fixed clock time.
//   ============================================================ */

//   async function checkMovieNudge(phone, now, thresholdMs) {
//     if (!now) now = Date.now();
//     if (!thresholdMs) thresholdMs = 14 * 24 * 60 * 60 * 1000; // default: 14 days

//     const last = lastEventOf(phone, "Movies");
//     if (!last) return false; // no history yet, nothing to nudge on

//     if (now - last.timestamp < thresholdMs) return false; // not due yet

//     const daysAgo = Math.round((now - last.timestamp) / (1000 * 60 * 60 * 24));

//     await sendButtons(
//       phone,
//       `🎬 It's been ${daysAgo} days since you watched ${last.title} on District.\n\nAnything good playing this week?`,
//       [
//         { id: "DISTRICTCAT_MOVIES", title: "🎬 See What's Playing" },
//         { id: "HOME", title: "Not now" }
//       ],
//       { image: imageFor("movie-nudge-" + last.title) }
//     );

//     return true;
//   }

//   async function checkIplNudge(phone, now, thresholdMs) {
//     if (!now) now = Date.now();
//     if (!thresholdMs) thresholdMs = 10 * 60 * 1000; // demo default: 10 min, real prod would be days

//     const last = lastEventOf(phone, "IPL");
//     const daysAgo = last ? Math.round((now - last.timestamp) / (1000 * 60 * 60 * 24)) : null;

//     if (last && now - last.timestamp < thresholdMs) return false; // recently attended, not due

//     const bodyText = last
//       ? `🏏 It's been ${daysAgo} days since you caught an IPL match live.\n\nNext match is coming up — want the best seats?`
//       : `🏏 Missed the IPL buzz lately? Catch the next match live — great seats still open.`;

//     await extras.sendCTAButton(
//       phone,
//       bodyText,
//       "View IPL Tickets",
//       `https://example.com/app/events/ipl`
//     );

//     return true;
//   }

//   /* ============================================================
//      1. LOOKING BROADCAST + MATCH
//   ============================================================ */

//   async function lookingBroadcast(to, name, sport, when) {

//     // Find existing matches before adding self
//     const matches = lookingPool.filter(p => p.sport === sport && p.when === when && p.phone !== to);

//     lookingPool.push({ phone: to, name, sport, when });

//     if (matches.length === 0) {
//       return sendText(
//         to,
//         `🔍 Got it — you're looking for ${sport} on ${when}.\n\nWe'll ping you the moment someone else near you wants the same. No booking needed yet.`
//       );
//     }

//     const names = matches.map(m => m.name).join(", ");

//     // Notify the matched people too (they were waiting silently)
//     for (const m of matches) {
//       await sendButtons(
//         m.phone,
//         `🤝 ${name} is also looking for ${sport} on ${when}!\n\nWant to connect?`,
//         [
//           { id: `DSCONNECT_${to}`, title: "✅ Connect" },
//           { id: "DISTRICT_HOME",   title: "Not now" }
//         ]
//       );
//     }

//     return sendButtons(
//       to,
//       `🤝 Found ${matches.length} ${matches.length > 1 ? "people" : "person"} also looking for ${sport} on ${when}!\n\n${names}`,
//       [
//         { id: `DSCONNECT_${matches[0].phone}`, title: "✅ Connect" },
//         { id: "DISTRICT_HOME",                 title: "Not now" }
//       ]
//     );
//   }

//   async function connectUsers(to, otherPhone, myName, otherName) {

//     // Track pair history for recurring-pod detection
//     recordPairPlay(myName, otherName, "activity");

//     await sendText(to, `✅ Connected! Here's ${otherName}'s number: ${otherPhone}\n\nSort out the details and book on the District app when ready.`);
//     return sendText(otherPhone, `✅ ${myName} wants to connect — reach out: ${to}`);
//   }

//   /* ============================================================
//      2. GROUP ACTIVITY STARTER (vote-to-decide)
//   ============================================================ */

//   async function startGroupVote(to, groupSize) {

//     const options = [
//       { id: "OPT_DINING",   label: "🍽 Dinner at CourtHouse" },
//       { id: "OPT_BOWLING",  label: "🎳 Bowling Night" },
//       { id: "OPT_PICKLE",   label: "🏓 Pickleball + drinks after" }
//     ];

//     activeVotes[to] = { options, votes: {}, voters: new Set(), groupSize };

//     const rows = options.map(o => ({ id: `DSVOTE_${o.id}`, title: o.label, description: "Tap to vote" }));

//     return sendList(
//       to,
//       `🗳 ${groupSize} of you want to do something tonight — vote on an option (share this poll with your group):`,
//       "Vote",
//       [{ title: "Options", rows }]
//     );
//   }

//   async function castVote(to, optionId) {

//     const vote = activeVotes[to] || Object.values(activeVotes).find(v => v.options.some(o => o.id === optionId));
//     if (!vote) return sendText(to, "This vote has ended.");

//     vote.votes[optionId] = (vote.votes[optionId] || 0) + 1;
//     vote.voters.add(to);

//     if (vote.voters.size >= vote.groupSize) {
//       const winnerId = Object.keys(vote.votes).sort((a, b) => vote.votes[b] - vote.votes[a])[0];
//       const winner = vote.options.find(o => o.id === winnerId);
//       return sendText(to, `🎉 Vote's in! Winner: ${winner.label}\n\nOpening District app to book...`);
//     }

//     return sendText(to, `Vote counted! Waiting on ${vote.groupSize - vote.voters.size} more.`);
//   }

//   /* ============================================================
//      3. RECURRING SOCIAL POD DETECTION
//   ============================================================ */

//   function recordPairPlay(nameA, nameB, sport) {
//     const key = [nameA, nameB].sort().join("|") + "|" + sport;
//     pairHistory[key] = (pairHistory[key] || 0) + 1;
//     return pairHistory[key];
//   }

//   async function checkAndSuggestPod(to, nameA, nameB, sport) {
//     const key = [nameA, nameB].sort().join("|") + "|" + sport;
//     const count = pairHistory[key] || 0;

//     if (count >= 3) {
//       return sendButtons(
//         to,
//         `👀 You and ${nameB} have played ${sport} ${count} times now.\n\nSet a standing Wednesday 7PM slot? I'll remind you both weekly.`,
//         [
//           { id: "DSPOD_YES", title: "✅ Set It Up" },
//           { id: "DSPOD_NO",  title: "Not now" }
//         ]
//       );
//     }
//     return null;
//   }

//   /* ============================================================
//      4. AMBIENT "SOMEONE'S FREE" NUDGE
//   ============================================================ */

//   async function ambientFreeNudge(to, buddyName, activity) {
//     return sendButtons(
//       to,
//       `👋 ${buddyName} (your last ${activity} partner) just marked themselves free tonight.\n\nWant to play?`,
//       [
//         { id: "DISTRICT_SOLO", title: "🎯 Yes, set it up" },
//         { id: "HOME",          title: "Not tonight" }
//       ]
//     );
//   }

//   /* ============================================================
//      5. POST-EVENT LOOP → SEED NEXT EVENT
//   ============================================================ */

//   async function postEventFollowup(to, activity, groupNames) {
//     return sendButtons(
//       to,
//       `How was ${activity} with ${groupNames.join(", ")}?\n\nSame time next week?`,
//       [
//         { id: "DSREPEAT_YES", title: "✅ Same Time Next Week" },
//         { id: "HOME",         title: "Not this time" }
//       ]
//     );
//   }

//   /* ============================================================
//      6. WAITLIST → GROUP CONVERSION
//   ============================================================ */

//   async function joinWaitlist(to, name, sport, slotLabel) {

//     const others = waitlist.filter(w => w.sport === sport && w.slotLabel === slotLabel && w.phone !== to);
//     waitlist.push({ phone: to, name, sport, slotLabel });

//     if (others.length === 0) {
//       return sendText(to, `⏳ That slot's full. You're on the waitlist for ${sport} — ${slotLabel}. We'll let you know if others join.`);
//     }

//     const names = others.map(o => o.name).join(", ");
//     return sendButtons(
//       to,
//       `⏳ That slot's full, but ${others.length} other${others.length > 1 ? "s are" : " is"} also waitlisted for ${sport} around ${slotLabel}: ${names}\n\nWant to be grouped for a different court together?`,
//       [
//         { id: "DISTRICT_GROUP", title: "✅ Group Us Up" },
//         { id: "DISTRICT_HOME",  title: "I'll wait" }
//       ]
//     );
//   }

//   return {
//     lookingBroadcast, connectUsers,
//     startGroupVote, castVote,
//     recordPairPlay, checkAndSuggestPod,
//     ambientFreeNudge,
//     postEventFollowup,
//     joinWaitlist,
//     recordEvent, lastEventOf, checkMovieNudge, checkIplNudge,
//     _stores: { lookingPool, waitlist, pairHistory, activeVotes, eventLog } // exposed for /test endpoints and debugging
//   };
// };
// districtSocial.js
// Booking-free social coordination flows for District.
// Wire in: const districtSocial = require("./districtSocial")({ sendText, sendButtons, sendList, getSession, extras });

const localDb = require("./localDb");

module.exports = function (ctx) {

  const { sendText, sendButtons, sendList, getSession, extras } = ctx;

  /* ============================================================
     IN-MEMORY MOCK STORES
     In prod: DB tables. For demo, in-memory is enough to show the logic.
  ============================================================ */

  // Pool of people currently "looking" for a partner/activity.
  // { phone, name, sport, when, skill }
  const lookingPool = [];

  // Waitlist entries per (sport, slotLabel)
  const waitlist = [];

  // Pair-play counters: key = sorted [nameA,nameB,sport].join("|") -> count
  const pairHistory = {};

  // Active group votes: sessionId (phone) -> { options: [...], votes: {optionId: count}, voters: Set }
  const activeVotes = {};

  // Real, persisted event-attendance history — { phone: [{ category, title, timestamp }] }.
  // Backs the movie/IPL "it's been a while" nudges below. Same pattern as reorderEngine's
  // orderLog, persisted via localDb.js.
  const eventLog = localDb.getCollection("districtEvents");

  /** Call whenever a user attends/books something in District, to build real nudge history. */
  function recordEvent(phone, category, title, timestamp) {
    if (!eventLog[phone]) eventLog[phone] = [];
    eventLog[phone].push({ category, title: title || category, timestamp: timestamp || Date.now() });
    localDb.persist();
  }

  function lastEventOf(phone, category) {
    const events = (eventLog[phone] || []).filter(e => e.category === category).sort((a, b) => b.timestamp - a.timestamp);
    return events[0] || null;
  }

  /* ============================================================
     MOVIE / EVENT "IT'S BEEN A WHILE" NUDGES — driven by real
     recorded history, not a fixed clock time.
  ============================================================ */

  async function checkMovieNudge(phone, now, thresholdMs) {
    if (!now) now = Date.now();
    if (!thresholdMs) thresholdMs = 14 * 24 * 60 * 60 * 1000; // default: 14 days

    const last = lastEventOf(phone, "Movies");
    if (!last) return false; // no history yet, nothing to nudge on

    if (now - last.timestamp < thresholdMs) return false; // not due yet

    const daysAgo = Math.round((now - last.timestamp) / (1000 * 60 * 60 * 24));

    await sendButtons(
      phone,
      `It's been ${daysAgo} days since ${last.title}. Anything good on this week?`,
      [
        { id: "DISTRICTCAT_MOVIES", title: "🎬 See What's Playing" },
        { id: "HOME", title: "Not now" }
      ]
    );

    return true;
  }

  async function checkIplNudge(phone, now, thresholdMs) {
    if (!now) now = Date.now();
    if (!thresholdMs) thresholdMs = 10 * 60 * 1000; // demo default: 10 min, real prod would be days

    const last = lastEventOf(phone, "IPL");
    const daysAgo = last ? Math.round((now - last.timestamp) / (1000 * 60 * 60 * 24)) : null;

    if (last && now - last.timestamp < thresholdMs) return false; // recently attended, not due

    const bodyText = last
      ? `Been ${daysAgo} days since your last IPL match live. Next one's coming up — want good seats?`
      : `Missed the IPL buzz lately? Catch the next match live.`;

    await extras.sendCTAButton(
      phone,
      bodyText,
      "View Tickets",
      `https://example.com/app/events/ipl`
    );

    return true;
  }

  /* ============================================================
     1. LOOKING BROADCAST + MATCH
  ============================================================ */

  async function lookingBroadcast(to, name, sport, when) {

    // Find existing matches before adding self
    const matches = lookingPool.filter(p => p.sport === sport && p.when === when && p.phone !== to);

    lookingPool.push({ phone: to, name, sport, when });

    if (matches.length === 0) {
      return sendText(
        to,
        `Got it — looking for ${sport} on ${when}. I'll ping you the second someone else nearby wants the same.`
      );
    }

    const names = matches.map(m => m.name).join(", ");

    // Notify the matched people too (they were waiting silently)
    for (const m of matches) {
      await sendButtons(
        m.phone,
        `${name} is also looking for ${sport} on ${when} — connect?`,
        [
          { id: `DSCONNECT_${to}`, title: "✅ Connect" },
          { id: "DISTRICT_HOME",   title: "Not now" }
        ]
      );
    }

    return sendButtons(
      to,
      `Found ${matches.length} ${matches.length > 1 ? "people" : "person"} also up for ${sport} on ${when}: ${names}`,
      [
        { id: `DSCONNECT_${matches[0].phone}`, title: "✅ Connect" },
        { id: "DISTRICT_HOME",                 title: "Not now" }
      ]
    );
  }

  async function connectUsers(to, otherPhone, myName, otherName) {

    // Track pair history for recurring-pod detection
    recordPairPlay(myName, otherName, "activity");

    await sendText(to, `Connected! ${otherName}'s number: ${otherPhone}\n\nSort the details and book whenever you're ready.`);
    return sendText(otherPhone, `${myName} wants to connect — reach out: ${to}`);
  }

  /* ============================================================
     2. GROUP ACTIVITY STARTER (vote-to-decide)
  ============================================================ */

  async function startGroupVote(to, groupSize) {

    const options = [
      { id: "OPT_DINING",   label: "🍽 Dinner at CourtHouse" },
      { id: "OPT_BOWLING",  label: "🎳 Bowling Night" },
      { id: "OPT_PICKLE",   label: "🏓 Pickleball + drinks after" }
    ];

    activeVotes[to] = { options, votes: {}, voters: new Set(), groupSize };

    const rows = options.map(o => ({ id: `DSVOTE_${o.id}`, title: o.label, description: "Tap to vote" }));

    return sendList(
      to,
      `${groupSize} of you want to hang tonight — vote (share this with the group):`,
      "Vote",
      [{ title: "Options", rows }]
    );
  }

  async function castVote(to, optionId) {

    const vote = activeVotes[to] || Object.values(activeVotes).find(v => v.options.some(o => o.id === optionId));
    if (!vote) return sendText(to, "This vote's closed.");

    vote.votes[optionId] = (vote.votes[optionId] || 0) + 1;
    vote.voters.add(to);

    if (vote.voters.size >= vote.groupSize) {
      const winnerId = Object.keys(vote.votes).sort((a, b) => vote.votes[b] - vote.votes[a])[0];
      const winner = vote.options.find(o => o.id === winnerId);
      return sendText(to, `Vote's in! Winner: ${winner.label} — opening booking now.`);
    }

    return sendText(to, `Counted! Waiting on ${vote.groupSize - vote.voters.size} more.`);
  }

  /* ============================================================
     3. RECURRING SOCIAL POD DETECTION
  ============================================================ */

  function recordPairPlay(nameA, nameB, sport) {
    const key = [nameA, nameB].sort().join("|") + "|" + sport;
    pairHistory[key] = (pairHistory[key] || 0) + 1;
    return pairHistory[key];
  }

  async function checkAndSuggestPod(to, nameA, nameB, sport) {
    const key = [nameA, nameB].sort().join("|") + "|" + sport;
    const count = pairHistory[key] || 0;

    if (count >= 3) {
      return sendButtons(
        to,
        `You and ${nameB} have played ${sport} ${count} times now — want a standing Wednesday 7PM slot? I'll remind you both weekly.`,
        [
          { id: "DSPOD_YES", title: "✅ Set It Up" },
          { id: "DSPOD_NO",  title: "Not now" }
        ]
      );
    }
    return null;
  }

  /* ============================================================
     4. AMBIENT "SOMEONE'S FREE" NUDGE
  ============================================================ */

  async function ambientFreeNudge(to, buddyName, activity) {
    return sendButtons(
      to,
      `${buddyName} — your last ${activity} partner — just went free tonight. Play?`,
      [
        { id: "DISTRICT_SOLO", title: "🎯 Set it up" },
        { id: "HOME",          title: "Not tonight" }
      ]
    );
  }

  /* ============================================================
     5. POST-EVENT LOOP → SEED NEXT EVENT
  ============================================================ */

  async function postEventFollowup(to, activity, groupNames) {
    return sendButtons(
      to,
      `How was ${activity} with ${groupNames.join(", ")}? Same time next week?`,
      [
        { id: "DSREPEAT_YES", title: "✅ Same Time Next Week" },
        { id: "HOME",         title: "Not this time" }
      ]
    );
  }

  /* ============================================================
     6. WAITLIST → GROUP CONVERSION
  ============================================================ */

  async function joinWaitlist(to, name, sport, slotLabel) {

    const others = waitlist.filter(w => w.sport === sport && w.slotLabel === slotLabel && w.phone !== to);
    waitlist.push({ phone: to, name, sport, slotLabel });

    if (others.length === 0) {
      return sendText(to, `That slot's full — you're on the waitlist for ${sport}, ${slotLabel}. I'll ping you if others join.`);
    }

    const names = others.map(o => o.name).join(", ");
    return sendButtons(
      to,
      `Slot's full, but ${others.length} other${others.length > 1 ? "s are" : " is"} waitlisted too around ${slotLabel}: ${names}\n\nWant to group up for a different court together?`,
      [
        { id: "DISTRICT_GROUP", title: "✅ Group Us Up" },
        { id: "DISTRICT_HOME",  title: "I'll wait" }
      ]
    );
  }

  return {
    lookingBroadcast, connectUsers,
    startGroupVote, castVote,
    recordPairPlay, checkAndSuggestPod,
    ambientFreeNudge,
    postEventFollowup,
    joinWaitlist,
    recordEvent, lastEventOf, checkMovieNudge, checkIplNudge,
    _stores: { lookingPool, waitlist, pairHistory, activeVotes, eventLog } // exposed for /test endpoints and debugging
  };
};