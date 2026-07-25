module.exports = {
    name: "tagall",
    aliases: ["everyone", "all"],
    category: "group",
    role: 1,
    permissions: { group: true },
    code: async (ctx) => {
        const input = ctx.text || ctx.quoted?.body;

        try {
            const members = await ctx.group().members();

            if (!members.length)
                return await ctx.reply(tools.msg.info("No members found in this group."));

            const mentions = members.map(m => m.id);
            const tags = members.map(m => `@${ctx.getId(m.id)}`).join(" ");

            await ctx.reply({
                text: `${input || formatter.italic("Hello everyone! — SIFAT")}\n` +
                    `${"\u200E".repeat(4001)}\n` +
                    tags,
                mentions
            });
        } catch (err) {
            await tools.cmd.handleError(ctx, err);
        }
    }
};
