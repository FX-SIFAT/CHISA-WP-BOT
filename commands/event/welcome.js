"use strict";

const { Events } = require("wp-heart");
const moment = require("moment-timezone");

const joinBatches  = {};
const leaveBatches = {};
const BATCH_MS = 2000;



const nameCache = {};

function setupContactsListener(bot) {
    bot.core.ev.on("contacts.upsert", (contacts) => {
        for (const c of contacts) {
            const name = c.notify || c.verifiedName || c.name;
            if (c.id && name) nameCache[c.id] = name;
        }
    });
    bot.core.ev.on("contacts.update", (updates) => {
        for (const c of updates) {
            const name = c.notify || c.verifiedName || c.name;
            if (c.id && name) nameCache[c.id] = name;
        }
    });
}

let contactsCore = null;


function getSession(hour) {
    if (hour < 12) return "Morning 🌅";
    if (hour < 15) return "Noon ☀️";
    if (hour < 18) return "Afternoon 🌤️";
    if (hour < 21) return "Evening 🌆";
    return "Night 🌙";
}

function applyTemplate(template, vars) {
    return template
        .replace(/%tag%/g,          vars.tag)
        .replace(/%name%/g,         vars.name)
        .replace(/%subject%/g,      vars.groupName)
        .replace(/%count%/g,        vars.count)
        .replace(/%session%/g,      vars.session)
        .replace(/%time%/g,         vars.time)
        .replace(/%type%/g,         vars.type || "")
        .replace(/%description%/g,  vars.description || "");
}

function defaultWelcomeText(vars) {
    return (
        `✦•┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈•✦\n` +
        `   ✨ *W E L C O M E* ✨\n` +
        `✦•┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈•✦\n\n` +
        `  ╰➤ 👤 *Name*   ›  ${vars.name}\n` +
        `  ╰➤ 🏠 *Group*  ›  ${vars.groupName}\n` +
        `  ╰➤ 🎯 *Rank*   ›  Member #${vars.count}\n` +
        `  ╰➤ 🌤 *Mood*   ›  Good ${vars.session}\n\n` +
        `✦•┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈•✦\n` +
        `  _Glad to have you here!_ 🎊\n` +
        `✦•┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈•✦`
    );
}

function defaultLeaveText(vars) {
    const action = vars.type === "was kicked from"
        ? `🔨 *Kicked* from the group`
        : `🚪 *Left* the group`;
    return (
        `✦•┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈•✦\n` +
        `   💔 *G O O D B Y E* 💔\n` +
        `✦•┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈•✦\n\n` +
        `  ╰➤ 👤 *Name*    ›  ${vars.name}\n` +
        `  ╰➤ 🏠 *Group*   ›  ${vars.groupName}\n` +
        `  ╰➤ 👥 *Remaining* › ${vars.count} members\n` +
        `  ╰➤ 🕐 *Time*    ›  ${vars.time}\n` +
        `  ╰➤ ${action}\n\n` +
        `✦•┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈•✦\n` +
        `  _Take care, hope to see you again!_ 💙\n` +
        `✦•┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈•✦`
    );
}

function buildCardUrl(avatarUrl, name, groupName, count, cardType) {
    if (!avatarUrl) return null;
    return (
        `https://maybexenos.vercel.app/welcome-card/greetings` +
        `?avatar=${encodeURIComponent(avatarUrl)}` +
        `&username=${encodeURIComponent(name.toUpperCase())}` +
        `&type=${cardType}` +
        `&groupname=${encodeURIComponent(groupName.toUpperCase())}` +
        `&count=${count}` +
        `&bg=`
    );
}

async function trySendWithCard(bot, groupJid, participantJid, cardUrl, text) {
    try {
        if (cardUrl) {
            await bot.sendMessage(groupJid, {
                image:    { url: cardUrl },
                caption:  text,
                mentions: [participantJid]
            });
        } else {
            await bot.sendMessage(groupJid, { text, mentions: [participantJid] });
        }
    } catch (_) {
        await bot.sendMessage(groupJid, { text, mentions: [participantJid] }).catch(() => {});
    }
}


function passGuards(bot, groupJid) {
    const groupDb = bot.getDb("groups", groupJid);
    const botDb   = bot.getDb("bot");
    if (groupDb?.mutebot) return false;
    if (groupDb?.option?.welcome === false) return false;
    if (!["group", "public"].includes(botDb?.mode || "public")) return false;
    const hour = moment().tz(config.system.timeZone).hour();
    if (config.system.unavailableAtNight && hour >= 0 && hour < 6) return false;
    return true;
}


async function sendWelcomeMessage(bot, groupJid, participantJid, metadata, groupDb, participantPn) {
    const groupName = metadata?.subject || "Our Group";
    const count     = metadata?.participants?.length || 1;
    const rawPhone  = participantPn || participantJid;
    const phone     = rawPhone.split("@")[0];
    const cached    = nameCache[participantJid];
    const stored    = bot.getPushName(participantJid);
    const pushName  = cached || (stored !== "Unknown" ? stored : null) || phone;
    const tag       = `@${phone}`;
    const now       = moment().tz(config.system.timeZone);
    const session   = getSession(now.hour());
    const time      = now.format("DD/MM/YYYY HH:mm:ss");

    const vars = { tag, name: pushName, groupName, count, session, time, description: metadata?.description };

    const customTemplate = groupDb?.text?.welcome;
    const text = customTemplate ? applyTemplate(customTemplate, vars) : defaultWelcomeText(vars);

    let avatarUrl = null;
    try { avatarUrl = await bot.core.profilePictureUrl(participantJid, "image"); } catch (_) {}

    const cardUrl = buildCardUrl(avatarUrl, pushName, groupName, count, "welcome");
    await trySendWithCard(bot, groupJid, participantJid, cardUrl, text);

    if (groupDb?.text?.intro) {
        await bot.sendMessage(groupJid, {
            text:     groupDb.text.intro,
            mentions: [participantJid]
        }).catch(() => {});
    }
}

