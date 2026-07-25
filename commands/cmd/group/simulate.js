const { Events } = require("wp-heart");
const { handleWelcome } = require("../../event/welcome.js");

module.exports = {
    name: "simulate",
    aliases: ["sim"],
    category: "group",
    permissions: { botAdmin: true, group: true },
    code: async (ctx) => {
        const input = ctx.args[0]?.toLowerCase();

        const validTypes = {
            j: "join", join: "join",
            l: "leave", leave: "leave"
        };

        if (!input || !validTypes[input])
            return await ctx.reply(
                `${tools.msg.generateInstruction(["send"], ["text"])}\n` +
                `${tools.msg.generateCmdExample(ctx.used, "join")}\n` +
                tools.msg.generateNotes([
                    `Use ${formatter.inlineCode("join")} or ${formatter.inlineCode("j")} to simulate a member joining.`,
                    `Use ${formatter.inlineCode("leave")} or ${formatter.inlineCode("l")} to simulate a member leaving.`
                ])
            );

        try {
            const event = { id: ctx.id, participant: ctx.sender.lid, participantPn: ctx.sender.jid };
            const type = validTypes[input];

            if (type === "join") {
                await handleWelcome(ctx, event, Events.UserJoin, true);
            } else {
                await handleWelcome(ctx, event, Events.UserLeave, true);
            }

            await ctx.reply(tools.msg.info(`Simulated ${formatter.inlineCode(type)} event successfully!`));
        } catch (err) {
            await tools.cmd.handleError(ctx, err);
        }
    }
};
