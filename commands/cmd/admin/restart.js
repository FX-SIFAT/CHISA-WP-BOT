"use strict";

const { exec } = require("node:child_process");
const LINE     = "─".repeat(32);

module.exports = {
    name: "restart",
    aliases: ["reboot", "r"],
    category: "admin",
    role: 2,
    description: "Restart the bot process",
    usage: "restart",

    async code(ctx) {
        try {
            const waitMsg = await ctx.reply(
                `╔══[ 🔄 *Restarting* ]\n${LINE}\n` +
                `  ⏳ Bot is restarting, please wait...\n` +
                `${LINE}`
            );

            const botDb = ctx.db.bot;
            botDb.restart = { jid: ctx.id, key: waitMsg.key, timestamp: Date.now() };
            botDb.save();

            if (process.env.PM2_HOME) {
                exec("pm2 restart $(basename $(pwd))");
            } else {
                setTimeout(() => process.exit(0), 1000);
            }
        } catch (e) { return tools.cmd.handleError(ctx, e); }
    }
};
