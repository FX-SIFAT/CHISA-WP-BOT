const fs   = require("node:fs");
const path = require("node:path");

module.exports = {
    name: "about",
    aliases: ["bot", "infobot"],
    category: "info",
    code: async (ctx) => {
        try {
            const pkg      = require("../../../package.json");
            const dbDir    = ctx.bot.databaseDir;
            const dbSize   = fs.existsSync(dbDir)
                ? tools.msg.formatSize(
                    fs.readdirSync(dbDir).reduce((t, f) => t + fs.statSync(path.join(dbDir, f)).size, 0) / 1024
                  )
                : "N/A";

            const totalUsers = ctx.db.users.getAll().length;
            const uptime     = tools.msg.convertMsToDuration(Date.now() - ctx.me.readyAt);
            const mode       = tools.msg.ucwords(ctx.db.bot?.mode || "public");

            const text =
                `🤖  *CHISA BOT*\n\n` +
                `_Hello! I am ${config.bot.name}, a WhatsApp bot owned by ${config.owner.name}. ` +
                `I support sticker creation, AI features, group management, and much more!_\n\n` +
                `🤖 *Bot*          : ${config.bot.name}\n` +
                `🔖 *Version*      : v${pkg.version}\n` +
                `👑 *Owner*        : ${config.owner.name}\n` +
                `🛠️ *Developer*    : SIFAT\n` +
                `📦 *Library*      : wp-heart\n` +
                `🌐 *Mode*         : ${mode}\n` +
                `⏱️ *Uptime*       : ${uptime}\n` +
                `👥 *Total Users*  : ${totalUsers}\n` +
                `💾 *Database*     : ${dbSize} (Simpl.DB / JSON)`;

            const imgs = global.chisaImages || [];
            const randomImg = imgs.length > 0 ? imgs[Math.floor(Math.random() * imgs.length)] : null;
            if (randomImg) await ctx.reply({ image: { url: randomImg }, caption: text });
            else await ctx.reply(text);
        } catch (err) {
            await tools.cmd.handleError(ctx, err);
        }
    }
};
