"use strict";

module.exports = [
    {
        name: "github",
        aliases: ["ghstalker", "gitstalker", "ghinfo"],
        category: "tool",
        usage: "github <username>",
        async code(ctx) {
            try {
                const username = ctx.text?.trim();
                if (!username) {
                    return ctx.reply(
                        `${tools.msg.generateInstruction(["send"], ["text"])}\n` +
                        `${tools.msg.generateCmdExample(ctx.used, "FX-SIFAT")}`
                    );
                }
                await ctx.replyReact("🔍");
                const d = await tools.api.get("/api/stalker/github", { username });
                const u = d.user;
                const p = u.profile;
                const s = u.stats || {};
                const caption =
                    `🐙 ${formatter.bold(u.nickname || u.username)} (@${u.username})\n` +
                    `🔗 ${p.url}\n\n` +
                    (p.bio ? `📝 ${formatter.italic(p.bio)}\n\n` : "") +
                    (p.location ? `📍 ${p.location}\n` : "") +
                    (p.blog ? `🌐 ${p.blog}\n` : "") +
                    `\n` +
                    `📦 ${formatter.bold("Repos")}    : ${s.public_repos ?? "—"}\n` +
                    `👥 ${formatter.bold("Followers")}: ${s.followers ?? "—"}\n` +
                    `➡️ ${formatter.bold("Following")}: ${s.following ?? "—"}`;
                await ctx.replyReact("✅");
                if (p.avatar) {
                    try {
                        const r = await axios.get(p.avatar, { responseType: "arraybuffer", timeout: 20_000 });
                        return ctx.reply({ image: Buffer.from(r.data), caption });
                    } catch {}
                }
                await ctx.reply(caption);
            } catch (e) {
                await ctx.replyReact("❌");
                await tools.cmd.handleError(ctx, e);
            }
        }
    },
    {
        name: "ffstalker",
        aliases: ["ffstalk", "ffinfo", "freefire", "ffuid"],
        category: "tool",
        usage: "ffstalker <uid>",
        async code(ctx) {
            try {
                const uid = ctx.text?.trim();
                if (!uid || isNaN(uid)) {
                    return ctx.reply(
                        `${tools.msg.generateInstruction(["send"], ["text"])}\n` +
                        `${tools.msg.generateCmdExample(ctx.used, "123456789")}`
                    );
                }
                await ctx.replyReact("🔍");
                const d = await tools.api.get("/api/stalker/freefire", { user_id: uid });
                const info = d.result?.profile?.basicinfo || {};
                const clan = d.result?.profile?.clanbasicinfo || {};
                await ctx.replyReact("✅");
                await ctx.reply(
                    `🎮 ${formatter.bold("Free Fire Profile")}\n\n` +
                    `👤 ${formatter.bold("Name")}   : ${info.nickname || "—"}\n` +
                    `🆔 ${formatter.bold("UID")}    : ${info.accountid || uid}\n` +
                    `⭐ ${formatter.bold("Level")}  : ${info.level || "—"}\n` +
                    `🌍 ${formatter.bold("Region")} : ${info.region || "—"}\n` +
                    `❤️ ${formatter.bold("Likes")}  : ${(info.liked || 0).toLocaleString()}\n` +
                    `🏆 ${formatter.bold("Rank")}   : ${info.rank || "—"}\n` +
                    (clan.clanname ? `🛡️ ${formatter.bold("Clan")}   : ${clan.clanname}` : "")
                );
            } catch (e) {
                await ctx.replyReact("❌");
                await tools.cmd.handleError(ctx, e);
            }
        }
    }
];
