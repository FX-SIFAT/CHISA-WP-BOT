"use strict";

const { call } = require("../../../src/utils/chisacdi.js");

module.exports = {
    name: "imagine",
    aliases: ["aiimg", "imgen", "draw", "generate"],
    category: "ai",
    description: "Generate AI images from a text prompt",
    usage: "imagine <prompt> [-n 1-8] [-h]",
    permissions: { coin: 15 },

    async code(ctx) {
        try {
            const pfx  = ctx.used.prefix;
            const flag = ctx.flag({
                n: { type: "string",  short: "n", default: "4" },
                h: { type: "boolean", short: "h", default: false }
            });

            const prompt = flag.input?.trim() || ctx.quoted?.body?.trim();
            if (!prompt) {
                return ctx.reply(
                    `╔══[ 🎨 *AI Image Generator* ]\n${"─".repeat(30)}\n` +
                    `  ${formatter.italic("Generate images from any text prompt")}\n\n` +
                    `  💡 ${formatter.inlineCode(`${pfx}imagine a futuristic city at night`)}\n` +
                    `  🔢 ${formatter.inlineCode(`${pfx}imagine -n 2 <prompt>`)} — Number of images (1–8)\n` +
                    `  📐 ${formatter.inlineCode(`${pfx}imagine -h <prompt>`)} — Horizontal orientation`
                );
            }

            const numImages   = Math.min(8, Math.max(1, parseInt(flag.n) || 4));
            const orientation = flag.h ? "HORIZONTAL" : "VERTICAL";

            await ctx.replyReact("🎨");

            const data = await call("image", { prompt, num_images: numImages, orientation });

            const images = data.images || data.urls || data.results || (data.url ? [data.url] : []);

            if (!images.length) {
                await ctx.replyReact("❌");
                return ctx.reply(tools.msg.info("No images returned. Try a different prompt."));
            }

            await ctx.replyReact("✅");

            for (let i = 0; i < images.length; i++) {
                const img = images[i];
                let imgBuf;

                if (typeof img === "string" && img.startsWith("http")) {
                    const r = await axios.get(img, { responseType: "arraybuffer", timeout: 60_000 });
                    imgBuf = Buffer.from(r.data);
                } else if (typeof img === "string") {
                    
                    imgBuf = Buffer.from(img.replace(/^data:image\/\w+;base64,/, ""), "base64");
                } else if (img?.url) {
                    const r = await axios.get(img.url, { responseType: "arraybuffer", timeout: 60_000 });
                    imgBuf = Buffer.from(r.data);
                } else {
                    continue;
                }

                await ctx.reply({
                    image  : imgBuf,
                    caption: i === 0 ? `🎨 *${prompt}*\n${tools.msg.info(`Image ${i + 1}/${images.length}`)}` : tools.msg.info(`Image ${i + 1}/${images.length}`)
                });
            }

        } catch (error) {
            await ctx.replyReact("❌");
            await tools.cmd.handleError(ctx, error);
        }
    }
};
