const { Events } = require("wp-heart");

module.exports = (bot) => {
    bot.ev.on(Events.ClientReady, async (b) => {
        consolefy.success(`${config.bot.name} by ${config.owner.name}, ready at ${b.user?.id || b.user?.lid}`);

        const botDb = bot.getDb("bot");
        const botRestart = botDb?.restart || {};
        if (botRestart?.jid && botRestart?.timestamp) {
            const timeago = tools.msg.convertMsToDuration(Date.now() - botRestart.timestamp);
            await bot.sendMessage(botRestart.jid, {
                text: tools.msg.info(`Successfully restarted! Took ${timeago}.`),
                edit: botRestart.key
            });
            delete botDb.restart;
            botDb.save();
        }

        if (config.bot?.groupJid) {
            const code = await b.groupInviteCode(config.bot.groupJid).catch(() => null);
            if (code) {
                const groupLink = `https://chat.whatsapp.com/${code}`;
                if (config.bot.groupLink !== groupLink) config.core.set("bot.groupLink", groupLink);
            }
        }
    });
};
