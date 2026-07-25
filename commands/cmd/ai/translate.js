"use strict";

const { call } = require("../../../src/utils/chisacdi.js");

module.exports = {
    name: "translate",
    aliases: ["tl", "tr", "lang"],
    category: "ai",
    description: "Translate text to any language using AI",
    usage: "translate <language> <text> | reply to a message",

    async code(ctx) {
        try {
            const pfx  = ctx.used.prefix;
            const args = ctx.args || [];

            
            let targetLang = "English";
            let text       = "";

            const quoted = ctx.quoted;

            if (quoted?.body) {
                
                targetLang = ctx.text?.trim() || "English";
                text       = quoted.body.trim();
            } else {
                if (!args.length) {
                    return ctx.reply(
                        `╔══[ 🌐 *AI Translator* ]\n${"─".repeat(30)}\n` +
                        `  ${formatter.italic("Translate to any language with AI")}\n\n` +
                        `  💡 ${formatter.inlineCode(`${pfx}tl Bengali Hello, how are you?`)}\n` +
                        `  💡 ${formatter.inlineCode(`${pfx}tl French Good morning`)}\n` +
                        `  📌 Or reply to a message: ${formatter.inlineCode(`${pfx}tl Spanish`)}\n\n` +
                        `  🌐 Any language name works — Bengali, Arabic, Japanese, etc.`
                    );
                }

                targetLang = args[0];
                text       = args.slice(1).join(" ").trim();

                if (!text) {
                    
                    text       = args.join(" ").trim();
                    targetLang = "English";
                }
            }

            if (!text) {
                return ctx.reply(tools.msg.info("Provide text to translate or reply to a message."));
            }

            await ctx.replyReact("🌐");

            const data = await call("translate", { text, target_language: targetLang });
            const result = data.text || data.translation || data.translated || data.result || data.response || JSON.stringify(data);

            await ctx.replyReact("✅");
            await ctx.reply(
                `╔══[ 🌐 *Translated to ${targetLang}* ]\n${"─".repeat(30)}\n\n` +
                result.trim()
            );

        } catch (error) {
            await ctx.replyReact("❌");
            await tools.cmd.handleError(ctx, error);
        }
    }
};
