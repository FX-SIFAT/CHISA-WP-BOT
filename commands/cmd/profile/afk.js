module.exports = {
    name: "afk",
    category: "profile",
    code: async (ctx) => {
        try {
            const target = await ctx.target(["quoted", "mentioned"]);
            const isSelf = !target?.jid || tools.cmd.areJidsSameUser(target.jid, ctx.sender.lid) || tools.cmd.areJidsSameUser(target.jid, ctx.sender.jid);

            if (!isSelf) {
                const targetJid  = target.jid;
                const targetName = target.pushName || ctx.getId(targetJid);
                const targetDb   = ctx.getDb("users", targetJid);

                if (!targetDb?.afk)
                    return await ctx.reply(tools.msg.info(`${formatter.bold(targetName)} is not AFK.`));

                const elapsed = tools.msg.convertMsToDuration(Date.now() - targetDb.afk.timestamp);
                return await ctx.reply(tools.msg.info(
                    `${formatter.bold(targetName)} is AFK for ${formatter.bold(elapsed)}` +
                    (targetDb.afk.reason ? ` — Reason: ${formatter.inlineCode(targetDb.afk.reason)}` : ".")
                ));
            }

            const input     = ctx.text;
            const senderDb  = ctx.db.user;

            if (senderDb?.afk) {
                const elapsed = tools.msg.convertMsToDuration(Date.now() - senderDb.afk.timestamp);
                const reason  = senderDb.afk.reason;
                senderDb.afk  = null;
                await senderDb.save();
                return await ctx.reply(tools.msg.info(
                    `Welcome back! You were AFK for ${formatter.bold(elapsed)}${reason ? ` — Reason: ${formatter.inlineCode(reason)}` : ""}.`
                ));
            }

            senderDb.afk = { reason: input || null, timestamp: Date.now() };
            await senderDb.save();
            await ctx.reply(tools.msg.info(
                `You are now AFK${input ? ` — Reason: ${formatter.inlineCode(input)}` : " without a reason"}.`
            ));
        } catch (err) {
            await tools.cmd.handleError(ctx, err);
        }
    }
};
