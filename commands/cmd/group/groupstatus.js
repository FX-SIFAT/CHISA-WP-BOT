module.exports = {
    name: "groupstatus",
    aliases: ["gcsw", "swgc"],
    category: "group",
    role: 1,
    permissions: { group: true },
    code: async (ctx) => {
        const input = ctx.text || ctx.quoted?.body;
        const mediaType =
            tools.cmd.checkMedia(ctx.msg.messageType, ["image", "video"]) ||
            tools.cmd.checkQuotedMedia(ctx.quoted?.messageType, ["image", "video"]);

        if (!input && !mediaType)
            return await ctx.reply(
                `${tools.msg.generateInstruction(["send"], ["text", "image", "video"])}\n` +
                tools.msg.generateCmdExample(ctx.used, "Good morning everyone!")
            );

        try {
            let content;
            if (["image", "video"].includes(mediaType)) {
                const buffer = await ctx.msg.download() || await ctx.quoted.download();
                content = { [mediaType]: buffer, caption: input };
            } else {
                content = { text: input };
            }

            await ctx.reply({ ...content, groupStatus: true });
            await ctx.reply(tools.msg.info("Group status posted successfully!"));
        } catch (err) {
            await tools.cmd.handleError(ctx, err, false);
        }
    }
};
