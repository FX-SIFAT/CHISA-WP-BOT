"use strict";

const LINE = "─".repeat(32);

module.exports = [
    {
        name: "setbotpp",
        aliases: ["setboticon", "seticonbot", "setppbot"],
        category: "admin",
        role: 2,
        description: "Change the bot's profile picture",
        usage: "setbotpp (send/reply an image)",

        async code(ctx) {
            const hasMedia  = tools.cmd.checkMedia(ctx.msg.messageType, ["image"]);
            const hasQuoted = tools.cmd.checkQuotedMedia(ctx.quoted?.messageType, ["image"]);

            if (!hasMedia && !hasQuoted)
                return ctx.reply(tools.msg.generateInstruction(["send", "reply"], ["image"]));

            try {
                await ctx.replyReact("⏳");
                const buffer = hasMedia
                    ? await ctx.msg.download()
                    : await ctx.quoted.download();

                await ctx.core.updateProfilePicture(ctx.me.id, buffer);
                await ctx.replyReact("✅");
                return ctx.reply(
                    `╔══[ 🖼️ *Bot Profile Picture* ]\n${LINE}\n` +
                    `  ✅ Successfully updated!\n${LINE}`
                );
            } catch (e) { return tools.cmd.handleError(ctx, e); }
        }
    },

    {
        name: "setbotcover",
        aliases: ["setcoverbot"],
        category: "admin",
        role: 2,
        description: "Change the bot's cover/banner image",
        usage: "setbotcover (send/reply an image)",

        async code(ctx) {
            const hasMedia  = tools.cmd.checkMedia(ctx.msg.messageType, ["image"]);
            const hasQuoted = tools.cmd.checkQuotedMedia(ctx.quoted?.messageType, ["image"]);

            if (!hasMedia && !hasQuoted)
                return ctx.reply(tools.msg.generateInstruction(["send", "reply"], ["image"]));

            try {
                await ctx.replyReact("⏳");
                const buffer = hasMedia
                    ? await ctx.msg.download()
                    : await ctx.quoted.download();

                await ctx.core.updateCoverPhoto(buffer);
                await ctx.replyReact("✅");
                return ctx.reply(
                    `╔══[ 🖼️ *Bot Cover Image* ]\n${LINE}\n` +
                    `  ✅ Successfully updated!\n${LINE}`
                );
            } catch (e) { return tools.cmd.handleError(ctx, e); }
        }
    }
];
