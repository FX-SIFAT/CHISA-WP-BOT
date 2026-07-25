module.exports = {
    name: "setmaxwarnings",
    aliases: ["maxwarn", "setwarnlimit"],
    category: "group",
    role: 1,
    permissions: { botAdmin: true, group: true },
    code: async (ctx) => {
        const current = ctx.db.group?.maxwarnings || 3;
        const input = parseInt(ctx.args[0], 10);

        if (!ctx.args[0])
            return await ctx.reply(
                `${tools.msg.generateInstruction(["send"], ["number"])}\n` +
                `${tools.msg.generateCmdExample(ctx.used, "5")}\n` +
                tools.msg.generateNotes([
                    `Current limit: ${formatter.inlineCode(current)}`,
                    "Value must be between 1 and 20."
                ])
            );

        if (isNaN(input) || input < 1 || input > 20)
            return await ctx.reply(
                `${tools.msg.generateInstruction(["send"], ["number"])}\n` +
                tools.msg.generateNotes(["Value must be a number between 1 and 20."])
            );

        if (input === current)
            return await ctx.reply(tools.msg.info(`Max warnings is already set to ${formatter.inlineCode(current)}.`));

        try {
            const groupDb = ctx.db.group;
            groupDb.maxwarnings = input;
            await groupDb.save();
            await ctx.reply(tools.msg.info(`Max warnings updated: ${formatter.inlineCode(current)} → ${formatter.inlineCode(input)}`));
        } catch (err) {
            await tools.cmd.handleError(ctx, err);
        }
    }
};
