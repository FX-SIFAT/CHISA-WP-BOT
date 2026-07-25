"use strict";

const LINE = "─".repeat(32);

function helpText(ctx, action) {
    return {
        text: `╔══[ ${action === "ban" ? "🚫" : "✅"} *${action === "ban" ? "Ban" : "Unban"} User* ]\n${LINE}\n` +
            `${tools.msg.generateInstruction(["send"], ["text"])}\n` +
            `${tools.msg.generateCmdExample(ctx.used, "@1234567890 -s")}\n` +
            `${tools.msg.generateNotes(["Reply/quote a message to target the sender."])}\n` +
            tools.msg.generatesFlagInfo({ "-s": "Silent — don't notify the target" }) +
            `\n${LINE}`,
        mentions: ["1234567890@s.whatsapp.net"]
    };
}

const banCmd = {
    name: "ban",
    aliases: ["banuser", "bu"],
    category: "admin",
    role: 2,
    description: "Ban a user or list all banned users",
    usage: "ban @user [-s] | ban list",

    async code(ctx) {
        const sub = (ctx.args[0] || "").toLowerCase();

        if (sub === "list") {
            try {
                const users = ctx.db.users.getMany(u => u.banned);
                if (!users.length)
                    return ctx.reply(`╔══[ 🚫 *Banned Users* ]\n${LINE}\n  ℹ️ No banned users found.\n${LINE}`);

                const mentions = users.map(u => u.jid);
                const list = users.map((u, i) => `  ${i + 1}. @${ctx.getId(u.jid)}`).join("\n");
                return ctx.reply({
                    text: `╔══[ 🚫 *Banned Users* | ${users.length} total ]\n${LINE}\n${list}\n${LINE}`,
                    mentions
                });
            } catch (e) { return tools.cmd.handleError(ctx, e); }
        }

        const target = await ctx.target();
        if (!target.jid) return ctx.reply(helpText(ctx, "ban"));

        const flag = ctx.flag({ silent: { type: "boolean", short: "s", default: false } });

        try {
            const targetDb = ctx.getDb("users", target.jid);

            if (targetDb?.banned)
                return ctx.reply({
                    text: tools.msg.info(`⚠️ @${ctx.getId(target.jid)} is already banned!`),
                    mentions: [target.jid]
                });

            targetDb.banned = true;
            targetDb.save();

            await ctx.replyReact("✅");
            if (!flag.silent && !config.system.restrict)
                await ctx.sendMessage(target.jid, tools.msg.info("🚫 You have been *banned* by the owner."));

            return ctx.reply({
                text: `╔══[ 🚫 *User Banned* ]\n${LINE}\n  👤 @${ctx.getId(target.jid)}\n${LINE}`,
                mentions: [target.jid]
            });
        } catch (e) { return tools.cmd.handleError(ctx, e); }
    }
};

const unbanCmd = {
    name: "unban",
    aliases: ["unbanuser", "ubu"],
    category: "admin",
    role: 2,
    description: "Unban a previously banned user",
    usage: "unban @user [-s]",

    async code(ctx) {
        const target = await ctx.target();
        if (!target.jid) return ctx.reply(helpText(ctx, "unban"));

        const flag = ctx.flag({ silent: { type: "boolean", short: "s", default: false } });

        try {
            const targetDb = ctx.getDb("users", target.jid);

            if (!targetDb?.banned)
                return ctx.reply({
                    text: tools.msg.info(`⚠️ @${ctx.getId(target.jid)} is not banned!`),
                    mentions: [target.jid]
                });

            targetDb.banned = false;
            targetDb.save();

            await ctx.replyReact("✅");
            if (!flag.silent && !config.system.restrict)
                await ctx.sendMessage(target.jid, tools.msg.info("✅ You have been *unbanned* by the owner."));

            return ctx.reply({
                text: `╔══[ ✅ *User Unbanned* ]\n${LINE}\n  👤 @${ctx.getId(target.jid)}\n${LINE}`,
                mentions: [target.jid]
            });
        } catch (e) { return tools.cmd.handleError(ctx, e); }
    }
};

module.exports = [banCmd, unbanCmd];
