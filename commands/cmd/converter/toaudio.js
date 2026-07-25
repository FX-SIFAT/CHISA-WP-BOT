module.exports = {
    name: "toaudio",
    aliases: ["toaud", "tomp3"],
    category: "converter",
    permissions: { coin: 10 },
    code: async (ctx) => {
        const checkMedia       = tools.cmd.checkMedia(ctx.msg.messageType, ["video"]);
        const checkQuotedMedia = tools.cmd.checkQuotedMedia(ctx.quoted?.messageType, ["video"]);

        if (!checkMedia && !checkQuotedMedia)
            return await ctx.reply(
                `${tools.msg.generateInstruction(["send", "reply"], ["video"])}\n` +
                tools.msg.generateNotes(["Converts video (MP4) to audio (MP3)."])
            );

        try {
            await ctx.replyReact("⏳");
            const buffer = await ctx.msg.download() || await ctx.quoted.download();
            const apiUrl = tools.api.createUrl("https://nekochii-converter.hf.space", "/mp4tomp3");
            const result = (await axios.post(apiUrl, {
                file: buffer.toString("base64"),
                json: true
            })).data.result;

            await ctx.replyReact("✅");
            await ctx.reply({ audio: { url: result }, mimetype: "audio/mpeg" });
        } catch (err) {
            await ctx.replyReact("❌");
            await tools.cmd.handleError(ctx, err, true);
        }
    }
};
