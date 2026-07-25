module.exports = {
    name: "listmute",
    aliases: ["mutelist"],
    category: "group",
    role: 1,
    permissions: { botAdmin: true, group: true },
    code: async (ctx) => {
        try {
            const muteList = ctx.db.group?.mute || [];

            if (!muteList.length)
                return await ctx.reply(tools.msg.info("No muted users in this group."));

            const mentions = [...muteList];
            const text =
                `${formatter.bold(`Muted Users (${muteList.length})`)}\n\n` +
                muteList.map((jid, i) => `${i + 1}. @${ctx.getId(jid)}`).join("\n");

            await ctx.reply({ text, mentions });
        } catch (err) {
            await tools.cmd.handleError(ctx, err);
        }
    }
};
