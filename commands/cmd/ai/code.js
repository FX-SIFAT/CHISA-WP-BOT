"use strict";

const { call } = require("../../../src/utils/chisacdi.js");

const LANGS = ["javascript", "python", "typescript", "java", "c", "cpp", "csharp", "go", "rust", "php", "ruby", "swift", "kotlin", "bash", "sql", "html", "css"];

module.exports = {
    name: "code",
    aliases: ["aicode", "codegen", "program"],
    category: "ai",
    description: "Generate code with AI for any language",
    usage: "code <prompt> [-l language]",

    async code(ctx) {
        try {
            const pfx  = ctx.used.prefix;
            const flag = ctx.flag({
                l: { type: "string", short: "l", default: "" },
                lang: { type: "string", default: "" }
            });

            const prompt   = flag.input?.trim() || ctx.quoted?.body?.trim();
            const language = (flag.l || flag.lang || "").trim() || undefined;

            if (!prompt) {
                return ctx.reply(
                    `╔══[ 💻 *AI Code Generator* ]\n${"─".repeat(30)}\n` +
                    `  ${formatter.italic("Generate code in any programming language")}\n\n` +
                    `  💡 ${formatter.inlineCode(`${pfx}code make a countdown timer`)}\n` +
                    `  💡 ${formatter.inlineCode(`${pfx}code -l python fibonacci sequence`)}\n` +
                    `  💡 ${formatter.inlineCode(`${pfx}code -l javascript fetch API with retry`)}\n\n` +
                    `  🌐 Supported: ${LANGS.slice(0, 8).join(", ")}, and more...`
                );
            }

            await ctx.replyReact("💻");

            const data = await call("code", {
                prompt,
                ...(language ? { language } : {})
            });

            const result = data.code || data.text || data.result || data.response || JSON.stringify(data);

            await ctx.replyReact("✅");
            await ctx.reply(
                `╔══[ 💻 *Generated Code* ]\n${"─".repeat(30)}\n` +
                (language ? `  🌐 Language: ${formatter.inlineCode(language)}\n` : "") +
                `  📝 Prompt: ${formatter.italic(prompt)}\n` +
                `${"─".repeat(30)}\n\n` +
                result.trim()
            );

        } catch (error) {
            await ctx.replyReact("❌");
            await tools.cmd.handleError(ctx, error);
        }
    }
};
