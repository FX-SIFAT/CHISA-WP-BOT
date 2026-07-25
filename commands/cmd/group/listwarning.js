module.exports = {
    name: "listwarning",
    aliases: ["listwarn", "warnlist"],
    category: "group",
    role: 1,
    permissions: { botAdmin: true, group: true },
    code: async (ctx) => {
        try {
            const groupDb = ctx.db.group;
            const warnings = groupDb?.warnings || [];

            if (!warnings.length)
                return await ctx.reply(tools.msg.info("No warnings recorded in this group."));

            const maxWarn = groupDb?.maxwarnings || 3;
            const mentions = warnings.map(w => w.jid);
            const text =
                `${formatter.bold(`Warning List (${warnings.length} user${warnings.length !== 1 ? "s" : ""} | Limit: ${maxWarn})`)}\n\n` +
                warnings
                    .sort((a, b) => b.count - a.count)
                    .map((w, i) => `${i + 1}. @${ctx.getId(w.jid)} — ${w.count}/${maxWarn}`)
                    .join("\n");

            await ctx.reply({ text, mentions });
        } catch (err) {
            await tools.cmd.handleError(ctx, err);
        }
    }
};
