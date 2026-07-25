"use strict";

module.exports = {
    name: "ssweb",
    aliases: ["webss", "webscreenshot", "snapweb"],
    category: "tool",
    usage: "ssweb <url>",
    permissions: { coin: 10 },

    async code(ctx) {
        try {
            const url = ctx.text?.trim() || ctx.quoted?.body?.trim();
            if (!url || !tools.cmd.isUrl(url)) {
                return ctx.reply(
                    `${tools.msg.generateInstruction(["send"], ["text"])}\n` +
                    `${tools.msg.generateCmdExample(ctx.used, "https://google.com")}`
                );
            }
            await ctx.replyReact("📸");
            const { buffer } = await tools.api.getBinary("/api/tools/ssweb", { url });
            await ctx.replyReact("✅");
            await ctx.reply({ image: buffer, caption: `📸 ${url}` });
        } catch (e) {
            await ctx.replyReact("❌");
            await tools.cmd.handleError(ctx, e);
        }
    }
};
