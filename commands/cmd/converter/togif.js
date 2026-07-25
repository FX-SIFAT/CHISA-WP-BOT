module.exports = {
    name: "togif",
    category: "converter",
    permissions: { coin: 10 },
    code: async (ctx) => {
        const hasSticker =
            tools.cmd.checkMedia(ctx.msg.messageType, ["sticker"]) ||
            tools.cmd.checkQuotedMedia(ctx.quoted?.messageType, ["sticker"]);

        if (!hasSticker)
            return await ctx.reply(
                `${tools.msg.generateInstruction(["send", "reply"], ["sticker"])}\n` +
                tools.msg.generateNotes(["Converts an animated sticker (WebP) to GIF."])
            );

        try {
            await ctx.replyReact("⏳");
            const buffer = await ctx.msg.download() || await ctx.quoted.download();
            const apiUrl = tools.api.createUrl("https://nekochii-converter.hf.space", "/webp2gif");
            const result = (await axios.post(apiUrl, {
                file: buffer.toString("base64"),
                json: true
            })).data.result;

            await ctx.replyReact("✅");
            await ctx.reply({ video: { url: result }, gifPlayback: true });
        } catch (err) {
            await ctx.replyReact("❌");
            await tools.cmd.handleError(ctx, err, true);
        }
    }
};
