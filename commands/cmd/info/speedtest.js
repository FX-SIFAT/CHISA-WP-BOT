const { SpeedTestService } = require("@ginkohub/speedtest-js");

module.exports = {
    name: "speedtest",
    aliases: ["speed"],
    category: "info",
    code: async (ctx) => {
        try {
            await ctx.replyReact("⏳");
            const start   = Date.now();
            const service = new SpeedTestService();
            await service.fetchClientInfo();

            const bestServer    = await service.findBestServer();
            const latencyResult = await service.testLatency(bestServer, 5);
            const downloadSpeed = await service.testDownload(bestServer, null, { threads: 4, duration: 10000 });
            const uploadSpeed   = await service.testUpload(bestServer, null, { duration: 10000 });
            const elapsed       = tools.msg.convertMsToDuration(Date.now() - start);

            const dlRating = downloadSpeed > 50 * 1024 * 1024 ? "🟢" : downloadSpeed > 10 * 1024 * 1024 ? "🟡" : "🔴";
            const ulRating = uploadSpeed   > 20 * 1024 * 1024 ? "🟢" : uploadSpeed   > 5  * 1024 * 1024 ? "🟡" : "🔴";
            const pingRating = latencyResult.latency < 50 ? "🟢" : latencyResult.latency < 150 ? "🟡" : "🔴";

            await ctx.replyReact("✅");
            await ctx.reply(
                `${formatter.bold("🌐 Speed Test Results")}\n\n` +
                `➛ ${formatter.bold("Server")}: ${bestServer.name || "Unknown"}, ${bestServer.country || ""}\n` +
                `➛ ${formatter.bold("Sponsor")}: ${bestServer.sponsor || "N/A"}\n\n` +
                `➛ ${formatter.bold("Ping")}: ${pingRating} ${latencyResult.latency} ms\n` +
                `➛ ${formatter.bold("Download")}: ${dlRating} ${tools.msg.formatSize(downloadSpeed, true)}/s\n` +
                `➛ ${formatter.bold("Upload")}: ${ulRating} ${tools.msg.formatSize(uploadSpeed, true)}/s\n\n` +
                `➛ ${formatter.bold("Test Duration")}: ${elapsed}`
            );
        } catch (err) {
            await ctx.replyReact("❌");
            await tools.cmd.handleError(ctx, err);
        }
    }
};
