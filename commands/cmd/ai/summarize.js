"use strict";

const { call } = require("../../../src/utils/chisacdi.js");

const LENGTHS = ["short", "medium", "long"];

module.exports = {
    name: "summarize",
    aliases: ["tldr", "summary", "sum"],
    category: "ai",
    description: "Summarize long text with AI",
    usage: "summarize <text> [-l short|medium|long] | reply to a message",

    async code(ctx) {
        try {
            const pfx  = ctx.used.prefix;
            const flag = ctx.flag({
                l: { type: "string", short: "l", default: "medium" }
            });

            const text   = flag.input?.trim() || ctx.quoted?.body?.trim();
            const length = LENGTHS.includes(flag.l?.toLowerCase()) ? flag.l.toLowerCase() : "medium";

            if (!text) {
                return ctx.reply(
                    `╔══[ 📝 *AI Summarizer* ]\n${"─".repeat(30)}\n` +
                    `  ${formatter.italic("Summarize any long text instantly")}\n\n` +
                    `  💡 ${formatter.inlineCode(`${pfx}tldr <long text>`)}\n` +
                    `  💡 ${formatter.inlineCode(`${pfx}tldr -l short <text>`)} — Short summary\n` +
                    `  💡 ${formatter.inlineCode(`${pfx}tldr -l long  <text>`)} — Detailed summary\n` +
                    `  📌 Or reply to any long message\n\n` +
                    `  📏 Lengths: ${LENGTHS.map(l => formatter.inlineCode(l)).join(", ")}`
                );
            }

            await ctx.replyReact("📝");

            const data   = await call("summarize", { text, length });
            const result = data.text || data.summary || data.result || data.response || JSON.stringify(data);

            await ctx.replyReact("✅");
            await ctx.reply(
                `╔══[ 📝 *Summary* — ${formatter.inlineCode(length)} ]\n${"─".repeat(30)}\n\n` +
                result.trim()
            );

        } catch (error) {
            await ctx.replyReact("❌");
            await tools.cmd.handleError(ctx, error);
        }
    }
};
