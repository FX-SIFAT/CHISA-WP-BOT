"use strict";

async function processImage(ctx, endpoint, react, caption) {
    const url = ctx.text?.trim() || ctx.quoted?.body?.trim();
    if (!url || !tools.cmd.isUrl(url)) {
        return ctx.reply(
            `${tools.msg.generateInstruction(["send"], ["text"])}\n` +
            `${tools.msg.generateCmdExample(ctx.used, "https://example.com/image.jpg")}`
        );
    }
    await ctx.replyReact(react);
    const { buffer, type } = await tools.api.getBinary(endpoint, { url });
    const isVideo = type?.includes("video");
    await ctx.replyReact("✅");
    if (isVideo) {
        await ctx.reply({ video: buffer, caption });
    } else {
        await ctx.reply({ image: buffer, caption });
    }
}

module.exports = [
    {
        name: "removebg",
        aliases: ["rmbg", "bgremove", "nobg"],
        category: "tool",
        usage: "removebg <image url>",
        permissions: { coin: 15 },
        async code(ctx) {
            try { await processImage(ctx, "/api/image/removebg", "✂️", "✂️ Background removed"); }
            catch (e) { await ctx.replyReact("❌"); await tools.cmd.handleError(ctx, e); }
        }
    },
    {
        name: "unblur",
        aliases: ["deblur", "sharpify", "clearimg"],
        category: "tool",
        usage: "unblur <image url>",
        permissions: { coin: 10 },
        async code(ctx) {
            try { await processImage(ctx, "/api/image/unblur", "🔍", "🔍 Image unblurred"); }
            catch (e) { await ctx.replyReact("❌"); await tools.cmd.handleError(ctx, e); }
        }
    },
    {
        name: "unwatermark",
        aliases: ["rmwm", "rmwatermark", "nowatermark"],
        category: "tool",
        usage: "unwatermark <image url>",
        permissions: { coin: 10 },
        async code(ctx) {
            try { await processImage(ctx, "/api/image/unwatermark", "🧹", "🧹 Watermark removed"); }
            catch (e) { await ctx.replyReact("❌"); await tools.cmd.handleError(ctx, e); }
        }
    },
    {
        name: "enhance",
        aliases: ["hd", "upscale", "aienhance", "aihd"],
        category: "tool",
        usage: "enhance <image url>",
        permissions: { coin: 20 },
        async code(ctx) {
            try { await processImage(ctx, "/api/imagehd/ai-enhancev6", "⬆️", "⬆️ AI Enhanced"); }
            catch (e) { await ctx.replyReact("❌"); await tools.cmd.handleError(ctx, e); }
        }
    }
];
