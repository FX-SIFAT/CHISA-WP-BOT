module.exports = {
    name: "intro",
    category: "group",
    permissions: { botAdmin: true, group: true },
    code: async (ctx) => {
        try {
            const introText = ctx.db.group?.text?.intro;

            if (!introText)
                return await ctx.reply(tools.msg.info(
                    `No intro has been set for this group. Use ${formatter.inlineCode(`${ctx.used.prefix}settext intro <text>`)} to set one.`
                ));

            await ctx.reply(introText);
        } catch (err) {
            await tools.cmd.handleError(ctx, err);
        }
    }
};
