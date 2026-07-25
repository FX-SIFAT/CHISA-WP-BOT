module.exports = {
    name: "unmute",
    category: "group",
    role: 1,
    permissions: { botAdmin: true, group: true },
    code: async (ctx) => {
        const groupDb = ctx.db.group;

        if (ctx.args[0]?.toLowerCase() === "bot") {
            if (!groupDb.mutebot)
                return await ctx.reply(tools.msg.info("Bot is not currently muted in this group."));
            groupDb.mutebot = false;
            await groupDb.save();
            return await ctx.reply(tools.msg.info("Bot has been unmuted in this group."));
        }

        const target = await ctx.target(["quoted", "mentioned"]);

        if (!target.jid)
            return await ctx.reply({
                text: `${tools.msg.generateInstruction(["mention", "reply"], ["text"])}\n` +
                    `${tools.msg.generateCmdExample(ctx.used, "@8801XXXXXXXXX")}\n` +
                    tools.msg.generateNotes([
                        "Reply to a message to target the sender.",
                        `Use ${formatter.inlineCode(`${ctx.used.prefix + ctx.used.command} bot`)} to unmute the bot.`
                    ]),
                mentions: ["8801XXXXXXXXX@s.whatsapp.net"]
            });

        if (tools.cmd.areJidsSameUser(target.jid, ctx.me.jid) ||
            tools.cmd.areJidsSameUser(target.jid, ctx.me.lid))
            return await ctx.reply(tools.msg.info(`Use ${formatter.inlineCode(`${ctx.used.prefix + ctx.used.command} bot`)} to unmute the bot.`));

        try {
            const muteList = groupDb?.mute || [];
            const idx = muteList.findIndex(jid => tools.cmd.areJidsSameUser(jid, target.jid));

            if (idx === -1)
                return await ctx.reply(tools.msg.info("This user is not in the mute list."));

            muteList.splice(idx, 1);
            groupDb.mute = muteList;
            await groupDb.save();

            await ctx.reply(tools.msg.info("User unmuted successfully!"));
        } catch (err) {
            await tools.cmd.handleError(ctx, err);
        }
    }
};
