module.exports = {
    name: "coin",
    aliases: ["coins", "balance", "bal"],
    category: "profile",
    code: async (ctx) => {
        try {
            const target = await ctx.target(["quoted", "mentioned"]);
            const isSelf = !target?.jid || tools.cmd.areJidsSameUser(target.jid, ctx.sender.lid) || tools.cmd.areJidsSameUser(target.jid, ctx.sender.jid);

            const targetJid  = isSelf ? ctx.sender.jid  : target.jid;
            const targetName = isSelf ? ctx.sender.pushName : (target.pushName || ctx.getId(target.jid));
            const userDb     = isSelf ? ctx.db.user : ctx.getDb("users", targetJid);
            const isOwner    = isSelf ? ctx.sender.isOwner() : false;
            const isPremium  = !!userDb?.premium;

            const imgs = global.chisaImages || [];
            const randomImg = imgs.length > 0 ? imgs[Math.floor(Math.random() * imgs.length)] : null;
            const send = async (text) => {
                if (randomImg) await ctx.reply({ image: { url: randomImg }, caption: text });
                else await ctx.reply(text);
            };

            if (isOwner || isPremium) {
                const badge = isOwner ? "👑 Owner" : "💎 Premium";
                return await send(
                    `💰  *CHISA WALLET*\n\n` +
                    `👤 *User*    : ${targetName}\n` +
                    `🏅 *Status*  : ${badge}\n` +
                    `🪙 *Balance* : ∞ Unlimited`
                );
            }

            const coin      = userDb?.coin || 0;
            const now       = Date.now();
            const nextDaily = userDb?.lastClaim?.daily
                ? Math.max(0, 24 * 60 * 60 * 1000 - (now - userDb.lastClaim.daily))
                : 0;
            const dailyStr  = nextDaily <= 0
                ? "✅ Ready to claim!"
                : `⏳ ${tools.msg.convertMsToDuration(nextDaily)}`;

            const max    = 500;
            const filled = Math.round(Math.min(coin / max, 1) * 10);
            const bar    = `${"▓".repeat(filled)}${"░".repeat(10 - filled)} ${coin}/${max}`;

            await send(
                `💰  *CHISA WALLET*\n\n` +
                `👤 *User*        : ${targetName}\n` +
                `🪙 *Balance*     : *${coin}* coins\n` +
                `📊 *Progress*    : ${bar}\n` +
                `📅 *Daily Claim* : ${dailyStr}`
            );
        } catch (err) {
            await tools.cmd.handleError(ctx, err);
        }
    }
};
