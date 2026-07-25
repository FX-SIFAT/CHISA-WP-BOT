module.exports = {
    name: "tagme",
    category: "group",
    permissions: { group: true },
    code: async (ctx) => {
        try {
            const input = ctx.text;
            const tag = `@${ctx.getId(ctx.sender.jid)}`;

            await ctx.reply({
                text: input ? `${tag} ${input}` : tag,
                mentions: [ctx.sender.jid]
            });
        } catch (err) {
            await tools.cmd.handleError(ctx, err);
        }
    }
};
