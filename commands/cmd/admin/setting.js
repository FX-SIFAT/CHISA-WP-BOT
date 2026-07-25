"use strict";

const fs   = require("node:fs");
const path = require("node:path");

const LINE = "─".repeat(32);
const SETTINGS_PATH = path.resolve(__dirname, "../../../settings.json");

const LIVE_BOOLEANS = {
    antiBug:                  { label: "Anti Bug",                emoji: "🛡️",  desc: "Block suspicious/exploit messages" },
    antiCall:                 { label: "Anti Call",               emoji: "📵",  desc: "Auto-reject incoming calls" },
    autoTypingOnCmd:          { label: "Auto Typing",             emoji: "⌨️",  desc: "Simulate typing before replies" },
    privatePremiumOnly:       { label: "Private Premium Only",    emoji: "💎",  desc: "DM commands restricted to premium" },
    requireBotGroupMembership:{ label: "Require Group Membership",emoji: "👥",  desc: "Users must join bot's group first" },
    requireGroupSewa:         { label: "Require Group Sewa",      emoji: "🔒",  desc: "Bot only active in subscribed groups" },
    restrict:                 { label: "Restrict All",            emoji: "🚫",  desc: "Block all commands globally" },
    unavailableAtNight:       { label: "Unavailable at Night",    emoji: "😴",  desc: "Bot off from 12 AM to 6 AM" },
    useCoin:                  { label: "Coin System",             emoji: "🪙",  desc: "Enable coin usage for commands" },
};

const RESTART_BOOLEANS = {
    alwaysOnline:    { label: "Always Online",    emoji: "🟢", desc: "Bot always shows as online on WhatsApp" },
    autoRead:        { label: "Auto Read",        emoji: "👁️",  desc: "Auto-mark all messages as read" },
    selfReply:       { label: "Self Reply",       emoji: "🤖", desc: "Bot responds to its own messages" },
    suppressBaileys: { label: "Suppress Baileys", emoji: "🔇", desc: "Hide Baileys internal logs" },
    useStore:        { label: "Use Store",        emoji: "💾", desc: "Cache messages in memory store" },
    useServer:       { label: "Use Server",       emoji: "🌐", desc: "Enable web dashboard/health server" },
};

const VALUE_SETTINGS = {
    cooldown: { label: "Cooldown",  emoji: "⏱️", desc: "Command cooldown in ms",  type: "number", min: 0, max: 60000 },
    timeZone: { label: "Time Zone", emoji: "🕐", desc: "Timezone for night check", type: "string" },
};

const ALL_BOOLEANS = { ...LIVE_BOOLEANS, ...RESTART_BOOLEANS };

function readSettings() {
    return JSON.parse(fs.readFileSync(SETTINGS_PATH, "utf8"));
}

function saveSettings(raw) {
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(raw, null, 2));
}

function fmtBool(val) {
    return val ? "✅ ON" : "❌ OFF";
}

function buildStatusList(sys) {
    const liveRows = Object.entries(LIVE_BOOLEANS).map(([key, meta]) =>
        `  ${meta.emoji} ${meta.label.padEnd(26)} ${fmtBool(sys[key])}`
    ).join("\n");

    const restartRows = Object.entries(RESTART_BOOLEANS).map(([key, meta]) =>
        `  ${meta.emoji} ${meta.label.padEnd(26)} ${fmtBool(sys[key])}`
    ).join("\n");

    const valueRows = Object.entries(VALUE_SETTINGS).map(([key, meta]) =>
        `  ${meta.emoji} ${meta.label.padEnd(26)} ${formatter.inlineCode(String(sys[key] ?? "—"))}`
    ).join("\n");

    return (
        `╔══[ ⚙️ *System Settings* ]\n${LINE}\n` +
        `  ⚡ *Live (no restart needed)*\n${liveRows}\n\n` +
        `  🔄 *Requires Restart*\n${restartRows}\n\n` +
        `  📊 *Values*\n${valueRows}\n` +
        `${LINE}\n` +
        `  💡 Toggle : ${formatter.inlineCode(`setting <key>`)}\n` +
        `  💡 Set    : ${formatter.inlineCode(`setting <key> <value>`)}\n` +
        `${LINE}`
    );
}

