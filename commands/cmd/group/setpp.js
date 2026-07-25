module.exports = {
    name: "setpp",
    aliases: ["seticon", "setgrouppp"],
    category: "group",
    role: 1,
    permissions: { botAdmin: true, group: true },
    code: async (ctx) => {
        const mediaType =
            tools.cmd.checkMedia(ctx.msg.messageType, ["image"]) ||
            tools.cmd.checkQuotedMedia(ctx.quoted?.messageType, ["image"]);

        if (!mediaType)
            return await ctx.reply(
                `${tools.msg.generateInstruction(["send", "reply"], ["image"])}\n` +
                tools.msg.generateNotes(["Send or reply to an image to set it as the group profile picture."])
            );

        try {
            const buffer = await ctx.msg.download() || await ctx.quoted.download();
            await ctx.group().updateProfilePicture(buffer);
            await ctx.reply(tools.msg.info("Group profile picture updated successfully!"));
        } catch (err) {
            await tools.cmd.handleError(ctx, err);
        }
    }
};
