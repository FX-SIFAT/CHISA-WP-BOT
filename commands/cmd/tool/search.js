"use strict";

module.exports = [
    {
        name: "gsearch",
        aliases: ["google", "googlesearch", "ggl"],
        category: "tool",
        usage: "gsearch <query>",
        async code(ctx) {
            try {
                const query = ctx.text?.trim();
                if (!query) {
                    return ctx.reply(
                        `${tools.msg.generateInstruction(["send"], ["text"])}\n` +
                        `${tools.msg.generateCmdExample(ctx.used, "WhatsApp bot nodejs")}`
                    );
                }
                await ctx.replyReact("🔍");
                const d = await tools.api.get("/api/search/google", { query });
                const results = d.results || [];
                if (!results.length && !d.abstract) {
                    await ctx.replyReact("❌");
                    return ctx.reply(tools.msg.info(config.msg.notFound));
                }
                const text = results.slice(0, 5).map((r, i) =>
                    `${formatter.bold(`[${i + 1}]`)} ${formatter.bold(r.title || "—")}\n` +
                    `     ${(r.description || r.snippet || "").slice(0, 100)}\n` +
                    `     🔗 ${r.url || r.link || ""}`
                ).join("\n\n");
                await ctx.replyReact("✅");
                await ctx.reply(
                    `🔍 ${formatter.bold("Google")} — _${query}_\n\n` +
                    (d.abstract ? `📌 ${d.abstract}\n\n` : "") +
                    text
                );
            } catch (e) {
                await ctx.replyReact("❌");
                await tools.cmd.handleError(ctx, e);
            }
        }
    },
    {
        name: "bimage",
        aliases: ["bingimg", "bingimage", "imgsearch"],
        category: "tool",
        usage: "bimage <query>",
        permissions: { coin: 5 },
        async code(ctx) {
            try {
                const query = ctx.text?.trim();
                if (!query) {
                    return ctx.reply(
                        `${tools.msg.generateInstruction(["send"], ["text"])}\n` +
                        `${tools.msg.generateCmdExample(ctx.used, "sunset landscape")}`
                    );
                }
                await ctx.replyReact("🖼️");
                const d = await tools.api.get("/api/search/bingimage", { query });
                const results = (d.data || []).filter(r => r.direct || r.thumbnail);
                if (!results.length) {
                    await ctx.replyReact("❌");
                    return ctx.reply(tools.msg.info(config.msg.notFound));
                }
                const pick = results[0];
                const imgUrl = pick.direct || pick.thumbnail;
                const r = await axios.get(imgUrl, { responseType: "arraybuffer", timeout: 30_000 });
                await ctx.replyReact("✅");
                await ctx.reply({
                    image: Buffer.from(r.data),
                    caption: `🖼️ ${formatter.bold(pick.title || query)}\n🔗 ${pick.source || ""}`
                });
            } catch (e) {
                await ctx.replyReact("❌");
                await tools.cmd.handleError(ctx, e);
            }
        }
    },
    {
        name: "bvideo",
        aliases: ["bingvid", "bingvideo", "bvid"],
        category: "tool",
        usage: "bvideo <query>",
        async code(ctx) {
            try {
                const query = ctx.text?.trim();
                if (!query) {
                    return ctx.reply(
                        `${tools.msg.generateInstruction(["send"], ["text"])}\n` +
                        `${tools.msg.generateCmdExample(ctx.used, "nodejs tutorial")}`
                    );
                }
                await ctx.replyReact("🎥");
                const d = await tools.api.get("/api/search/bingvideos", { query });
                const results = d.data || [];
                if (!results.length) {
                    await ctx.replyReact("❌");
                    return ctx.reply(tools.msg.info(config.msg.notFound));
                }
                const text = results.slice(0, 5).map((r, i) =>
                    `${formatter.bold(`[${i + 1}]`)} ${formatter.bold(r.title || "—")}\n` +
                    `     ⏱ ${r.duration || "—"} · 👁 ${r.views || "—"} · 📅 ${r.upload || "—"}\n` +
                    `     📺 ${r.channel || "—"}`
                ).join("\n\n");
                await ctx.replyReact("✅");
                await ctx.reply(`🎥 ${formatter.bold("Bing Videos")} — _${query}_\n\n${text}`);
            } catch (e) {
                await ctx.replyReact("❌");
                await tools.cmd.handleError(ctx, e);
            }
        }
    },
    {
        name: "pinimg",
        aliases: ["pinterest", "pin", "pinimage", "pinsearch"],
        category: "tool",
        usage: "pinimg <query>",
        permissions: { coin: 5 },
        async code(ctx) {
            try {
                const query = ctx.text?.trim();
                if (!query) {
                    return ctx.reply(
                        `${tools.msg.generateInstruction(["send"], ["text"])}\n` +
                        `${tools.msg.generateCmdExample(ctx.used, "anime wallpaper")}`
                    );
                }
                await ctx.replyReact("📌");
                const d = await tools.api.get("/api/search/pinterest", { query });
                const results = (d.results || []).filter(r => r.image_url);
                if (!results.length) {
                    await ctx.replyReact("❌");
                    return ctx.reply(tools.msg.info(config.msg.notFound));
                }
                const pick = results[Math.floor(Math.random() * Math.min(results.length, 5))];
                const r = await axios.get(pick.image_url, { responseType: "arraybuffer", timeout: 30_000 });
                await ctx.replyReact("✅");
                await ctx.reply({
                    image: Buffer.from(r.data),
                    caption: `📌 ${formatter.bold(pick.description || query)}`
                });
            } catch (e) {
                await ctx.replyReact("❌");
                await tools.cmd.handleError(ctx, e);
            }
        }
    },
    {
        name: "pinv2",
        aliases: ["pinterestv2", "pin2", "pinv2search"],
        category: "tool",
        usage: "pinv2 <query>",
        permissions: { coin: 5 },
        async code(ctx) {
            try {
                const query = ctx.text?.trim();
                if (!query) {
                    return ctx.reply(
                        `${tools.msg.generateInstruction(["send"], ["text"])}\n` +
                        `${tools.msg.generateCmdExample(ctx.used, "anime aesthetic")}`
                    );
                }
                await ctx.replyReact("📌");
                const d = await tools.api.get("/api/search/pinterestv2", { text: query });
                const results = (d.data || []).filter(r => r.image);
                if (!results.length) {
                    await ctx.replyReact("❌");
                    return ctx.reply(tools.msg.info(config.msg.notFound));
                }
                const pick = results[Math.floor(Math.random() * Math.min(results.length, 5))];
                const r = await axios.get(pick.image, { responseType: "arraybuffer", timeout: 30_000 });
                await ctx.replyReact("✅");
                await ctx.reply({
                    image: Buffer.from(r.data),
                    caption: `📌 ${formatter.bold(pick.title || pick.description || query)}`
                });
            } catch (e) {
                await ctx.replyReact("❌");
                await tools.cmd.handleError(ctx, e);
            }
        }
    },
    {
        name: "pinvideo",
        aliases: ["pinterestvideo", "pinvid", "pinvideosearch"],
        category: "tool",
        usage: "pinvideo <query>",
        permissions: { coin: 10 },
        async code(ctx) {
            try {
                const query = ctx.text?.trim();
                if (!query) {
                    return ctx.reply(
                        `${tools.msg.generateInstruction(["send"], ["text"])}\n` +
                        `${tools.msg.generateCmdExample(ctx.used, "anime edit")}`
                    );
                }
                await ctx.replyReact("📌");
                const d = await tools.api.get("/api/search/pinterestvideo", { query });
                const v = d.data;
                if (!v?.id) {
                    await ctx.replyReact("❌");
                    return ctx.reply(tools.msg.info(config.msg.notFound));
                }
                const videoUrl = v.video_url || v.url;
                if (videoUrl) {
                    const r = await axios.get(videoUrl, {
                        responseType: "arraybuffer",
                        timeout: 60_000,
                        maxContentLength: 100 * 1024 * 1024
                    });
                    const buf = Buffer.from(r.data);
                    await ctx.replyReact("✅");
                    await ctx.reply({
                        video: buf,
                        caption: `📌 ${formatter.bold(v.title || query)}\n❤️ ${(v.likes || 0).toLocaleString()}`
                    });
                } else {
                    await ctx.replyReact("✅");
                    await ctx.reply(
                        `📌 ${formatter.bold(v.title || query)}\n` +
                        `👤 ${v.author?.full_name || "—"}\n` +
                        `❤️ ${(v.likes || 0).toLocaleString()}\n` +
                        `📝 ${v.description || ""}`
                    );
                }
            } catch (e) {
                await ctx.replyReact("❌");
                await tools.cmd.handleError(ctx, e);
            }
        }
    }
];
