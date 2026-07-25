module.exports = {
    name: "add",
    category: "group",
    role: 1,
    permissions: { botAdmin: true, group: true, restrict: true },
    code: async (ctx) => {
        const target = await ctx.target(["text"]);

        if (!target.jid)
            return await ctx.reply(
                `${tools.msg.generateInstruction(["send"], ["text"])}\n` +
                tools.msg.generateCmdExample(ctx.used, "8801XXXXXXXXX")
            );

        const check = await ctx.core.onWhatsApp(target.jid);
        if (!check?.[0]?.exists)
            return await ctx.reply(tools.msg.info("This number is not registered on WhatsApp."));

        const members = await ctx.group().members();
        if (members.some(m => tools.cmd.areJidsSameUser(m.id, target.jid)))
            return await ctx.reply(tools.msg.info("This user is already a member of the group."));

        const pendings = await ctx.group().pendingMembers().catch(() => []);
        if (pendings.some(p => tools.cmd.areJidsSameUser(p.jid, target.jid)))
            return await ctx.reply(tools.msg.info("This user already has a pending join request."));

        try {
            await ctx.group().add(target.jid);
            await ctx.reply(tools.msg.info("Member added successfully!"));
        } catch (err) {
            await tools.cmd.handleError(ctx, err);
        }
    }
};
