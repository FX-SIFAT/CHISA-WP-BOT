module.exports = {
    name: "ping",
    aliases: ["p"],
    category: "info",
    code: async (ctx) => {
        try {
            const start   = performance.now();
            const pongMsg = await ctx.reply(tools.msg.info("Pong!"));
            const ms      = (performance.now() - start).toFixed(2);
            const uptime  = tools.msg.convertMsToDuration(Date.now() - ctx.me.readyAt);

            const quality = ms < 300 ? "🟢 Excellent" : ms < 700 ? "🟡 Good" : "🔴 Slow";

            await ctx.editMessage(
                ctx.id,
                pongMsg.key,
                tools.msg.info(
                    `➛ ${formatter.bold("Latency")}: ${ms} ms\n` +
                    `➛ ${formatter.bold("Quality")}: ${quality}\n` +
                    `➛ ${formatter.bold("Uptime")}: ${uptime}`
                )
            );
        } catch (err) {
            await tools.cmd.handleError(ctx, err);
        }
    }
};
