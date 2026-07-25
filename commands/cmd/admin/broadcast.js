"use strict";

const fs   = require("node:fs");
const LINE = "─".repeat(32);

module.exports = {
    name: "broadcast",
    aliases: ["bc", "bcht", "bcgc", "broadcastgc"],
    category: "admin",
    role: 2,
    description: "Broadcast a message to all groups",
    usage: "broadcast <text> | broadcast blacklist (in group)",

    async code(ctx) {
        const input = ctx.text || ctx.quoted?.body;
        const botDb = ctx.db.bot;

        if ((ctx.args[0] || "").toLowerCase() === "blacklist") {
            if (!ctx.isGroup())
                return ctx.reply(tools.msg.info("⚠️ Use this in a group to toggle its blacklist status."));

            const blacklist = botDb?.blacklistBroadcast || [];
            const idx = blacklist.indexOf(ctx.id);

            if (idx > -1) {
                blacklist.splice(idx, 1);
                botDb.blacklistBroadcast = blacklist;
                botDb.save();
                return ctx.reply(tools.msg.info("✅ This group has been *removed* from the broadcast blacklist."));
            } else {
                blacklist.push(ctx.id);
                botDb.blacklistBroadcast = blacklist;
                botDb.save();
                return ctx.reply(tools.msg.info("🚫 This group has been *added* to the broadcast blacklist."));
            }
        }

        if (!input)
            return ctx.reply(
                `╔══[ 📢 *Broadcast* ]\n${LINE}\n` +
                `${tools.msg.generateInstruction(["send"], ["text"])}\n` +
                `${tools.msg.generateCmdExample(ctx.used, "Hello everyone!")}\n` +
                `${tools.msg.generateNotes([
                    "Reply to a message to use its text.",
                    `Use ${formatter.inlineCode(`${ctx.used.prefix + ctx.used.command} blacklist`)} in a group to toggle blacklist.`,
                    `Use alias ${formatter.inlineCode(`${ctx.used.prefix}bcht`)} to mention all members.`
                ])}\n${LINE}`
            );

        try {
            const blacklist = botDb?.blacklistBroadcast || [];
            const allGroups = await ctx.core.groupFetchAllParticipating();
            const groupJids = Object.values(allGroups)
                .filter(g => !blacklist.includes(g.id) && !g.announce && !g.isCommunity && !g.isCommunityAnnounce)
                .map(g => g.id);

            if (!groupJids.length)
                return ctx.reply(tools.msg.info("⚠️ No eligible groups to broadcast to."));

            const { delay, duration } = tools.cmd.calculateDelay(groupJids.length);
            const mentionAll = ctx.used.command === "bcht";

            const waitMsg = await ctx.reply(
                `╔══[ 📢 *Broadcast Started* ]\n${LINE}\n` +
                `  📦 Groups : ${groupJids.length}\n` +
                `  ⏱️  ETA    : ${tools.msg.convertMsToDuration(duration)}\n` +
                `  🔔 Mention: ${mentionAll ? "Yes (all members)" : "No"}\n` +
                `${LINE}`
            );

            let sent = 0, failed = 0;
            const thumbnail = global.thumbnailPath
                ? fs.readFileSync(global.thumbnailPath)
                : { url: config.bot.thumbnail };

            for (const groupJid of groupJids) {
                try {
                    await ctx.sendMessage(groupJid, {
                        image: thumbnail,
                        caption: input,
                        footer: config.msg.footer,
                        ...(mentionAll && { mentionAll: true }),
                        buttons: [
                            { text: "📋 Menu",          id: `${ctx.used.prefix}menu` },
                            { text: "📞 Contact Owner", id: `${ctx.used.prefix}owner` }
                        ]
                    });
                    sent++;
                } catch { failed++; }
                await tools.cmd.delay(delay);
            }

            return ctx.editMessage(ctx.id, waitMsg.key,
                `╔══[ 📢 *Broadcast Complete* ]\n${LINE}\n` +
                `  ✅ Sent   : ${sent}\n` +
                `  ❌ Failed : ${failed}\n` +
                `  📦 Total  : ${groupJids.length}\n` +
                `${LINE}`
            );
        } catch (e) { return tools.cmd.handleError(ctx, e); }
    }
};
