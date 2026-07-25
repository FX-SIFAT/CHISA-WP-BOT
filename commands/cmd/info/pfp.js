"use strict";

module.exports = {
    name: "getpp",
    aliases: ["pfp"],
    category: "info",
    description: "Get profile picture of a user",
    usage: "getpp @user / reply a message",

    async code(ctx) {
        try {
            const target = await ctx.target();

            if (!target.jid)
                return await ctx.reply({
                    text: `${tools.msg.generateInstruction(["send"], ["text"])}\n` +
                        `${tools.msg.generateCmdExample(ctx.used, "@1234567890")}\n` +
                        tools.msg.generateNotes([
                            "Reply/quote a message to target the sender."
                        ]),
                    mentions: ["1234567890@s.whatsapp.net"]
                });

            await ctx.replyReact("🔍");

            const result = await ctx.profilePictureUrl(target.jid);

            if (!result) {
                await ctx.replyReact("❌");
                return await ctx.reply(tools.msg.info("No profile picture found or the account is private."));
            }

            await ctx.replyReact("✅");
            await ctx.reply({
                image: { url: result },
                caption: `➛ ${formatter.bold("Account")}: @${ctx.getId(target.jid)}`,
                mentions: [target.jid]
            });

        } catch (error) {
            await tools.cmd.handleError(ctx, error);
        }
    }
};
