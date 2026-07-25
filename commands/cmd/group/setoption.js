const VALID_OPTIONS = [
    "antiaudio", "antidocument", "antiimage", "antisticker", "antivideo",
    "antigcsw", "antilink", "antispam", "antitagsw", "antitoxic",
    "autokick", "gamerestrict", "welcome"
];

const OPTION_LABELS = {
    antiaudio:    "Anti Audio",
    antidocument: "Anti Document",
    antiimage:    "Anti Image",
    antisticker:  "Anti Sticker",
    antivideo:    "Anti Video",
    antigcsw:     "Anti Group Status",
    antilink:     "Anti Link",
    antispam:     "Anti Spam",
    antitagsw:    "Anti Tag Status",
    antitoxic:    "Anti Toxic",
    autokick:     "Auto Kick",
    gamerestrict: "Game Restrict",
    welcome:      "Welcome"
};

module.exports = {
    name: "setoption",
    aliases: ["setopt", "opt"],
    category: "group",
    role: 1,
    permissions: { botAdmin: true, group: true },
    code: async (ctx) => {
        const input = ctx.text;

        if (!input)
            return await ctx.reply(
                `${tools.msg.generateInstruction(["send"], ["text"])}\n` +
                `${tools.msg.generateCmdExample(ctx.used, "antilink")}\n` +
                tools.msg.generateNotes([
                    `Use ${formatter.inlineCode(`${ctx.used.prefix + ctx.used.command} list`)} to see all options.`,
                    `Use ${formatter.inlineCode(`${ctx.used.prefix + ctx.used.command} status`)} to see current status.`
                ])
            );

        if (input.toLowerCase() === "list")
            return await ctx.reply(await tools.list.get("setoption"));

        if (input.toLowerCase() === "status") {
            const opt = ctx.db.group?.option || {};
            const fmt = (v) => v ? "✅ Enabled" : "❌ Disabled";
            return await ctx.reply(
                `${formatter.bold("Group Option Status")}\n\n` +
                VALID_OPTIONS.map(k => `➛ ${formatter.bold(OPTION_LABELS[k])}: ${fmt(opt[k])}`).join("\n")
            );
        }

        const key = input.toLowerCase();
        if (!VALID_OPTIONS.includes(key))
            return await ctx.reply(tools.msg.info(`"${input}" is not a valid option. Use ${formatter.inlineCode(`${ctx.used.prefix + ctx.used.command} list`)} to see all options.`));

        try {
            const groupDb = ctx.db.group;
            const newVal = !(groupDb?.option?.[key] || false);
            (groupDb.option ??= {})[key] = newVal;
            await groupDb.save();
            await ctx.reply(tools.msg.info(`${formatter.bold(OPTION_LABELS[key])} has been ${newVal ? "enabled" : "disabled"}!`));
        } catch (err) {
            await tools.cmd.handleError(ctx, err);
        }
    }
};