async function flushJoinBatch(bot, groupJid, batch) {
    if (!passGuards(bot, groupJid)) return;
    const groupDb  = bot.getDb("groups", groupJid);
    const metadata = await bot.core.groupMetadata(groupJid).catch(() => null);
    for (const { participantJid, participantPn } of batch) {
        await sendWelcomeMessage(bot, groupJid, participantJid, metadata, groupDb, participantPn);
    }
}


async function sendLeaveMessage(bot, groupJid, participantJid, isKicked, metadata, groupDb, participantPn) {
    const groupName = metadata?.subject || "Our Group";
    const count     = metadata?.participants?.length || 0;
    const rawPhone  = participantPn || participantJid;
    const phone     = rawPhone.split("@")[0];
    const cached    = nameCache[participantJid];
    const stored    = bot.getPushName(participantJid);
    const pushName  = cached || (stored !== "Unknown" ? stored : null) || phone;
    const tag       = `@${phone}`;
    const now       = moment().tz(config.system.timeZone);
    const session   = getSession(now.hour());
    const time      = now.format("DD/MM/YYYY HH:mm:ss");
    const type      = isKicked ? "was kicked from" : "left";

    const vars = { tag, name: pushName, groupName, count, session, time, type, description: metadata?.description };

    const customTemplate = groupDb?.text?.goodbye;
    const text = customTemplate ? applyTemplate(customTemplate, vars) : defaultLeaveText(vars);

    let avatarUrl = null;
    try { avatarUrl = await bot.core.profilePictureUrl(participantJid, "image"); } catch (_) {}

    const cardUrl = buildCardUrl(avatarUrl, pushName, groupName, count, "goodbye");
    await trySendWithCard(bot, groupJid, participantJid, cardUrl, text);
}

async function flushLeaveBatch(bot, groupJid, batch) {
    if (!passGuards(bot, groupJid)) return;
    const groupDb  = bot.getDb("groups", groupJid);
    const metadata = await bot.core.groupMetadata(groupJid).catch(() => null);
    for (const { participantJid, participantPn, isKicked } of batch) {
        await sendLeaveMessage(bot, groupJid, participantJid, isKicked, metadata, groupDb, participantPn);
    }
}


async function handleWelcome(bot, welcome, type, isSimulate = false) {
    const groupJid       = welcome.id;
    const participantJid = welcome.participant;
    const participantPn  = welcome.participantPn;
    const isJoin         = type === Events.UserJoin;

    const isKicked       = !isJoin && !!(welcome.by && welcome.by !== participantJid);

    if (isSimulate) {
        const groupDb  = bot.getDb("groups", groupJid);
        const metadata = await bot.core.groupMetadata(groupJid).catch(() => null);
        if (isJoin) {
            await sendWelcomeMessage(bot, groupJid, participantJid, metadata, groupDb, participantPn);
        } else {
            await sendLeaveMessage(bot, groupJid, participantJid, isKicked, metadata, groupDb, participantPn);
        }
        return;
    }

    if (!passGuards(bot, groupJid)) return;

    if (isJoin) {
        if (!joinBatches[groupJid]) joinBatches[groupJid] = { timer: null, batch: [] };
        joinBatches[groupJid].batch.push({ participantJid, participantPn });
        clearTimeout(joinBatches[groupJid].timer);
        joinBatches[groupJid].timer = setTimeout(() => {
            const batch = joinBatches[groupJid]?.batch || [];
            delete joinBatches[groupJid];
            flushJoinBatch(bot, groupJid, batch).catch(() => {});
        }, BATCH_MS);
    } else {
        if (!leaveBatches[groupJid]) leaveBatches[groupJid] = { timer: null, batch: [] };
        leaveBatches[groupJid].batch.push({ participantJid, participantPn, isKicked });
        clearTimeout(leaveBatches[groupJid].timer);
        leaveBatches[groupJid].timer = setTimeout(() => {
            const batch = leaveBatches[groupJid]?.batch || [];
            delete leaveBatches[groupJid];
            flushLeaveBatch(bot, groupJid, batch).catch(() => {});
        }, BATCH_MS);
    }
}


module.exports = (bot) => {
    bot.ev.on(Events.ClientReady, () => {
        if (contactsCore === bot.core) return;
        contactsCore = bot.core;
        setupContactsListener(bot);
    });
    bot.ev.on(Events.UserJoin,  (welcome) => handleWelcome(bot, welcome, Events.UserJoin));
    bot.ev.on(Events.UserLeave, (welcome) => handleWelcome(bot, welcome, Events.UserLeave));
};

module.exports.handleWelcome = handleWelcome;
