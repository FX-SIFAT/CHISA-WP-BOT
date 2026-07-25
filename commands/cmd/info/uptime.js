"use strict";

const os   = require("node:os");
const fs   = require("node:fs");
const path = require("node:path");

function fmtBytes(bytes) {
    if (bytes < 1024)       return `${bytes} B`;
    if (bytes < 1048576)    return `${(bytes / 1024).toFixed(1)} KiB`;
    if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(1)} MiB`;
    return `${(bytes / 1073741824).toFixed(2)} GiB`;
}

function buildBar(used, total, width = 10) {
    const pct    = Math.max(0, Math.min(1, used / total));
    const filled = Math.round(pct * width);
    return `${"▓".repeat(filled)}${"░".repeat(width - filled)} ${(pct * 100).toFixed(1)}%`;
}

module.exports = {
    name: "uptime",
    aliases: ["runtime", "stats", "status"],
    category: "info",
    description: "Show bot uptime and full system stats",
    usage: "uptime",

    async code(ctx) {
        try {
            const start   = Date.now();
            await ctx.replyReact("⏱️");
            const latency = Date.now() - start;

            const botUptime = ctx.me?.readyAt ? Date.now() - ctx.me.readyAt : 0;
            const sysUptime = os.uptime() * 1000;

            const procMem  = process.memoryUsage();
            const sysTotal = os.totalmem();
            const sysFree  = os.freemem();
            const sysUsed  = sysTotal - sysFree;

            const cpus      = os.cpus();
            const cpuModel  = cpus[0]?.model?.trim() || "Unknown";
            const cpuCount  = cpus.length;
            const totalCmds = ctx.bot.cmd.size;

            const dbSize = (() => {
                try {
                    const dir = ctx.bot.databaseDir;
                    if (!fs.existsSync(dir)) return "N/A";
                    return fmtBytes(
                        fs.readdirSync(dir).reduce((sum, f) => {
                            try { return sum + fs.statSync(path.join(dir, f)).size; } catch { return sum; }
                        }, 0)
                    );
                } catch { return "N/A"; }
            })();

            const text =
                `⏱️  *BOT STATUS & STATS*\n\n` +
                `🤖 *Bot*\n` +
                `  ┣ Uptime    : ${formatter.bold(tools.msg.convertMsToDuration(botUptime))}\n` +
                `  ┣ Latency   : ${formatter.bold(latency + " ms")}\n` +
                `  ┣ Commands  : ${formatter.bold(String(totalCmds))}\n` +
                `  ┗ DB Size   : ${formatter.bold(dbSize)}\n\n` +
                `💾 *Memory — Process*\n` +
                `  ┣ RSS       : ${fmtBytes(procMem.rss)}\n` +
                `  ┣ Heap Used : ${fmtBytes(procMem.heapUsed)}\n` +
                `  ┗ Heap Total: ${fmtBytes(procMem.heapTotal)}\n\n` +
                `🖥️ *Memory — System*\n` +
                `  ┣ Used : ${fmtBytes(sysUsed)} / ${fmtBytes(sysTotal)}\n` +
                `  ┗ ${buildBar(sysUsed, sysTotal)}\n\n` +
                `⚙️ *CPU*\n` +
                `  ┣ Model  : ${cpuModel}\n` +
                `  ┗ Cores  : ${cpuCount}\n\n` +
                `🐧 *System*\n` +
                `  ┣ Platform : ${os.platform()} (${os.arch()})\n` +
                `  ┣ Node.js  : ${process.version}\n` +
                `  ┗ Up Since : ${tools.msg.convertMsToDuration(sysUptime)}`;

            const imgs = global.chisaImages || [];
            const randomImg = imgs.length > 0 ? imgs[Math.floor(Math.random() * imgs.length)] : null;
            if (randomImg) await ctx.reply({ image: { url: randomImg }, caption: text });
            else await ctx.reply(text);

        } catch (error) {
            await tools.cmd.handleError(ctx, error);
        }
    }
};
