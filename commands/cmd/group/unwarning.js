module.exports = {
    name: "unwarning",
    aliases: ["unwarn", "clearwarn"],
    category: "group",
    role: 1,
    permissions: { botAdmin: true, group: true, restrict: true },
    code: async (ctx) => {
        const groupDb = ctx.db.group;

        if (ctx.args[0]?.toLowerCase() === "all") {
            const warnings = groupDb?.warnings || [];
            if (!warnings.length)
                return await ctx.reply(tools.msg.info("No warnings recorded in this group."));
            groupDb.warnings = [];
            await groupDb.save();
            return await ctx.reply(tools.msg.info(`Cleared all warnings for all users (${warnings.length} record${warnings.length !== 1 ? "s" : ""} removed).`));
        }

        const target = await ctx.target(["quoted", "mentioned"]);

        if (!target.jid)
            return await ctx.reply({
                text: `${tools.msg.generateInstruction(["mention", "reply"], ["text"])}\n` +
                    `${tools.msg.generateCmdExample(ctx.used, "@8801XXXXXXXXX")}\n` +
                    tools.msg.generateNotes([
                        "Reply to a message to target the sender.",
                        `Use ${formatter.inlineCode(`${ctx.used.prefix + ctx.used.command} all`)} to clear warnings for everyone.`
                    ]),
                mentions: ["8801XXXXXXXXX@s.whatsapp.net"]
            });

        if (tools.cmd.areJidsSameUser(target.jid, ctx.me.jid) ||
            tools.cmd.areJidsSameUser(target.jid, ctx.me.lid))
            return await ctx.reply(tools.msg.info("Cannot modify the bot's warnings."));

        if (await ctx.group().isOwner(target.jid))
            return await ctx.reply(tools.msg.info("Cannot modify the group owner's warnings."));

        try {
            const warnings = groupDb?.warnings || [];
            const maxWarnings = groupDb?.maxwarnings || 3;

            const idx = warnings.findIndex(w => tools.cmd.areJidsSameUser(w.jid, target.jid));
            if (idx === -1)
                return await ctx.reply(tools.msg.info("This user has no warnings."));

            const newCount = (warnings[idx].count || 1) - 1;

            if (newCount <= 0) {
                warnings.splice(idx, 1);
            } else {
                warnings[idx].count = newCount;
            }

            groupDb.warnings = warnings;
            await groupDb.save();

            await ctx.reply(tools.msg.info(
                newCount <= 0
                    ? "All warnings cleared for this user."
                    : `Warning removed: ${newCount}/${maxWarnings} remaining.`
            ));
        } catch (err) {
            await tools.cmd.handleError(ctx, err);
        }
    }
};
