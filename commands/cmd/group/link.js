module.exports = {
    name: "link",
    aliases: ["gclink", "grouplink", "invitelink"],
    category: "group",
    permissions: { botAdmin: true, group: true },
    code: async (ctx) => {
        const input = ctx.args[0]?.toLowerCase();

        if (input === "reset") {
            try {
                await ctx.group().revokeInviteCode();
                const newCode = await ctx.group().inviteCode();
                return await ctx.reply(
                    `${tools.msg.info("Invite link has been reset!")}\nhttps://chat.whatsapp.com/${newCode}`
                );
            } catch (err) {
                return await tools.cmd.handleError(ctx, err);
            }
        }

        try {
            const code = await ctx.group().inviteCode();
            await ctx.reply(
                `https://chat.whatsapp.com/${code}\n\n` +
                tools.msg.generateNotes([
                    `Use ${formatter.inlineCode(`${ctx.used.prefix + ctx.used.command} reset`)} to revoke and generate a new link.`
                ])
            );
        } catch (err) {
            await tools.cmd.handleError(ctx, err);
        }
    }
};
