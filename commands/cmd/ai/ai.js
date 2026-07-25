"use strict";

const { call } = require("../../../src/utils/chisacdi.js");

const sessions = new Map();
const MAX_HISTORY = 10; 

function getHistory(userId) {
    return sessions.get(userId) || [];
}
function pushHistory(userId, role, content) {
    const h = getHistory(userId);
    h.push({ role, content });
    
    if (h.length > MAX_HISTORY * 2) h.splice(0, h.length - MAX_HISTORY * 2);
    sessions.set(userId, h);
}
function clearHistory(userId) {
    sessions.delete(userId);
}

module.exports = {
    name: "ai",
    aliases: ["chat", "gpt", "ask", "best"],
    category: "ai",
    description: "Chat with AI (multi-turn conversation with memory)",
    usage: "ai <message> | ai reset | ai -s <system> <message>",

    async code(ctx) {
        try {
            const pfx    = ctx.used.prefix;
            const userId = ctx.sender.lid || ctx.sender.jid;
            const args   = ctx.args || [];
            const sub    = args[0]?.toLowerCase();

            if (sub === "reset" || sub === "clear" || sub === "new") {
                clearHistory(userId);
                return ctx.reply(tools.msg.info("🧹 Conversation history cleared. Starting fresh!"));
            }

            let systemPrompt = undefined;
            let messageText  = ctx.text?.trim();
            const sMatch = messageText?.match(/^-s\s+"([^"]+)"\s+([\s\S]+)$/) ||
                           messageText?.match(/^-s\s+(\S+)\s+([\s\S]+)$/);
            if (sMatch) {
                systemPrompt = sMatch[1];
                messageText  = sMatch[2].trim();
            }

            if (!messageText && ctx.quoted?.body) messageText = ctx.quoted.body;

            if (!messageText) {
                return ctx.reply(
                    `╔══[ 🤖 *AI Chat* ]\n` +
                    `${"─".repeat(30)}\n` +
                    `  ${formatter.italic("Multi-turn AI conversation with memory")}\n\n` +
                    `  💡 ${formatter.inlineCode(`${pfx}ai <message>`)}        — Chat\n` +
                    `  🔄 ${formatter.inlineCode(`${pfx}ai reset`)}            — Clear history\n` +
                    `  ⚙️  ${formatter.inlineCode(`${pfx}ai -s "<system>" <msg>`)} — Custom persona\n\n` +
                    `  📌 _Reply to any message to include it as context._`
                );
            }

            await ctx.replyReact("🤔");

            const history = getHistory(userId);

            const data = await call("best", {
                message: messageText,
                history,
                ...(systemPrompt ? { systemPrompt } : {})
            });

            const reply = data.text || data.response || data.content || data.result || JSON.stringify(data);

            pushHistory(userId, "user",      messageText);
            pushHistory(userId, "assistant", reply);

            await ctx.replyReact("✅");
            await ctx.reply(reply.trim());

        } catch (error) {
            await ctx.replyReact("❌");
            await tools.cmd.handleError(ctx, error);
        }
    }
};
