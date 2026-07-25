module.exports = {
    name: "demote",
    category: "group",
    role: 1,
    permissions: { botAdmin: true, group: true },
    code: async (ctx) => {
        const target = await ctx.target(["quoted", "mentioned"]);

        if (!target.jid)
            return await ctx.reply({
                text: `${tools.msg.generateInstruction(["mention", "reply"], ["text"])}\n` +
                    `${tools.msg.generateCmdExample(ctx.used, "@8801XXXXXXXXX")}\n` +
                    tools.msg.generateNotes(["Reply to a message to target the sender."]),
                mentions: ["8801XXXXXXXXX@s.whatsapp.net"]
            });

        if (tools.cmd.areJidsSameUser(target.jid, ctx.me.jid) ||
            tools.cmd.areJidsSameUser(target.jid, ctx.me.lid))
            return await ctx.reply(tools.msg.info("Cannot demote the bot itself."));

        if (await ctx.group().isOwner(target.jid))
            return await ctx.reply(tools.msg.info("Cannot demote the group owner."));

        if (!await ctx.group().isAdmin(target.jid))
            return await ctx.reply(tools.msg.info("This user is not an admin."));

        try {
            await ctx.group().demote(target.jid);
            await ctx.reply(tools.msg.info("Successfully demoted to regular member!"));
        } catch (err) {
            await tools.cmd.handleError(ctx, err);
        }
    }
};
