module.exports = {
    name: "botgroup",
    aliases: ["botgc", "gcbot"],
    category: "info",
    code: async (ctx) => {
        try {
            const link = config.bot.groupLink;

            if (!link)
                return await ctx.reply(tools.msg.info("No group link has been configured."));

            const text =
                `💬  *BOT COMMUNITY*\n\n` +
                `🤖 *Bot*   : ${config.bot.name}\n` +
                `🔗 *Link*  : ${link}\n\n` +
                `_Join to get updates, report bugs, and connect with other users!_`;

            const imgs = global.chisaImages || [];
            const randomImg = imgs.length > 0 ? imgs[Math.floor(Math.random() * imgs.length)] : null;
            if (randomImg) await ctx.reply({ image: { url: randomImg }, caption: text });
            else await ctx.reply(text);
        } catch (err) {
            await tools.cmd.handleError(ctx, err);
        }
    }
};
