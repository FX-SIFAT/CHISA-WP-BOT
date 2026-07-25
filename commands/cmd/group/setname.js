module.exports = {
    name: "setname",
    aliases: ["rename", "groupname"],
    category: "group",
    role: 1,
    permissions: { botAdmin: true, group: true },
    code: async (ctx) => {
        const input = ctx.text;

        if (!input)
            return await ctx.reply(
                `${tools.msg.generateInstruction(["send"], ["text"])}\n` +
                tools.msg.generateCmdExample(ctx.used, "SIFAT's Group")
            );

        if (input.length > 100)
            return await ctx.reply(tools.msg.info("Group name cannot exceed 100 characters."));

        try {
            await ctx.group().updateSubject(input);
            await ctx.reply(tools.msg.info("Group name updated successfully!"));
        } catch (err) {
            await tools.cmd.handleError(ctx, err);
        }
    }
};
