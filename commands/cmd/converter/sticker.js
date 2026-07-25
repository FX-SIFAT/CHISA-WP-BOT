const { Sticker, StickerTypes } = require("wa-sticker-formatter");

module.exports = {
    name: "sticker",
    aliases: ["s", "stiker"],
    category: "converter",
    code: async (ctx) => {
        const checkMedia       = tools.cmd.checkMedia(ctx.msg.messageType, ["image", "video"]);
        const checkQuotedMedia = tools.cmd.checkQuotedMedia(ctx.quoted?.messageType, ["image", "video"]);

        if (!checkMedia && !checkQuotedMedia)
            return await ctx.reply(
                `${tools.msg.generateInstruction(["send", "reply"], ["image", "video"])}\n` +
                tools.msg.generateNotes([
                    "Optional: send text as packname|author to set watermark.",
                    `Example: ${formatter.inlineCode(`${ctx.used.prefix + ctx.used.command} SIFAT|MARINxWP`)}`
                ])
            );

        try {
            await ctx.replyReact("⏳");
            const buffer          = await ctx.msg.download() || await ctx.quoted.download();
            const [packname, author] = (ctx.text || "").split("|").map(s => s?.trim());
            const userWm          = ctx.db.user?.stickerwm;

            const sticker = await new Sticker(buffer)
                .setPack(packname || userWm?.packname || config.sticker.packname)
                .setAuthor(author || userWm?.author || config.sticker.author)
                .setType(StickerTypes.FULL)
                .setCategories(["🌕"])
                .setID(ctx.msg.key.id)
                .setQuality(50)
                .build();

            await ctx.replyReact("✅");
            await ctx.reply({ sticker });
        } catch (err) {
            await ctx.replyReact("❌");
            await tools.cmd.handleError(ctx, err);
        }
    }
};
