"use strict";

module.exports = [
    {
        name: "sing",
        aliases: ["spplay", "ytplay", "mp3", "song", "music", "audio"],
        category: "downloader",
        usage: "sing <song name or YouTube URL>",
        permissions: { coin: 10 },
        async code(ctx) {
            try {
                const query = ctx.text?.trim();
                if (!query) {
                    return ctx.reply(
                        `${tools.msg.generateInstruction(["send"], ["text"])}\n` +
                        `${tools.msg.generateCmdExample(ctx.used, "shape of you")}`
                    );
                }
                await ctx.replyReact("🎵");
                const d = await tools.api.get("/api/play/sing", { query });
                if (!d.download) {
                    await ctx.replyReact("❌");
                    return ctx.reply(tools.msg.info(config.msg.notFound));
                }
                await ctx.reply(
                    `🎵 ${formatter.bold(d.title || "—")}\n` +
                    `👤 ${d.author || "—"}\n` +
                    `👁️ ${Number(d.views || 0).toLocaleString()} views · ❤️ ${Number(d.likes || 0).toLocaleString()}`
                );
                await ctx.replyReact("📥");
                const r = await axios.get(d.download, {
                    responseType: "arraybuffer",
                    timeout: 120_000,
                    maxContentLength: 100 * 1024 * 1024
                });
                const buf = Buffer.from(r.data);
                if (buf.length < 1024) {
                    await ctx.replyReact("❌");
                    return ctx.reply(tools.msg.info("Download failed. Try another song."));
                }
                await ctx.replyReact("✅");
                await ctx.reply({ audio: buf, mimetype: "audio/mpeg", ptt: false });
            } catch (e) {
                await ctx.replyReact("❌");
                await tools.cmd.handleError(ctx, e);
            }
        }
    },
    {
        name: "spotifydl",
        aliases: ["spdl", "spotifydown", "spdltrack"],
        category: "downloader",
        usage: "spotifydl <song name or Spotify URL>",
        permissions: { coin: 10 },
        async code(ctx) {
            try {
                const query = ctx.text?.trim();
                if (!query) {
                    return ctx.reply(
                        `${tools.msg.generateInstruction(["send"], ["text"])}\n` +
                        `${tools.msg.generateCmdExample(ctx.used, "blinding lights")}`
                    );
                }
                await ctx.replyReact("🎧");
                const d = await tools.api.get("/api/play/spotifydl", { query });
                const dlUrl = d.download || d.url || d.audio;
                if (!dlUrl) {
                    await ctx.replyReact("❌");
                    return ctx.reply(tools.msg.info(config.msg.notFound));
                }
                if (d.title) {
                    await ctx.reply(
                        `🎧 ${formatter.bold(d.title || "—")}\n` +
                        `👤 ${d.artist || d.author || "—"}\n` +
                        `💿 ${d.album || "—"}`
                    );
                }
                await ctx.replyReact("📥");
                const r = await axios.get(dlUrl, {
                    responseType: "arraybuffer",
                    timeout: 120_000,
                    maxContentLength: 100 * 1024 * 1024
                });
                const buf = Buffer.from(r.data);
                if (buf.length < 1024) {
                    await ctx.replyReact("❌");
                    return ctx.reply(tools.msg.info("Download failed. Try another song."));
                }
                await ctx.replyReact("✅");
                await ctx.reply({ audio: buf, mimetype: "audio/mpeg", ptt: false });
            } catch (e) {
                await ctx.replyReact("❌");
                await tools.cmd.handleError(ctx, e);
            }
        }
    },
    {
        name: "spinfo",
        aliases: ["spotifyinfo", "spfind", "spotifysearch"],
        category: "downloader",
        usage: "spinfo <song name>",
        async code(ctx) {
            try {
                const q = ctx.text?.trim();
                if (!q) {
                    return ctx.reply(
                        `${tools.msg.generateInstruction(["send"], ["text"])}\n` +
                        `${tools.msg.generateCmdExample(ctx.used, "perfect ed sheeran")}`
                    );
                }
                await ctx.replyReact("🎧");
                const d = await tools.api.get("/api/play/spotify", { q });
                const track = d.track || d.result || d;
                if (!track || (!track.title && !track.name)) {
                    await ctx.replyReact("❌");
                    return ctx.reply(tools.msg.info(config.msg.notFound));
                }
                await ctx.replyReact("✅");
                const caption =
                    `🎧 ${formatter.bold(track.title || track.name || "—")}\n` +
                    `👤 ${formatter.bold("Artist")} : ${track.artist || track.artists || "—"}\n` +
                    `💿 ${formatter.bold("Album")}  : ${track.album || "—"}\n` +
                    `⏱ ${formatter.bold("Duration")}: ${track.duration || track.duration_ms ? Math.floor((track.duration_ms || 0) / 60000) + ":" + String(Math.floor(((track.duration_ms || 0) % 60000) / 1000)).padStart(2, "0") : "—"}\n` +
                    (track.url ? `\n🔗 ${track.url}` : "");
                if (track.image || track.cover || track.thumbnail) {
                    try {
                        const imgUrl = track.image || track.cover || track.thumbnail;
                        const r = await axios.get(imgUrl, { responseType: "arraybuffer", timeout: 20_000 });
                        return ctx.reply({ image: Buffer.from(r.data), caption });
                    } catch {}
                }
                await ctx.reply(caption);
            } catch (e) {
                await ctx.replyReact("❌");
                await tools.cmd.handleError(ctx, e);
            }
        }
    }
];
