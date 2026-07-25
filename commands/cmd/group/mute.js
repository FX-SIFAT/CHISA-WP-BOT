module.exports = {
    name: "mute",
    category: "group",
    role: 1,
    permissions: { botAdmin: true, group: true },
    code: async (ctx) => {
        const groupDb = ctx.db.group;

        if (ctx.args[0]?.toLowerCase() === "bot") {
            if (groupDb.mutebot)
                return await ctx.reply(tools.msg.info("Bot is already muted in this group."));
            groupDb.mutebot = true;
            await groupDb.save();
            return await ctx.reply(tools.msg.info("Bot has been muted in this group."));
        }

        const target = await ctx.target(["quoted", "mentioned"]);

        if (!target.jid)
            return await ctx.reply({
                text: `${tools.msg.generateInstruction(["mention", "reply"], ["text"])}\n` +
                    `${tools.msg.generateCmdExample(ctx.used, "@8801XXXXXXXXX")}\n` +
                    tools.msg.generateNotes([
                        "Reply to a message to target the sender.",
                        `Use ${formatter.inlineCode(`${ctx.used.prefix + ctx.used.command} bot`)} to mute the bot.`
                    ]),
                mentions: ["8801XXXXXXXXX@s.whatsapp.net"]
            });

        if (tools.cmd.areJidsSameUser(target.jid, ctx.me.jid) ||
            tools.cmd.areJidsSameUser(target.jid, ctx.me.lid))
            return await ctx.reply(tools.msg.info(`Use ${formatter.inlineCode(`${ctx.used.prefix + ctx.used.command} bot`)} to mute the bot.`));

        if (await ctx.group().isOwner(target.jid))
            return await ctx.reply(tools.msg.info("Cannot mute the group owner."));

        try {
            const muteList = groupDb?.mute || [];

            if (muteList.some(jid => tools.cmd.areJidsSameUser(jid, target.jid)))
                return await ctx.reply(tools.msg.info("This user is already muted."));

            muteList.push(target.jid);
            groupDb.mute = muteList;
            await groupDb.save();

            await ctx.reply(tools.msg.info("User muted successfully!"));
        } catch (err) {
            await tools.cmd.handleError(ctx, err);
        }
    }
};
