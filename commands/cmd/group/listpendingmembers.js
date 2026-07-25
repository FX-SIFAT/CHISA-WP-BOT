module.exports = {
    name: "listpendingmembers",
    aliases: ["pendingmembers", "pending"],
    category: "group",
    role: 1,
    permissions: { botAdmin: true, group: true },
    code: async (ctx) => {
        try {
            const pendings = await ctx.group().pendingMembers();

            if (!pendings.length)
                return await ctx.reply(tools.msg.info("No pending members found."));

            const mentions = pendings.map(p => p.jid);
            const text =
                `${formatter.bold(`Pending Members (${pendings.length})`)}\n\n` +
                pendings.map((p, i) => `${i + 1}. @${ctx.getId(p.jid)}`).join("\n") +
                `\n\n` +
                tools.msg.generateNotes([
                    `Use ${formatter.inlineCode(`${ctx.used.prefix}approve all`)} to approve all.`,
                    `Use ${formatter.inlineCode(`${ctx.used.prefix}reject all`)} to reject all.`
                ]);

            await ctx.reply({ text, mentions });
        } catch (err) {
            await tools.cmd.handleError(ctx, err);
        }
    }
};
