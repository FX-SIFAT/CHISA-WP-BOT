"use strict";

const { callMultipart } = require("../../../src/utils/chisacdi.js");

module.exports = {
    name: "imgedit",
    aliases: ["editimg", "aiedit", "imgai"],
    category: "ai",
    description: "Edit an image using an AI prompt",
    usage: "imgedit <prompt> — reply to an image",
    permissions: { coin: 20 },

    async code(ctx) {
        try {
            const pfx    = ctx.used.prefix;
            const quoted = ctx.quoted;
            const qType  = quoted?.messageType;
            const isImg  = qType === "imageMessage";

            const prompt = ctx.text?.trim();

            if (!isImg || !prompt) {
                return ctx.reply(
                    `╔══[ ✏️  *AI Image Edit* ]\n${"─".repeat(30)}\n` +
                    `  ${formatter.italic("Edit images with natural language")}\n\n` +
                    `  📌 Reply to an image and use:\n` +
                    `  💡 ${formatter.inlineCode(`${pfx}imgedit make it look like anime`)}\n` +
                    `  💡 ${formatter.inlineCode(`${pfx}imgedit add a rainbow in the sky`)}\n` +
                    `  💡 ${formatter.inlineCode(`${pfx}imgedit remove the background`)}`
                );
            }

            await ctx.replyReact("✏️");

            const imgBuf = await quoted.download();
            const data   = await callMultipart("image_edit", imgBuf, { prompt });

            const imgOut = data.image || data.url || data.result;

            if (!imgOut) {
                await ctx.replyReact("❌");
                return ctx.reply(tools.msg.info("No edited image returned. Try a different prompt."));
            }

            let outBuf;
            if (typeof imgOut === "string" && imgOut.startsWith("http")) {
                const r = await axios.get(imgOut, { responseType: "arraybuffer", timeout: 60_000 });
                outBuf = Buffer.from(r.data);
            } else if (typeof imgOut === "string") {
                outBuf = Buffer.from(imgOut.replace(/^data:image\/\w+;base64,/, ""), "base64");
            }

            await ctx.replyReact("✅");
            await ctx.reply({
                image  : outBuf,
                caption: tools.msg.info(`Edited: "${prompt}"`)
            });

        } catch (error) {
            await ctx.replyReact("❌");
            await tools.cmd.handleError(ctx, error);
        }
    }
};
