function getTier(level) {
    if (level >= 50) return "👑 LEGEND";
    if (level >= 30) return "💎 DIAMOND";
    if (level >= 20) return "💠 PLATINUM";
    if (level >= 10) return "🥇 GOLD";
    if (level >= 5)  return "🥈 SILVER";
    return                   "🥉 BRONZE";
}

function xpBar(xp, maxXp, width = 14) {
    const pct    = Math.min(xp / Math.max(maxXp, 1), 1);
    const filled = Math.round(pct * width);
    return `${"▓".repeat(filled)}${"░".repeat(width - filled)} ${Math.round(pct * 100)}%`;
}

module.exports = {
    name: "rank",
    aliases: ["level", "xp", "score"],
    category: "profile",
    code: async (ctx) => {
        try {
            const target  = await ctx.target(["quoted", "mentioned"]);
            const isSelf  = !target?.jid
                || tools.cmd.areJidsSameUser(target.jid, ctx.sender.lid)
                || tools.cmd.areJidsSameUser(target.jid, ctx.sender.jid);

            const targetJid  = isSelf ? ctx.sender.jid  : target.jid;
            const targetLid  = isSelf ? ctx.sender.lid  : target.jid;
            const targetName = isSelf ? ctx.sender.pushName : (target.pushName || ctx.getId(target.jid));
            const userDb     = isSelf ? ctx.db.user : ctx.getDb("users", targetJid);
            const isOwner    = isSelf && ctx.sender.isOwner();
            const isPremium  = !!userDb?.premium;

            const level = userDb?.level   || 0;
            const xp    = userDb?.xp      || 0;
            const wins  = userDb?.winGame || 0;

            const users  = ctx.db.users.getAll();
            const ranked = users
                .map(u => ({ jid: u.jid, winGame: u.winGame || 0, level: u.level || 0, xp: u.xp || 0 }))
                .sort((a, b) => b.winGame - a.winGame || b.level - a.level || b.xp - a.xp);
            const rankPos = ranked.findIndex(u => tools.cmd.areJidsSameUser(u.jid, targetLid)) + 1 || ranked.length + 1;

            const tier  = getTier(level);
            let badge   = "🟢 Free";
            if (isOwner)   badge = "👑 Owner";
            else if (isPremium) badge = "⭐ Premium";

            const text =
                `🏆  *RANK CARD*\n\n` +
                `👤 *${targetName}*\n` +
                `🎖️ ${tier}  •  ${badge}\n\n` +
                `🌐 *Rank*    #${rankPos} of ${users.length}\n` +
                `🔰 *Level*   ${level}\n` +
                `🏆 *Wins*    ${wins}\n\n` +
                `✨ *XP Progress*\n` +
                `${xpBar(xp, 100)}  (${xp}/100)`;

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
