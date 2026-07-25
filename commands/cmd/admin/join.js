"use strict";

const fs   = require("node:fs");
const LINE = "─".repeat(32);

module.exports = {
    name: "join",
    aliases: ["joingroup", "j"],
    category: "admin",
    role: 2,
    description: "Join a group via invite link",
    usage: "join <invite-link>",

    async code(ctx) {
        const url = ctx.args[0] || tools.cmd.extractUrlFromText(ctx.quoted?.body);

        if (!url)
            return ctx.reply(
                `╔══[ 🔗 *Join Group* ]\n${LINE}\n` +
                `${tools.msg.generateInstruction(["send"], ["text"])}\n` +
                `${tools.msg.generateCmdExample(ctx.used, config.bot.groupLink || "https://chat.whatsapp.com/xxx")}\n` +
                `${tools.msg.generateNotes(["Reply to a message containing an invite link."])}\n` +
                `${LINE}`
            );

        if (!tools.cmd.isUrl(url))
            return ctx.reply(tools.msg.info("❌ Invalid URL! Please provide a valid WhatsApp group invite link."));

        try {
            await ctx.replyReact("⏳");
            const urlCode = new URL(url).pathname.split("/").pop();
            const groupJid = await ctx.groups.acceptInvite(urlCode);

            if (groupJid) {
                const thumbnail = global.thumbnailPath
                    ? fs.readFileSync(global.thumbnailPath)
                    : { url: config.bot.thumbnail };

                await ctx.sendMessage(groupJid, {
                    image: thumbnail,
                    caption: `>ᴗ< ${formatter.italic(`Hello! I am *${config.bot.name}*, owned by *${config.owner.name}*. I can help with many things — try my commands!`)}`,
                    footer: config.msg.footer,
                    nativeFlow: [
                        { text: "📋 Menu",          id: `${ctx.used.prefix}menu` },
                        { text: "📞 Contact Owner", id: `${ctx.used.prefix}owner` }
                    ]
                });
            }

            await ctx.replyReact("✅");
            return ctx.reply(
                `╔══[ 🔗 *Joined Group* ]\n${LINE}\n` +
                `  ✅ Successfully joined!\n` +
                `  🔗 Link: ${formatter.inlineCode(url)}\n` +
                `${LINE}`
            );
        } catch (e) { return tools.cmd.handleError(ctx, e); }
    }
};
