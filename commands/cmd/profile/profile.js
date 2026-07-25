function xpBar(xp, max = 100, width = 14) {
    const pct    = Math.min(xp / Math.max(max, 1), 1);
    const filled = Math.round(pct * width);
    return `${"▓".repeat(filled)}${"░".repeat(width - filled)}`;
}

module.exports = {
    name: "profile",
    aliases: ["me", "prof"],
    category: "profile",
    code: async (ctx) => {
        try {
            const target = await ctx.target(["quoted", "mentioned"]);
            const isSelf = !target?.jid
                || tools.cmd.areJidsSameUser(target.jid, ctx.sender.lid)
                || tools.cmd.areJidsSameUser(target.jid, ctx.sender.jid);

            const targetJid  = isSelf ? ctx.sender.jid : target.jid;
            const targetLid  = isSelf ? ctx.sender.lid : target.jid;
            const targetName = isSelf ? ctx.sender.pushName : (target.pushName || ctx.getId(target.jid));

            const users  = ctx.db.users.getAll();
            const userDb = isSelf ? ctx.db.user : ctx.getDb("users", targetJid);

            const ranked = users
                .map(u => ({ jid: u.jid, level: u.level || 0, winGame: u.winGame || 0, xp: u.xp || 0 }))
                .sort((a, b) => b.winGame - a.winGame || b.level - a.level || b.xp - a.xp);
            const rank      = ranked.findIndex(u => tools.cmd.areJidsSameUser(u.jid, targetLid)) + 1 || ranked.length + 1;

            const isOwner   = isSelf ? ctx.sender.isOwner() : false;
            const isPremium = !!userDb?.premium;
            const level     = userDb?.level   || 0;
            const xp        = userDb?.xp      || 0;
            const wins      = userDb?.winGame || 0;
            const coins     = isOwner || isPremium ? "∞" : (userDb?.coin || 0);

            let badge = "Free";
            if (isOwner) badge = "👑 Owner";
            else if (isPremium) {
                const exp = userDb?.premiumExpiration;
                badge = exp ? `⭐ Premium (${tools.msg.convertMsToDuration(exp - Date.now(), ["days", "hours"])} left)` : "⭐ Premium";
            }

            let afkLine = "";
            if (userDb?.afk) {
                const elapsed = tools.msg.convertMsToDuration(Date.now() - userDb.afk.timestamp);
                afkLine = `\n💤 *AFK*      ${elapsed}${userDb.afk.reason ? ` — ${userDb.afk.reason}` : ""}`;
            }

            const bar = xpBar(xp);
            const text =
                `👤  *USER PROFILE*\n\n` +
                `🏷️  *${targetName}*\n` +
                `🎫  ${badge}  •  Rank *#${rank}*\n\n` +
                `🔰  *Level*    ${level}\n` +
                `✨  *XP*       ${xp} / 100\n` +
                `    ${bar}\n` +
                `🪙  *Coins*    ${coins}\n` +
                `🏆  *Wins*     ${wins}` +
                afkLine;

            const ppUrl = await ctx.profilePictureUrl(targetJid).catch(() => null);
            if (ppUrl) await ctx.reply({ image: { url: ppUrl }, caption: text });
            else {
                const imgs = global.chisaImages || [];
                const randomImg = imgs.length > 0 ? imgs[Math.floor(Math.random() * imgs.length)] : null;
                if (randomImg) await ctx.reply({ image: { url: randomImg }, caption: text });
                else await ctx.reply(text);
            }
        } catch (err) {
            await tools.cmd.handleError(ctx, err);
        }
    }
};