module.exports = {
    name: "setting",
    aliases: ["settings", "sysset", "sysc"],
    category: "admin",
    role: 2,
    description: "View and toggle system settings",
    usage: "setting | setting <key> | setting <key> <value>",

    async code(ctx) {
        const key   = (ctx.args[0] || "").toLowerCase();
        const value = ctx.args.slice(1).join(" ").trim();

        if (!key || key === "list") {
            return ctx.reply(buildStatusList(config.system));
        }

        const boolKey = Object.keys(ALL_BOOLEANS).find(k => k.toLowerCase() === key);
        const valKey  = Object.keys(VALUE_SETTINGS).find(k => k.toLowerCase() === key);

        if (!boolKey && !valKey) {
            const allKeys = [...Object.keys(ALL_BOOLEANS), ...Object.keys(VALUE_SETTINGS)]
                .map(k => formatter.inlineCode(k)).join(", ");
            return ctx.reply(tools.msg.info(`❌ Unknown setting: ${formatter.inlineCode(key)}\n\nAvailable: ${allKeys}`));
        }

        if (boolKey) {
            let raw;
            try { raw = readSettings(); } catch (e) {
                return ctx.reply(tools.msg.info(`❌ Failed to read settings: ${e.message}`));
            }

            const prev = !!raw.system[boolKey];
            const next = !prev;
            raw.system[boolKey] = next;

            try { saveSettings(raw); } catch (e) {
                return ctx.reply(tools.msg.info(`❌ Failed to save settings: ${e.message}`));
            }

            config.system[boolKey] = next;
            if (global.botClient && boolKey === "autoRead") global.botClient.autoRead = next;

            const meta        = ALL_BOOLEANS[boolKey];
            const needRestart = boolKey in RESTART_BOOLEANS;

            await ctx.replyReact("✅");
            return ctx.reply(
                `╔══[ ⚙️ *Setting Updated* ]\n${LINE}\n` +
                `  ${meta.emoji} *${meta.label}*\n\n` +
                `  Before : ${fmtBool(prev)}\n` +
                `  After  : ${fmtBool(next)}\n\n` +
                `  📝 ${formatter.italic(meta.desc)}\n` +
                (needRestart ? `\n  ⚠️  ${formatter.italic("Restart bot to apply this change.")}\n` : "") +
                `${LINE}`
            );
        }

        if (valKey) {
            const meta = VALUE_SETTINGS[valKey];

            if (!value) {
                return ctx.reply(
                    `╔══[ ⚙️ *${meta.label}* ]\n${LINE}\n` +
                    `  ${meta.emoji} Current : ${formatter.inlineCode(String(config.system[valKey] ?? "—"))}\n` +
                    `  📝 ${formatter.italic(meta.desc)}\n` +
                    (meta.type === "number" ? `  🔢 Range  : ${meta.min} – ${meta.max} ms\n` : "") +
                    `\n  💡 Set: ${formatter.inlineCode(`setting ${valKey} <value>`)}\n` +
                    `${LINE}`
                );
            }

            let parsed = value;
            if (meta.type === "number") {
                parsed = Number(value);
                if (isNaN(parsed) || parsed < meta.min || parsed > meta.max)
                    return ctx.reply(tools.msg.info(
                        `❌ Invalid value! Must be a number between ${meta.min} and ${meta.max}.`
                    ));
            }

            let raw;
            try { raw = readSettings(); } catch (e) {
                return ctx.reply(tools.msg.info(`❌ Failed to read settings: ${e.message}`));
            }

            const prev = raw.system[valKey];
            raw.system[valKey] = parsed;

            try { saveSettings(raw); } catch (e) {
                return ctx.reply(tools.msg.info(`❌ Failed to save settings: ${e.message}`));
            }

            config.system[valKey] = parsed;

            await ctx.replyReact("✅");
            return ctx.reply(
                `╔══[ ⚙️ *Setting Updated* ]\n${LINE}\n` +
                `  ${meta.emoji} *${meta.label}*\n\n` +
                `  Before : ${formatter.inlineCode(String(prev ?? "—"))}\n` +
                `  After  : ${formatter.inlineCode(String(parsed))}\n\n` +
                `  📝 ${formatter.italic(meta.desc)}\n` +
                `${LINE}`
            );
        }
    }
};
