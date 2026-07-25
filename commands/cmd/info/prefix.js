const fs   = require("node:fs");
const path = require("node:path");

module.exports = {
    name: "prefix",
    aliases: ["pfx"],
    category: "info",
    code: async (ctx) => {
        try {
            const imgs = global.chisaImages || [];
            const randomImg = imgs.length > 0 ? imgs[Math.floor(Math.random() * imgs.length)] : null;
            const send = async (text) => {
                if (randomImg) await ctx.reply({ image: { url: randomImg }, caption: text });
                else await ctx.reply(text);
            };

            if (ctx.args[0]) {
                if (!ctx.sender.isOwner())
                    return await ctx.reply(tools.msg.info("Only the bot owner can change the prefix."));

                const newPrefix = ctx.args[0].trim();
                if (newPrefix.length > 5)
                    return await ctx.reply(tools.msg.info("Prefix must be 5 characters or fewer."));

                const settingsPath = path.resolve(__dirname, "../../../settings.json");
                try {
                    const raw = JSON.parse(fs.readFileSync(settingsPath, "utf8"));
                    raw.bot.prefix = newPrefix;
                    fs.writeFileSync(settingsPath, JSON.stringify(raw, null, 2));
                } catch (e) {
                    return await ctx.reply(tools.msg.info(`Failed to save prefix: ${e.message}`));
                }

                config.bot.prefix = newPrefix;
                if (global.botClient) global.botClient.prefix = newPrefix.split("");

                return await send(
                    `⚙️  *PREFIX UPDATED*\n\n` +
                    `✅ *New Prefix* : ${formatter.inlineCode(newPrefix)}\n` +
                    `💡 *Example*   : ${formatter.inlineCode(`${newPrefix}help`)}`
                );
            }

            const currentPrefix = ctx.used.prefix || ".";
            const savedPrefix   = config.bot?.prefix;
            const display       = savedPrefix || currentPrefix;

            await send(
                `🔖  *BOT PREFIX*\n\n` +
                `🤖 *Bot*       : ${config.bot.name}\n` +
                `🔖 *Prefix*    : ${formatter.inlineCode(display)}\n` +
                `📋 *Menu*      : ${formatter.inlineCode(`${currentPrefix}menu`)}\n` +
                `🛠️ *Developer* : SIFAT\n\n` +
                `💡 *How to use*\n` +
                `  ${formatter.inlineCode(`${currentPrefix}help`)}  ${formatter.inlineCode(`${currentPrefix}coin`)}  ${formatter.inlineCode(`${currentPrefix}rank`)}`
            );
        } catch (err) {
            await tools.cmd.handleError(ctx, err);
        }
    }
};
