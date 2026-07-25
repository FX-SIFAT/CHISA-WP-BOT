"use strict";

const { call } = require("../../../src/utils/chisacdi.js");

const TONES = ["professional", "casual", "formal", "friendly"];

module.exports = {
    name: "rewrite",
    aliases: ["rephrase", "paraphrase", "improve"],
    category: "ai",
    description: "Rewrite text with AI in a different tone",
    usage: "rewrite <text> [-t tone] | reply to a message",

    async code(ctx) {
        try {
            const pfx  = ctx.used.prefix;
            const flag = ctx.flag({
                t: { type: "string", short: "t", default: "professional" }
            });

            const text = flag.input?.trim() || ctx.quoted?.body?.trim();
            const tone = TONES.includes(flag.t?.toLowerCase()) ? flag.t.toLowerCase() : "professional";

            if (!text) {
                return ctx.reply(
                    `╔══[ ✍️  *AI Rewriter* ]\n${"─".repeat(30)}\n` +
                    `  ${formatter.italic("Rewrite any text in a better tone")}\n\n` +
                    `  💡 ${formatter.inlineCode(`${pfx}rewrite <text>`)}\n` +
                    `  💡 ${formatter.inlineCode(`${pfx}rewrite -t casual <text>`)}\n` +
                    `  📌 Or reply to any message\n\n` +
                    `  🎭 Tones: ${TONES.map(t => formatter.inlineCode(t)).join(", ")}`
                );
            }

            await ctx.replyReact("✍️");

            const data = await call("rewrite", { text, tone });
            const result = data.text || data.rewritten || data.result || data.response || JSON.stringify(data);

            await ctx.replyReact("✅");
            await ctx.reply(
                `╔══[ ✍️  *Rewritten* — ${formatter.inlineCode(tone)} ]\n${"─".repeat(30)}\n\n` +
                result.trim()
            );

        } catch (error) {
            await ctx.replyReact("❌");
            await tools.cmd.handleError(ctx, error);
        }
    }
};
