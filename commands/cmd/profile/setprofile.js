module.exports = {
    name: "setprofile",
    aliases: ["set", "setp", "setprof"],
    category: "profile",
    code: async (ctx) => {
        const option = ctx.args[0]?.toLowerCase();

        if (!option)
            return await ctx.reply(
                `${tools.msg.generateInstruction(["send"], ["text"])}\n` +
                `${tools.msg.generateCmdExample(ctx.used, tools.cmd.getRandomElement(["autolevelup", "stickerwm SIFAT|MARINxWP"]))}\n` +
                tools.msg.generateNotes([
                    `Use ${formatter.inlineCode(`${ctx.used.prefix + ctx.used.command} list`)} to see all options.`
                ])
            );

        if (option === "list")
            return await ctx.reply(await tools.list.get("setprofile"));

        try {
            const senderDb = ctx.db.user;

            switch (option) {
                case "autolevelup": {
                    const newStatus = !(senderDb?.autolevelup || false);
                    senderDb.autolevelup = newStatus;
                    await senderDb.save();
                    await ctx.reply(tools.msg.info(`Auto level-up has been ${newStatus ? "enabled" : "disabled"}!`));
                    break;
                }

                case "stickerwm": {
                    const body = ctx.args.slice(1).join(" ");

                    if (!body)
                        return await ctx.reply(
                            `${tools.msg.generateInstruction(["send"], ["text"])}\n` +
                            `${tools.msg.generateCmdExample(ctx.used, "stickerwm SIFAT|MARINxWP")}\n` +
                            tools.msg.generateNotes(["Format: packname|author"])
                        );

                    const [packname = "", author = ""] = body.split("|").map(s => s.trim());
                    senderDb.stickerwm = { packname, author };
                    await senderDb.save();
                    await ctx.reply(tools.msg.info(
                        `Sticker watermark saved!\n` +
                        `➛ ${formatter.bold("Pack")}: ${packname || formatter.italic("(empty)")}\n` +
                        `➛ ${formatter.bold("Author")}: ${author || formatter.italic("(empty)")}`
                    ));
                    break;
                }

                default:
                    await ctx.reply(tools.msg.info(`"${option}" is not a valid setting. Use ${formatter.inlineCode(`${ctx.used.prefix + ctx.used.command} list`)} to see options.`));
            }
        } catch (err) {
            await tools.cmd.handleError(ctx, err);
        }
    }
};
