module.exports = {
    name: "^prefix$",
    type: "hears",
    code: async (ctx) => {
        try {
            const currentPrefix = config.bot?.prefix || ".";
            const imgs = global.chisaImages || [];
            const randomImg = imgs.length > 0 ? imgs[Math.floor(Math.random() * imgs.length)] : null;
            const text =
                `🔖  *BOT PREFIX*\n\n` +
                `🤖 *Bot*       : ${config.bot.name}\n` +
                `🔖 *Prefix*    : ${formatter.inlineCode(currentPrefix)}\n` +
                `📋 *Menu*      : ${formatter.inlineCode(`${currentPrefix}menu`)}\n` +
                `🛠️ *Developer* : SIFAT\n\n` +
                `💡 *How to use*\n` +
                `  ${formatter.inlineCode(`${currentPrefix}help`)}  ${formatter.inlineCode(`${currentPrefix}coin`)}  ${formatter.inlineCode(`${currentPrefix}rank`)}`;

            if (randomImg) await ctx.reply({ image: { url: randomImg }, caption: text });
            else await ctx.reply(text);
        } catch (err) {
            await tools.cmd.handleError(ctx, err);
        }
    }
};
