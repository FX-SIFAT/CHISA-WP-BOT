module.exports = {
    name: "warning",
    aliases: ["warn"],
    category: "group",
    role: 1,
    permissions: { botAdmin: true, group: true, restrict: true },
    code: async (ctx) => {
        const target = await ctx.target(["quoted", "mentioned"]);

        if (!target.jid)
            return await ctx.reply({
                text: `${tools.msg.generateInstruction(["mention", "reply"], ["text"])}\n` +
                    `${tools.msg.generateCmdExample(ctx.used, "@8801XXXXXXXXX")}\n` +
                    tools.msg.generateNotes(["Reply to a message to target the sender."]),
                mentions: ["8801XXXXXXXXX@s.whatsapp.net"]
            });

        if (tools.cmd.areJidsSameUser(target.jid, ctx.me.jid) ||
            tools.cmd.areJidsSameUser(target.jid, ctx.me.lid))
            return await ctx.reply(tools.msg.info("Cannot warn the bot itself."));

        if (await ctx.group().isOwner(target.jid))
            return await ctx.reply(tools.msg.info("Cannot warn the group owner."));

        if (await ctx.group().isAdmin(target.jid))
            return await ctx.reply(tools.msg.info("Cannot warn an admin."));

        try {
            const groupDb = ctx.db.group;
            const warnings = groupDb?.warnings || [];
            const maxWarnings = groupDb?.maxwarnings || 3;

            const idx = warnings.findIndex(w => tools.cmd.areJidsSameUser(w.jid, target.jid));
            let count;

            if (idx !== -1) {
                warnings[idx].count += 1;
                count = warnings[idx].count;
            } else {
                count = 1;
                warnings.push({ jid: target.jid, count });
            }

            groupDb.warnings = warnings;
            await groupDb.save();

            if (count >= maxWarnings) {
                await ctx.reply(tools.msg.info(`Warning limit reached (${count}/${maxWarnings}). Kicking user.`));
                await ctx.group().kick(target.jid);
                groupDb.warnings = warnings.filter(w => !tools.cmd.areJidsSameUser(w.jid, target.jid));
                await groupDb.save();
            } else {
                await ctx.reply(tools.msg.info(`Warning issued: ${count}/${maxWarnings}.`));
            }
        } catch (err) {
            await tools.cmd.handleError(ctx, err);
        }
    }
};
