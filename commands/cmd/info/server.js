const os   = require("node:os");
const fs   = require("node:fs");
const path = require("node:path");

function bar(used, total, w = 10) {
    const pct    = Math.max(0, Math.min(1, used / total));
    const filled = Math.round(pct * w);
    return `${"▓".repeat(filled)}${"░".repeat(w - filled)} ${(pct * 100).toFixed(1)}%`;
}

module.exports = {
    name: "server",
    category: "info",
    code: async (ctx) => {
        try {
            const totalMem = os.totalmem();
            const freeMem  = os.freemem();
            const usedMem  = totalMem - freeMem;
            const cpus     = os.cpus();

            const cpuUsage = cpus.reduce((acc, cpu) => {
                const total = Object.values(cpu.times).reduce((a, b) => a + b, 0);
                return acc + ((total - cpu.times.idle) / total) * 100;
            }, 0) / cpus.length;

            const dbDir  = ctx.bot.databaseDir;
            const dbSize = fs.existsSync(dbDir)
                ? tools.msg.formatSize(
                    fs.readdirSync(dbDir).reduce((t, f) => t + fs.statSync(path.join(dbDir, f)).size, 0) / 1024
                  )
                : "N/A";

            const uptime  = tools.msg.convertMsToDuration(Date.now() - ctx.me.readyAt);
            const loadAvg = os.loadavg().map(l => l.toFixed(2)).join(" / ");

            const text =
                `🖥️  *SERVER STATUS*\n\n` +
                `🐧 *System*\n` +
                `  ┣ OS       : ${os.type()} (${os.platform()})\n` +
                `  ┣ Arch     : ${os.arch()}\n` +
                `  ┣ Release  : ${os.release()}\n` +
                `  ┗ Host     : ${os.hostname()}\n\n` +
                `💾 *Memory*\n` +
                `  ┣ Used     : ${tools.msg.formatSize(usedMem)} / ${tools.msg.formatSize(totalMem)}\n` +
                `  ┣ Free     : ${tools.msg.formatSize(freeMem)}\n` +
                `  ┗ ${bar(usedMem, totalMem)}\n\n` +
                `⚙️ *CPU*\n` +
                `  ┣ Model    : ${cpus[0].model.trim()}\n` +
                `  ┣ Cores    : ${cpus.length} × ${cpus[0].speed} MHz\n` +
                `  ┣ Usage    : ${cpuUsage.toFixed(1)}%\n` +
                `  ┗ Load Avg : ${loadAvg}\n\n` +
                `🤖 *Runtime*\n` +
                `  ┣ Node.js  : ${process.version}\n` +
                `  ┣ PID      : ${process.pid}\n` +
                `  ┣ Uptime   : ${uptime}\n` +
                `  ┗ Database : ${dbSize} (Simpl.DB / JSON)`;

            const imgs = global.chisaImages || [];
            const randomImg = imgs.length > 0 ? imgs[Math.floor(Math.random() * imgs.length)] : null;
            if (randomImg) await ctx.reply({ image: { url: randomImg }, caption: text });
            else await ctx.reply(text);
        } catch (err) {
            await tools.cmd.handleError(ctx, err);
        }
    }
};
