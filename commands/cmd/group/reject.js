module.exports = {
    name: "reject",
    category: "group",
    role: 1,
    permissions: { botAdmin: true, group: true },
    code: async (ctx) => {
        const pendings = await ctx.group().pendingMembers();

        if (!pendings.length)
            return await ctx.reply(tools.msg.info("No pending members found."));

        if (ctx.args[0]?.toLowerCase() === "all") {
            try {
                const jids = pendings.map(p => p.jid);
                await ctx.group().rejectPendingMembers(jids);
                return await ctx.reply(tools.msg.info(`Rejected all ${jids.length} pending member${jids.length !== 1 ? "s" : ""}!`));
            } catch (err) {
                return await tools.cmd.handleError(ctx, err);
            }
        }

        const target = await ctx.target(["text"]);

        if (!target.jid)
            return await ctx.reply(
                `${tools.msg.generateInstruction(["send"], ["text"])}\n` +
                `${tools.msg.generateCmdExample(ctx.used, "8801XXXXXXXXX")}\n` +
                tools.msg.generateNotes([
                    `Use ${formatter.inlineCode(`${ctx.used.prefix + ctx.used.command} all`)} to reject all ${pendings.length} pending member${pendings.length !== 1 ? "s" : ""}.`
                ])
            );

        if (!pendings.some(p => tools.cmd.areJidsSameUser(p.jid, target.jid)))
            return await ctx.reply(tools.msg.info("This user is not in the pending list."));

        try {
            await ctx.group().rejectPendingMembers(target.jid);
            await ctx.reply(tools.msg.info("Member rejected successfully!"));
        } catch (err) {
            await tools.cmd.handleError(ctx, err);
        }
    }
};
