module.exports = {
    name: "kick",
    aliases: ["remove", "out"],
    category: "group",
    role: 1,
    permissions: { botAdmin: true, group: true, restrict: true },
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
            return await ctx.reply(tools.msg.info("Cannot kick myself."));

        if (await ctx.group().isOwner(target.jid))
            return await ctx.reply(tools.msg.info("Cannot kick the group owner."));

        if (await ctx.group().isAdmin(target.jid))
            return await ctx.reply(tools.msg.info("Cannot kick an admin. Demote them first."));

        const members = await ctx.group().members();
        if (!members.some(m => tools.cmd.areJidsSameUser(m.id, target.jid)))
            return await ctx.reply(tools.msg.info("This user is not in the group."));

        try {
            await ctx.group().kick(target.jid);
            await ctx.reply(tools.msg.info("Member removed successfully!"));
        } catch (err) {
            await tools.cmd.handleError(ctx, err);
        }
    }
};
