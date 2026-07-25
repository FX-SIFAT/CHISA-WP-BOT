"use strict";

const LINE = "─".repeat(32);

function formatExpiry(exp) {
    if (!exp) return "♾️ Permanent";
    const diff = exp - Date.now();
    if (diff <= 0) return "⏰ Expired";
    return `⏳ ${tools.msg.convertMsToDuration(diff)} remaining`;
}

async function doAdd(ctx) {
    const target = await ctx.target();
    const daysIdx = target.source === "quoted" ? 0 : 1;
    const daysAmount = parseInt(ctx.args[daysIdx], 10);

    if (!target.jid)
        return ctx.reply({
            text: `╔══[ 💎 *Add Premium* ]\n${LINE}\n` +
                `${tools.msg.generateInstruction(["send"], ["text"])}\n` +
                `${tools.msg.generateCmdExample(ctx.used, "@1234567890 30 -s")}\n` +
                `${tools.msg.generateNotes(["Reply to target the sender.", "Omit days for permanent premium."])}\n` +
                tools.msg.generatesFlagInfo({ "-s": "Silent — don't notify target" }) + `\n${LINE}`,
            mentions: ["1234567890@s.whatsapp.net"]
        });

    if (!isNaN(daysAmount) && daysAmount <= 0)
        return ctx.reply(tools.msg.info("⚠️ Days must be greater than 0!"));

    const flag = ctx.flag({ silent: { type: "boolean", short: "s", default: false } });
    const isPermanent = isNaN(daysAmount);

    try {
        const targetDb = ctx.getDb("users", target.jid);
        targetDb.premium = true;

        if (!isPermanent) {
            targetDb.premiumExpiration = Date.now() + daysAmount * 864e5;
        } else {
            delete targetDb.premiumExpiration;
        }
        targetDb.save();

        await ctx.replyReact("✅");
        if (!flag.silent && !config.system.restrict)
            await ctx.sendMessage(target.jid, tools.msg.info(
                isPermanent
                    ? "💎 You have been granted *permanent premium* by the owner!"
                    : `💎 You have been granted *premium for ${daysAmount} days* by the owner!`
            ));

        return ctx.reply({
            text: `╔══[ 💎 *Premium Added* ]\n${LINE}\n` +
                `  👤 User     : @${ctx.getId(target.jid)}\n` +
                `  ⏱️  Duration : ${isPermanent ? "♾️ Permanent" : `${daysAmount} days`}\n` +
                `  📅 Expires  : ${isPermanent ? "Never" : new Date(targetDb.premiumExpiration).toLocaleDateString("en-GB")}\n` +
                `${LINE}`,
            mentions: [target.jid]
        });
    } catch (e) { return tools.cmd.handleError(ctx, e); }
}

async function doRemove(ctx) {
    const target = await ctx.target();
    if (!target.jid)
        return ctx.reply({
            text: `╔══[ ❌ *Remove Premium* ]\n${LINE}\n` +
                `${tools.msg.generateInstruction(["send"], ["text"])}\n` +
                `${tools.msg.generateCmdExample(ctx.used, "@1234567890 -s")}\n` +
                `${tools.msg.generateNotes(["Reply to target the sender."])}\n` +
                tools.msg.generatesFlagInfo({ "-s": "Silent — don't notify target" }) + `\n${LINE}`,
            mentions: ["1234567890@s.whatsapp.net"]
        });

    const flag = ctx.flag({ silent: { type: "boolean", short: "s", default: false } });

    try {
        const targetDb = ctx.getDb("users", target.jid);

        if (!targetDb?.premium)
            return ctx.reply({
                text: tools.msg.info(`⚠️ @${ctx.getId(target.jid)} is not a premium user!`),
                mentions: [target.jid]
            });

        delete targetDb.premium;
        delete targetDb.premiumExpiration;
        targetDb.save();

        await ctx.replyReact("✅");
        if (!flag.silent && !config.system.restrict)
            await ctx.sendMessage(target.jid, tools.msg.info("❌ Your *premium* has been removed by the owner."));

        return ctx.reply({
            text: `╔══[ ❌ *Premium Removed* ]\n${LINE}\n  👤 @${ctx.getId(target.jid)}\n${LINE}`,
            mentions: [target.jid]
        });
    } catch (e) { return tools.cmd.handleError(ctx, e); }
}

async function doList(ctx) {
    try {
        const users = ctx.db.users.getMany(u => u.premium);
        if (!users.length)
            return ctx.reply(`╔══[ 💎 *Premium Users* ]\n${LINE}\n  ℹ️ No premium users found.\n${LINE}`);

        const mentions = users.map(u => u.jid);
        const list = users.map((u, i) =>
            `  ${i + 1}. @${ctx.getId(u.jid)}\n     └ ${formatExpiry(u.premiumExpiration)}`
        ).join("\n");

        return ctx.reply({
            text: `╔══[ 💎 *Premium Users* | ${users.length} total ]\n${LINE}\n${list}\n${LINE}`,
            mentions
        });
    } catch (e) { return tools.cmd.handleError(ctx, e); }
}

module.exports = [
    {
        name: "addpremium",
        aliases: ["addpremiumuser", "addpremuser", "addprem", "apu"],
        category: "admin",
        role: 2,
        description: "Grant premium to a user (optional: specify days)",
        usage: "addpremium @user [days] [-s]",
        async code(ctx) { return doAdd(ctx); }
    },
    {
        name: "delpremium",
        aliases: ["delpremiumuser", "delpremuser", "delprem", "dpu"],
        category: "admin",
        role: 2,
        description: "Remove premium from a user",
        usage: "delpremium @user [-s]",
        async code(ctx) { return doRemove(ctx); }
    },
    {
        name: "listpremium",
        aliases: ["listpremiumuser", "listpremuser", "listprem"],
        category: "admin",
        role: 2,
        description: "List all premium users with expiry info",
        usage: "listpremium",
        async code(ctx) { return doList(ctx); }
    }
];
