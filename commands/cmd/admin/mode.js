"use strict";

const LINE  = "─".repeat(32);
const MODES = ["public", "group", "private", "premium", "self"];

module.exports = {
    name: "mode",
    aliases: ["m", "botmode"],
    category: "admin",
    role: 2,
    description: "Change bot access mode",
    usage: "mode <public|group|private|premium|self>",

    async code(ctx) {
        const input = (ctx.text || "").toLowerCase().trim();
        const botDb = ctx.db.bot;
        const current = botDb?.mode || "public";

        if (!input || input === "list" || input === "status") {
            const modeList = MODES.map(m =>
                `  ${m === current ? "✅" : "◻️"} ${formatter.inlineCode(m)}`
            ).join("\n");

            return ctx.reply(
                `╔══[ ⚙️ *Bot Mode* ]\n${LINE}\n` +
                `  Current : ${formatter.bold(current)}\n\n` +
                `  Available modes:\n${modeList}\n\n` +
                `  📌 ${formatter.italic(`public`)   } — Everyone can use\n` +
                `  📌 ${formatter.italic(`group`)    } — Group only (premium: DM too)\n` +
                `  📌 ${formatter.italic(`private`)  } — DM only (premium: group too)\n` +
                `  📌 ${formatter.italic(`premium`)  } — Premium users only\n` +
                `  📌 ${formatter.italic(`self`)     } — Owner only\n` +
                `${LINE}`
            );
        }

        if (!MODES.includes(input))
            return ctx.reply(tools.msg.info(
                `❌ Mode "${formatter.inlineCode(input)}" is invalid!\n` +
                `Valid: ${MODES.map(m => formatter.inlineCode(m)).join(", ")}`
            ));

        if (input === current)
            return ctx.reply(tools.msg.info(`⚠️ Bot is already in ${formatter.inlineCode(input)} mode!`));

        try {
            botDb.mode = input;
            botDb.save();
            await ctx.replyReact("✅");
            return ctx.reply(
                `╔══[ ⚙️ *Mode Changed* ]\n${LINE}\n` +
                `  Before : ${formatter.inlineCode(current)}\n` +
                `  After  : ${formatter.bold(input)}\n` +
                `${LINE}`
            );
        } catch (e) { return tools.cmd.handleError(ctx, e); }
    }
};
