const RANK_MEDALS = ["🥇", "🥈", "🥉"];

module.exports = {
    name: "leaderboard",
    aliases: ["lb", "top"],
    category: "profile",
    code: async (ctx) => {
        try {
            const users = ctx.db.users.getAll();
            const senderLid = ctx.sender.lid;

            if (!users.length)
                return await ctx.reply(tools.msg.info("No users found in the database."));

            const ranked = users
                .map(u => ({
                    jid: u.jid,
                    pushName: u.pushName || ctx.getId(u.jid),
                    level: u.level || 0,
                    winGame: u.winGame || 0,
                    xp: u.xp || 0
                }))
                .sort((a, b) => b.winGame - a.winGame || b.level - a.level || b.xp - a.xp);

            const selfRankIdx = ranked.findIndex(u => tools.cmd.areJidsSameUser(u.jid, senderLid));
            const selfRank = selfRankIdx + 1;
            const topUsers = ranked.slice(0, 10);

            const mentions = [senderLid];
            const lines = topUsers.map((u, i) => {
                const isSelf = tools.cmd.areJidsSameUser(u.jid, senderLid);
                const medal = RANK_MEDALS[i] || `${i + 1}.`;
                const name = isSelf ? `@${ctx.getId(senderLid)}` : u.pushName;
                if (isSelf) mentions.push(senderLid);
                return `${medal} ${name} — Wins: ${u.winGame} | Lv.${u.level}`;
            });

            if (selfRank > 10 && selfRankIdx !== -1) {
                const self = ranked[selfRankIdx];
                lines.push(`\n· · ·\n${selfRank}. @${ctx.getId(senderLid)} — Wins: ${self.winGame} | Lv.${self.level} ${formatter.italic("(You)")}`);
            }

            await ctx.reply({
                text: `${formatter.bold("🏆 Leaderboard")}\n\n` + lines.join("\n"),
                mentions: [...new Set(mentions)]
            });
        } catch (err) {
            await tools.cmd.handleError(ctx, err);
        }
    }
};
