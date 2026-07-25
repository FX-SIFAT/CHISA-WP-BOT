"use strict";

const util = require("node:util");


module.exports = {
    name: /^==?>? /,
    type: "hears",

    async code(ctx) {
        if (!ctx.sender.isOwner()) return;

        const body    = ctx.msg.body;
        const isAsync = body.startsWith("==>");
        const code    = body.slice(isAsync ? 4 : 3).trim();

        if (!code) return;

        const start = Date.now();
        try {
            const result = await eval(isAsync ? `(async () => { ${code} })()` : code);
            const output = util.format(result);
            const elapsed = Date.now() - start;
            const truncated = output.length > 3000 ? output.slice(0, 3000) + "\n… (truncated)" : output;

            return ctx.reply(
                `✅ *Result* (${elapsed}ms)\n` +
                formatter.monospace(truncated)
            );
        } catch (e) {
            return ctx.reply(
                `❌ *Error*\n` +
                formatter.monospace(e.stack || e.message || String(e))
            );
        }
    }
};
