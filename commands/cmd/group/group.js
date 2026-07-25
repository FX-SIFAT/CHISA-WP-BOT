module.exports = {
    name: "group",
    category: "group",
    role: 1,
    permissions: { botAdmin: true, group: true },
    code: async (ctx) => {
        const input = ctx.text?.toLowerCase();

        if (!input)
            return await ctx.reply(
                `${tools.msg.generateInstruction(["send"], ["text"])}\n` +
                `${tools.msg.generateCmdExample(ctx.used, "open")}\n` +
                tools.msg.generateNotes([
                    `Use ${formatter.inlineCode(`${ctx.used.prefix + ctx.used.command} list`)} to see all options.`,
                    `Use ${formatter.inlineCode(`${ctx.used.prefix + ctx.used.command} status`)} to see current group settings.`
                ])
            );

        if (input === "list") return await ctx.reply(await tools.list.get("group"));

        if (input === "status") {
            try {
                const meta = await ctx.group().metadata();
                const fmt = (v) => v ? "Enabled" : "Disabled";
                return await ctx.reply(
                    `➛ ${formatter.bold("Join")}: ${meta.restrict ? "Closed" : "Open"}\n` +
                    `➛ ${formatter.bold("Messages")}: ${meta.announce ? "Locked" : "Unlocked"}\n` +
                    `➛ ${formatter.bold("Join Approval")}: ${fmt(meta.joinApprovalMode)}\n` +
                    `➛ ${formatter.bold("Member Add")}: ${fmt(meta.memberAddMode)}`
                );
            } catch (err) {
                return await tools.cmd.handleError(ctx, err);
            }
        }

        const actions = {
            open:       () => ctx.group().open(),
            close:      () => ctx.group().close(),
            lock:       () => ctx.group().lock(),
            unlock:     () => ctx.group().unlock(),
            approve:    () => ctx.group().joinApproval("on"),
            disapprove: () => ctx.group().joinApproval("off"),
            invite:     () => ctx.group().membersCanAddMemberMode("on"),
            restrict:   () => ctx.group().membersCanAddMemberMode("off"),
        };

        if (!actions[input])
            return await ctx.reply(tools.msg.info(`"${input}" is not valid. Use ${formatter.inlineCode(`${ctx.used.prefix + ctx.used.command} list`)} to see options.`));

        try {
            await actions[input]();
            await ctx.reply(tools.msg.info("Group setting updated successfully!"));
        } catch (err) {
            await tools.cmd.handleError(ctx, err);
        }
    }
};
