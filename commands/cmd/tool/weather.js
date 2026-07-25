"use strict";

const ICON = desc => {
    const d = (desc || "").toLowerCase();
    if (d.includes("sunny") || d.includes("clear")) return "☀️";
    if (d.includes("cloud")) return "⛅";
    if (d.includes("rain") || d.includes("drizzle")) return "🌧️";
    if (d.includes("thunder") || d.includes("storm")) return "⛈️";
    if (d.includes("snow")) return "❄️";
    if (d.includes("fog") || d.includes("mist")) return "🌫️";
    if (d.includes("wind")) return "💨";
    return "🌡️";
};

module.exports = {
    name: "weather",
    aliases: ["cuaca", "wtr", "temp"],
    category: "tool",
    usage: "weather <city>",
    async code(ctx) {
        try {
            const city = ctx.text?.trim();
            if (!city) {
                return ctx.reply(
                    `${tools.msg.generateInstruction(["send"], ["text"])}\n` +
                    `${tools.msg.generateCmdExample(ctx.used, "Dhaka")}`
                );
            }
            await ctx.replyReact("🌤️");
            const d = await tools.api.get("/api/tools/weather", { city });
            const icon = ICON(d.description);
            await ctx.replyReact("✅");
            await ctx.reply(
                `${icon} ${formatter.bold(tools.msg.ucwords(d.city))} — ${formatter.italic(d.description)}\n\n` +
                `🌡️ ${formatter.bold("Temp")}     : ${d.temp_c}°C / ${d.temp_f}°F\n` +
                `🥵 ${formatter.bold("Feels Like")}: ${d.feels_like_c}°C\n` +
                `💧 ${formatter.bold("Humidity")} : ${d.humidity}%\n` +
                `💨 ${formatter.bold("Wind")}     : ${d.wind_kmph} km/h`
            );
        } catch (e) {
            await ctx.replyReact("❌");
            await tools.cmd.handleError(ctx, e);
        }
    }
};
