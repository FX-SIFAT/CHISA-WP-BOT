const { Baileys, Events } = require("wp-heart");

module.exports = (bot) => {
    bot.ev.on(Events.Call, async (call) => {
        if (!config.system.antiCall || call.status !== "offer") return;

        const fromJid = call.from;
        const fromPnJid = call.callerPn || fromJid;
        const fromId = bot.getId(fromPnJid);
        const isOwner = bot.checkOwner(fromPnJid);
        const fromDb = bot.getDb("users", fromPnJid);

        if (call?.isGroup || isOwner || fromDb?.banned) return;

        const fromPnId = bot.getId(fromPnJid);

        consolefy.info(`Incoming call from: ${fromPnJid}`);

        await bot.core.rejectCall(call.id, fromJid);

        if (fromDb) {
            fromDb.banned = true;
            fromDb.save();
        }

        const reportOwner = tools.cmd.getReportOwner();
        if (reportOwner && reportOwner.length > 0) {
            const { delay } = tools.cmd.calculateDelay(reportOwner.length);
            for (const ownerId of reportOwner) {
                await bot.sendMessage(ownerId + Baileys.S_WHATSAPP_NET, {
                    text: tools.msg.info(`Account @${fromPnId} has been auto-banned due to ${formatter.inlineCode("Anti Call")}.`),
                    mentions: [fromPnJid]
                });
                await tools.cmd.delay(delay);
            }
        }
        await bot.sendMessage(fromJid, {
            text: tools.msg.info("You have been automatically banned for violating the rules!"),
            buttons: [{ text: "Contact Owner", id: `${config.bot?.prefix || ","}owner` }]
        });
    });
};
