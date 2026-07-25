"use strict";

const util  = require("node:util");
const { exec } = require("node:child_process");
const execAsync = util.promisify(exec);

module.exports = {
    name: /^\$ /,
    type: "hears",

    async code(ctx) {
        if (!ctx.sender.isOwner()) return;

        const command = ctx.msg.body.slice(2).trim();
        if (!command) return;

        const start = Date.now();
        try {
            await ctx.replyReact("⏳");
            const { stdout, stderr } = await execAsync(command, { timeout: 30000 });
            const output   = (stdout || stderr || "(no output)").trim();
            const elapsed  = Date.now() - start;
            const truncated = output.length > 3000 ? output.slice(0, 3000) + "\n… (truncated)" : output;

            await ctx.replyReact("✅");
            return ctx.reply(
                `✅ *Shell* (${elapsed}ms)\n` +
                formatter.monospace(truncated)
            );
        } catch (e) {
            await ctx.replyReact("❌");
            const errOut = (e.stdout || e.stderr || e.message || String(e)).trim();
            const truncated = errOut.length > 3000 ? errOut.slice(0, 3000) + "\n… (truncated)" : errOut;
            return ctx.reply(
                `❌ *Error* (exit ${e.code ?? "?"})\n` +
                formatter.monospace(truncated)
            );
        }
    }
};
