module.exports = {
    name: "transfer",
    aliases: ["tf", "send"],
    category: "profile",
    code: async (ctx) => {
        const target     = await ctx.target(["quoted", "mentioned"]);
        const coinAmount = parseInt(ctx.args[target?.source === "quoted" ? 0 : 1], 10);

        const imgs = global.chisaImages || [];
        const randomImg = imgs.length > 0 ? imgs[Math.floor(Math.random() * imgs.length)] : null;
        const send = async (text) => {
            if (randomImg) await ctx.reply({ image: { url: randomImg }, caption: text });
            else await ctx.reply(text);
        };
        const sendInfo = async (body) => send(`💸  *COIN TRANSFER*\n\n` + body);

        if (!target?.jid || !coinAmount || isNaN(coinAmount))
            return await ctx.reply({
                text: `${tools.msg.generateInstruction(["mention", "reply"], ["text"])}\n` +
                    `${tools.msg.generateCmdExample(ctx.used, "@8801XXXXXXXXX 100")}\n` +
                    tools.msg.generateNotes([
                        "Mention or reply to a user, then provide the coin amount.",
                        "Reply format: reply to a message, then send the amount."
                    ]),
                mentions: ["8801XXXXXXXXX@s.whatsapp.net"]
            });

        if (coinAmount <= 0)
            return sendInfo("⚠️ Coin amount must be greater than *0*.");

        if (tools.cmd.areJidsSameUser(target.jid, ctx.sender.lid) || tools.cmd.areJidsSameUser(target.jid, ctx.sender.jid))
            return sendInfo("⚠️ You cannot transfer coins to *yourself*.");

        const senderDb  = ctx.db.user;
        const isOwner   = ctx.sender.isOwner();
        const isPremium = !!senderDb?.premium;

        try {
            const targetDb   = ctx.getDb("users", target.jid);
            const targetName = target.pushName || ctx.getId(target.jid);

            if (isOwner || isPremium) {
                targetDb.coin = (targetDb.coin || 0) + coinAmount;
                await targetDb.save();
                return sendInfo(
                    `✅ *Transfer Successful!*\n\n` +
                    `📤 *To*     : ${targetName}\n` +
                    `🪙 *Amount* : ${coinAmount} coins\n` +
                    `💎 *Source* : Unlimited balance`
                );
            }

            const senderCoins = senderDb?.coin || 0;
            if (senderCoins < coinAmount)
                return sendInfo(
                    `❌ *Insufficient Coins!*\n\n` +
                    `🪙 *You have* : ${senderCoins} coin${senderCoins !== 1 ? "s" : ""}\n` +
                    `💸 *You need* : ${coinAmount} coins`
                );

            targetDb.coin = (targetDb.coin || 0) + coinAmount;
            senderDb.coin = senderCoins - coinAmount;
            await targetDb.save();
            await senderDb.save();

            await sendInfo(
                `✅ *Transfer Successful!*\n\n` +
                `📤 *To*        : ${targetName}\n` +
                `🪙 *Sent*      : ${coinAmount} coins\n` +
                `💰 *Remaining* : ${senderDb.coin} coins`
            );
        } catch (err) {
            await tools.cmd.handleError(ctx, err);
        }
    }
};
