module.exports = {
    name: "reset",
    category: "profile",
    permissions: { private: true },
    code: async (ctx) => {
        const input = ctx.args[0]?.toLowerCase();

        try {
            if (input === "y" || input === "yes") {
                const usersDb = ctx.db.users;
                usersDb.remove(u => tools.cmd.areJidsSameUser(u.jid, ctx.sender.lid));
                return await ctx.reply(tools.msg.info("Your profile data has been successfully reset!"));
            }

            if (input === "n" || input === "no")
                return await ctx.reply(tools.msg.info("Reset cancelled. Your data is safe."));

            await ctx.reply({
                text: tools.msg.info(
                    `⚠️ ${formatter.bold("Profile Reset Warning")}\n\n` +
                    "This will permanently delete all your stored data including coins, level, XP, wins, and settings. This action cannot be undone.\n\n" +
                    `Reply with ${formatter.inlineCode(`${ctx.used.prefix + ctx.used.command} y`)} to confirm or ${formatter.inlineCode(`${ctx.used.prefix + ctx.used.command} n`)} to cancel.`
                ),
                buttons: [
                    { text: "Yes, reset", id: `${ctx.used.prefix + ctx.used.command} y` },
                    { text: "No, cancel", id: `${ctx.used.prefix + ctx.used.command} n` }
                ]
            });
        } catch (err) {
            await tools.cmd.handleError(ctx, err);
        }
    }
};
