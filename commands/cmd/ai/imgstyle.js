"use strict";

const { call } = require("../../../src/utils/chisacdi.js");

const STYLES = ["anime", "realistic", "watercolor", "oil painting", "sketch", "cyberpunk", "fantasy", "cartoon", "pixel art", "ghibli"];

module.exports = {
    name: "imgstyle",
    aliases: ["aistyle", "style", "restyle"],
    category: "ai",
    description: "Apply an AI art style to an image or prompt",
    usage: "imgstyle <style> <prompt> | imgstyle list",
    permissions: { coin: 15 },

    async code(ctx) {
        try {
            const pfx  = ctx.used.prefix;
            const args = ctx.args || [];
            const sub  = args[0]?.toLowerCase();

            if (sub === "list") {
                return ctx.reply(
                    `╔══[ 🎨 *Available Styles* ]\n${"─".repeat(30)}\n` +
                    STYLES.map((s, i) => `  ${i + 1}. ${s}`).join("\n") + "\n" +
                    `${"─".repeat(30)}\n` +
                    `💡 ${formatter.inlineCode(`${pfx}imgstyle anime a warrior standing in rain`)}`
                );
            }

            const quoted  = ctx.quoted;
            const prompt  = ctx.text?.trim();
            const imageUrl = quoted?.messageType === "imageMessage"
                ? (await (async () => {
                    try { const b = await quoted.download(); return `data:image/jpeg;base64,${b.toString("base64")}`; }
                    catch { return undefined; }
                  })())
                : undefined;

            if (!prompt) {
                return ctx.reply(
                    `╔══[ 🎨 *AI Image Style* ]\n${"─".repeat(30)}\n` +
                    `  ${formatter.italic("Apply artistic styles to images or prompts")}\n\n` +
                    `  💡 ${formatter.inlineCode(`${pfx}imgstyle anime a samurai in rain`)}\n` +
                    `  📋 ${formatter.inlineCode(`${pfx}imgstyle list`)} — See all styles\n` +
                    `  📌 Reply to an image to restyle it`
                );
            }

            await ctx.replyReact("🎨");

            const data = await call("image_style", {
                prompt,
                ...(imageUrl ? { image_url: imageUrl } : {})
            });

            const img = data.image || data.url || data.result;
            if (!img) {
                await ctx.replyReact("❌");
                return ctx.reply(tools.msg.info("No image returned. Try a different style or prompt."));
            }

            let outBuf;
            if (typeof img === "string" && img.startsWith("http")) {
                const r = await axios.get(img, { responseType: "arraybuffer", timeout: 60_000 });
                outBuf = Buffer.from(r.data);
            } else {
                outBuf = Buffer.from(img.replace(/^data:image\/\w+;base64,/, ""), "base64");
            }

            await ctx.replyReact("✅");
            await ctx.reply({ image: outBuf, caption: tools.msg.info(`Style applied: "${prompt}"`) });

        } catch (error) {
            await ctx.replyReact("❌");
            await tools.cmd.handleError(ctx, error);
        }
    }
};
