const { Sticker, StickerTypes } = require("wa-sticker-formatter");

module.exports = {
    name: "stickerwm",
    aliases: ["take", "swm", "stikerwm"],
    category: "converter",
    permissions: { coin: 10 },
    code: async (ctx) => {
        const hasSticker =
            tools.cmd.checkMedia(ctx.msg.messageType, ["sticker"]) ||
            tools.cmd.checkQuotedMedia(ctx.quoted?.messageType, ["sticker"]);

        const input = ctx.text;

        if (!hasSticker)
            return await ctx.reply(
                `${tools.msg.generateInstruction(["send", "reply"], ["sticker"])}\n` +
                `${tools.msg.generateCmdExample(ctx.used, "SIFAT|MARINxWP")}\n` +
                tools.msg.generateNotes([
                    "Send or reply to a sticker with packname|author as text.",
                    "Leave empty to use your saved watermark from setprofile."
                ])
            );

        try {
            await ctx.replyReact("⏳");
            const buffer             = await ctx.msg.download() || await ctx.quoted.download();
            const [packname, author] = (input || "").split("|").map(s => s?.trim());
            const userWm             = ctx.db.user?.stickerwm;

            const sticker = await new Sticker(buffer)
                .setPack(packname || userWm?.packname || "")
                .setAuthor(author || userWm?.author || "")
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
