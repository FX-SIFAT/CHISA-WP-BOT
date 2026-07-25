const VALID_KEYS = ["goodbye", "intro", "welcome"];

module.exports = {
    name: "settext",
    aliases: ["settxt"],
    category: "group",
    role: 1,
    permissions: { botAdmin: true, group: true },
    code: async (ctx) => {
        const key = ctx.args[0]?.toLowerCase();
        const body = ctx.text
            ? (ctx.text.startsWith(`${ctx.args[0]} `) ? ctx.text.slice(ctx.args[0].length + 1) : ctx.text)
            : ctx.quoted?.body;

        if (key === "list")
            return await ctx.reply(await tools.list.get("settext"));

        if (!key || !body)
            return await ctx.reply(
                `${tools.msg.generateInstruction(["send", "reply"], ["text"])}\n` +
                `${tools.msg.generateCmdExample(ctx.used, "welcome Welcome to SIFAT's group!")}\n` +
                tools.msg.generateNotes([
                    `Valid keys: ${VALID_KEYS.map(k => formatter.inlineCode(k)).join(", ")}`,
                    `Use ${formatter.inlineCode(`${ctx.used.prefix + ctx.used.command} list`)} for details.`,
                    `Use ${formatter.inlineCode("delete")} as text to remove a saved entry.`
                ])
            );

        if (!VALID_KEYS.includes(key))
            return await ctx.reply(tools.msg.info(`"${key}" is not a valid key. Valid keys: ${VALID_KEYS.map(k => formatter.inlineCode(k)).join(", ")}.`));

        try {
            const groupDb = ctx.db.group;

            if (body.toLowerCase() === "delete") {
                if (!groupDb.text?.[key])
                    return await ctx.reply(tools.msg.info(`No saved text found for ${formatter.inlineCode(key)}.`));
                delete groupDb.text[key];
                await groupDb.save();
                return await ctx.reply(tools.msg.info(`Text for ${formatter.inlineCode(key)} has been deleted.`));
            }

            (groupDb.text ??= {})[key] = body;
            await groupDb.save();
            await ctx.reply(tools.msg.info(`Text for ${formatter.inlineCode(key)} has been saved.`));
        } catch (err) {
            await tools.cmd.handleError(ctx, err);
        }
    }
};
