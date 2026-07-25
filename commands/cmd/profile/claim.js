const CLAIM_REWARDS = {
    daily:   { reward: 100,   cooldown: 24 * 60 * 60 * 1000,         level: 1  },
    weekly:  { reward: 500,   cooldown: 7 * 24 * 60 * 60 * 1000,     level: 15 },
    monthly: { reward: 2000,  cooldown: 30 * 24 * 60 * 60 * 1000,    level: 50 },
    yearly:  { reward: 10000, cooldown: 365 * 24 * 60 * 60 * 1000,   level: 75 }
};

module.exports = {
    name: "claim",
    aliases: ["bonus"],
    category: "profile",
    code: async (ctx) => {
        const input = ctx.args[0]?.toLowerCase();

        if (!input)
            return await ctx.reply(
                `${tools.msg.generateInstruction(["send"], ["text"])}\n` +
                `${tools.msg.generateCmdExample(ctx.used, "daily")}\n` +
                tools.msg.generateNotes([
                    `Use ${formatter.inlineCode(`${ctx.used.prefix + ctx.used.command} list`)} to see all reward types.`
                ])
            );

        if (input === "list")
            return await ctx.reply(await tools.list.get("claim"));

        if (input === "status") {
            const senderDb = ctx.db.user;
            const now = Date.now();
            const lines = Object.entries(CLAIM_REWARDS).map(([type, cfg]) => {
                const last = (senderDb?.lastClaim ?? {})[type] || 0;
                const remaining = cfg.cooldown - (now - last);
                const ready = remaining <= 0;
                return `➛ ${formatter.bold(type.charAt(0).toUpperCase() + type.slice(1))}: ${ready ? "✅ Ready" : `⏳ ${tools.msg.convertMsToDuration(remaining)}`} | +${cfg.reward} coins | Lv.${cfg.level}`;
            });
            return await ctx.reply(
                `${formatter.bold("Claim Status")}\n\n` + lines.join("\n")
            );
        }

        const claim = CLAIM_REWARDS[input];
        if (!claim)
            return await ctx.reply(tools.msg.info(`"${input}" is not a valid reward type. Use ${formatter.inlineCode(`${ctx.used.prefix + ctx.used.command} list`)} to see options.`));

        if (ctx.sender.isOwner())
            return await ctx.reply(tools.msg.info("You already have unlimited coins!"));

        const senderDb = ctx.db.user;
        const level = senderDb?.level || 0;

        if (level < claim.level)
            return await ctx.reply(tools.msg.info(`You need to be at least level ${formatter.inlineCode(claim.level)} to claim this reward. Current level: ${formatter.inlineCode(level)}.`));

        const now = Date.now();
        const lastClaim = (senderDb?.lastClaim ?? {})[input] || 0;
        const remaining = claim.cooldown - (now - lastClaim);

        if (remaining > 0)
            return await ctx.reply(tools.msg.info(`You already claimed ${formatter.inlineCode(input)}. Next claim in: ${formatter.bold(tools.msg.convertMsToDuration(remaining))}.`));

        try {
            const newBalance = (senderDb?.coin || 0) + claim.reward;
            senderDb.coin = newBalance;
            (senderDb.lastClaim ??= {})[input] = now;
            await senderDb.save();

            await ctx.reply(tools.msg.info(
                `Successfully claimed ${formatter.bold(input)} reward!\n` +
                `➛ Received: ${formatter.bold(`+${claim.reward} coins`)}\n` +
                `➛ Balance: ${formatter.bold(newBalance)} coins`
            ));
        } catch (err) {
            await tools.cmd.handleError(ctx, err);
        }
    }
};
