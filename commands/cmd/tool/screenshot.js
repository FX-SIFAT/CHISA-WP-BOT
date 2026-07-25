"use strict";

const { call } = require("../../../src/utils/chisacdi.js");

module.exports = {
    name: "screenshot",
    aliases: ["ss", "webshot", "snap", "capture"],
    category: "tool",
    description: "Take a screenshot of any website",
    usage: "screenshot <url> [-w width] [-h height]",
    permissions: { coin: 10 },

    async code(ctx) {
        try {
            const pfx  = ctx.used.prefix;
            const flag = ctx.flag({
                w: { type: "string", short: "w", default: "1280" },
                h: { type: "string", short: "h", default: "800"  }
            });

            const url = flag.input?.trim() || ctx.quoted?.body?.trim();

            if (!url || !tools.cmd.isUrl(url)) {
                return ctx.reply(
                    `╔══[ 📸 *Website Screenshot* ]\n${"─".repeat(30)}\n` +
                    `  ${formatter.italic("Capture any website as an image")}\n\n` +
                    `  💡 ${formatter.inlineCode(`${pfx}ss https://example.com`)}\n` +
                    `  📐 ${formatter.inlineCode(`${pfx}ss -w 1920 -h 1080 <url>`)} — Custom size`
                );
            }

            const width  = Math.min(1920, Math.max(320, parseInt(flag.w) || 1280));
            const height = Math.min(2160, Math.max(200, parseInt(flag.h) || 800));

            await ctx.replyReact("📸");

            const data = await call("screenshot", { url, width, height });

            const img = data.image || data.screenshot || data.url || data.result;
            if (!img) {
                await ctx.replyReact("❌");
                return ctx.reply(tools.msg.info("Screenshot failed. Make sure the URL is accessible."));
            }

            let imgBuf;
            if (typeof img === "string" && img.startsWith("http")) {
                const r = await axios.get(img, { responseType: "arraybuffer", timeout: 60_000 });
                imgBuf = Buffer.from(r.data);
            } else {
                imgBuf = Buffer.from(img.replace(/^data:image\/\w+;base64,/, ""), "base64");
            }

            await ctx.replyReact("✅");
            await ctx.reply({
                image  : imgBuf,
                caption: `📸 ${formatter.bold(url)}\n${tools.msg.info(`${width}×${height}px`)}`
            });

        } catch (error) {
            await ctx.replyReact("❌");
            await tools.cmd.handleError(ctx, error);
        }
    }
};
