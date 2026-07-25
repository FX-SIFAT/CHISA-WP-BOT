module.exports = {
    name: "setdescription",
    aliases: ["setdesc"],
    category: "group",
    role: 1,
    permissions: { botAdmin: true, group: true },
    code: async (ctx) => {
        const input = ctx.text || ctx.quoted?.body;

        if (!input)
            return await ctx.reply(
                `${tools.msg.generateInstruction(["send", "reply"], ["text"])}\n` +
                `${tools.msg.generateCmdExample(ctx.used, "Welcome to SIFAT's group!")}\n` +
                tools.msg.generateNotes([
                    `Reply to a message to use its text as the description.`
                ])
            );

        try {
            await ctx.group().updateDescription(input);
            await ctx.reply(tools.msg.info("Group description updated successfully!"));
        } catch (err) {
            await tools.cmd.handleError(ctx, err);
        }
    }
};
