"use strict";

const { callMultipart } = require("../../../src/utils/chisacdi.js");

module.exports = {
    name: "vision",
    aliases: ["see", "describe", "analyze", "ocr"],
    category: "ai",
    description: "Analyze / describe an image using AI vision",
    usage: "vision [question] — reply to an image",

    async code(ctx) {
        try {
            const pfx    = ctx.used.prefix;
            const quoted = ctx.quoted;
            const qType  = quoted?.messageType;
            const isImg  = qType === "imageMessage";
            const isDoc  = qType === "documentMessage";

            if (!isImg && !isDoc) {
                return ctx.reply(
                    `╔══[ 👁️  *AI Vision* ]\n${"─".repeat(30)}\n` +
                    `  ${formatter.italic("Analyze any image with AI")}\n\n` +
                    `  📌 Reply to an image and use:\n` +
                    `  💡 ${formatter.inlineCode(`${pfx}vision`)}                — Describe the image\n` +
                    `  💡 ${formatter.inlineCode(`${pfx}vision what is this?`)}   — Ask a question about it\n` +
                    `  💡 ${formatter.inlineCode(`${pfx}vision read the text`)}   — Extract text (OCR)`
                );
            }

            const question = ctx.text?.trim() || "Describe this image in detail.";

            await ctx.replyReact("👁️");

            const imgBuf = await quoted.download();
            const data   = await callMultipart("vision", imgBuf, { question });

            const answer = data.text || data.description || data.result || data.response || JSON.stringify(data);

            await ctx.replyReact("✅");
            await ctx.reply(
                `╔══[ 👁️  *AI Vision* ]\n${"─".repeat(30)}\n` +
                `  ❓ *Q:* ${question}\n\n` +
                `  💬 *A:* ${answer.trim()}`
            );

        } catch (error) {
            await ctx.replyReact("❌");
            await tools.cmd.handleError(ctx, error);
        }
    }
};
