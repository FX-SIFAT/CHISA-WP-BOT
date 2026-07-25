"use strict";

module.exports = {
    name: "lovequote",
    aliases: ["lquote", "quote", "lovenote"],
    category: "fun",
    async code(ctx) {
        try {
            await ctx.replyReact("💌");
            const d = await tools.api.get("/api/love/quote");
            await ctx.replyReact("✅");
            await ctx.reply(
                `💌 _"${d.quote}"_\n\n` +
                `— ${formatter.bold(d.author)}`
            );
        } catch (e) {
            await ctx.replyReact("❌");
            await tools.cmd.handleError(ctx, e);
        }
    }
};
