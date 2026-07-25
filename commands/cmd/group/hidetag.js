module.exports = {
    name: "hidetag",
    aliases: ["h", "ht"],
    category: "group",
    role: 1,
    permissions: { group: true },
    code: async (ctx) => {
        const input = ctx.text || ctx.quoted?.body;

        try {
            await ctx.reply({
                text: input || formatter.italic("Hello everyone! — SIFAT"),
                mentionAll: true
            });
        } catch (err) {
            await tools.cmd.handleError(ctx, err);
        }
    }
};
