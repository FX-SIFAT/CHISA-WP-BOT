"use strict";

async function sendAnime(ctx, endpoint, react) {
    await ctx.replyReact(react);
    const { buffer } = await tools.api.getBinary(endpoint);
    await ctx.replyReact("✅");
    await ctx.reply({ image: buffer, caption: "" });
}

module.exports = [
    {
        name: "waifu",
        aliases: ["anime", "animegirl"],
        category: "anime",
        permissions: { coin: 5 },
        async code(ctx) {
            try { await sendAnime(ctx, "/api/anime/waifu", "🌸"); }
            catch (e) { await ctx.replyReact("❌"); await tools.cmd.handleError(ctx, e); }
        }
    },
    {
        name: "neko",
        aliases: ["catgirl", "nekogirl"],
        category: "anime",
        permissions: { coin: 5 },
        async code(ctx) {
            try { await sendAnime(ctx, "/api/anime/neko", "🐱"); }
            catch (e) { await ctx.replyReact("❌"); await tools.cmd.handleError(ctx, e); }
        }
    },
    {
        name: "foxgirl",
        aliases: ["fox", "kitsune"],
        category: "anime",
        permissions: { coin: 5 },
        async code(ctx) {
            try { await sendAnime(ctx, "/api/anime/foxgirl", "🦊"); }
            catch (e) { await ctx.replyReact("❌"); await tools.cmd.handleError(ctx, e); }
        }
    },
    {
        name: "loli",
        aliases: ["animeloli"],
        category: "anime",
        permissions: { coin: 5 },
        async code(ctx) {
            try { await sendAnime(ctx, "/api/anime/loli", "✨"); }
            catch (e) { await ctx.replyReact("❌"); await tools.cmd.handleError(ctx, e); }
        }
    }
];
