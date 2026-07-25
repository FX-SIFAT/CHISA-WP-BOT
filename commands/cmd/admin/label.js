"use strict";

const LINE = "─".repeat(32);

module.exports = {
    name: "label",
    aliases: ["tag", "botlabel"],
    category: "admin",
    role: 2,
    description: "Set bot's custom label/tag in all groups",
    usage: "label <text> (max 30 chars)",

    async code(ctx) {
        const input = ctx.text?.trim();

        if (!input)
            return ctx.reply(
                `╔══[ 🏷️ *Bot Label* ]\n${LINE}\n` +
                `${tools.msg.generateInstruction(["send"], ["text"])}\n` +
                `${tools.msg.generateCmdExample(ctx.used, "Bot | CHISA")}\n` +
                `${tools.msg.generateNotes(["Maximum 30 characters.", "Sets the bot's label in all non-community groups."])}\n` +
                `${LINE}`
            );

        if (input.length > 30)
            return ctx.reply(tools.msg.info(`❌ Label too long! (${input.length}/30 characters)`));

        try {
            const allGroups = await ctx.core.groupFetchAllParticipating();
            const groupJids = Object.values(allGroups)
                .filter(g => !g.announce && !g.isCommunity && !g.isCommunityAnnounce)
                .map(g => g.id);

            if (!groupJids.length)
                return ctx.reply(tools.msg.info("⚠️ No eligible groups found."));

            const { delay } = tools.cmd.calculateDelay(groupJids.length);
            const waitMsg = await ctx.reply(
                `╔══[ 🏷️ *Setting Label* ]\n${LINE}\n` +
                `  🏷️  Label  : ${formatter.inlineCode(input)}\n` +
                `  📦 Groups : ${groupJids.length}\n` +
                `  ⏳ Working...\n${LINE}`
            );

            let success = 0, failed = 0;
            for (const groupJid of groupJids) {
                try {
                    await ctx.core.updateMemberLabel(groupJid, input);
                    success++;
                } catch { failed++; }
                await tools.cmd.delay(delay);
            }

            return ctx.editMessage(ctx.id, waitMsg.key,
                `╔══[ 🏷️ *Label Updated* ]\n${LINE}\n` +
                `  🏷️  Label   : ${formatter.inlineCode(input)}\n` +
                `  ✅ Success  : ${success}\n` +
                `  ❌ Failed   : ${failed}\n` +
                `  📦 Total    : ${groupJids.length}\n` +
                `${LINE}`
            );
        } catch (e) { return tools.cmd.handleError(ctx, e); }
    }
};
