"use strict";

const LINE      = "─".repeat(32);
const VALID_KEYS = ["donate", "price", "qris"];

module.exports = {
    name: "osettext",
    aliases: ["osettxt", "settext"],
    category: "admin",
    role: 2,
    description: "Set custom text for bot responses (price, donate, qris)",
    usage: "osettext <key> <text> | osettext list",

    async code(ctx) {
        const key  = (ctx.args[0] || "").toLowerCase();
        const text = ctx.text
            ? (ctx.text.startsWith(`${key} `) ? ctx.text.slice(key.length + 1) : ctx.text)
            : ctx.quoted?.body;

        if (!key || key === "list") {
            const botDb   = ctx.db.bot;
            const current = botDb?.text || {};
            const entries = VALID_KEYS.map(k =>
                `  ${formatter.inlineCode(k.padEnd(6))} : ${current[k] ? formatter.italic(current[k]) : "—"}`
            ).join("\n");

            return ctx.reply(
                `╔══[ 📝 *Custom Text Settings* ]\n${LINE}\n` +
                `${entries}\n\n` +
                `  💡 Usage: ${formatter.inlineCode(`${ctx.used.prefix + ctx.used.command} <key> <text>`)}\n` +
                `  🗑️  Delete: ${formatter.inlineCode(`${ctx.used.prefix + ctx.used.command} <key> delete`)}\n` +
                `  🔑 Keys  : ${VALID_KEYS.map(k => formatter.inlineCode(k)).join(", ")}\n` +
                `${LINE}`
            );
        }

        if (!VALID_KEYS.includes(key))
            return ctx.reply(tools.msg.info(
                `❌ Key ${formatter.inlineCode(key)} is not valid!\n` +
                `Valid keys: ${VALID_KEYS.map(k => formatter.inlineCode(k)).join(", ")}`
            ));

        if (!text)
            return ctx.reply(
                `${tools.msg.generateInstruction(["send"], ["text"])}\n` +
                `${tools.msg.generateCmdExample(ctx.used, `${key} Your text here`)}\n` +
                tools.msg.generateNotes([
                    `Use ${formatter.inlineCode("delete")} as the text to remove it.`
                ])
            );

        try {
            const botDb = ctx.db.bot;

            if (text.toLowerCase() === "delete") {
                if (!botDb?.text?.[key])
                    return ctx.reply(tools.msg.info(`⚠️ No text set for ${formatter.inlineCode(key)}.`));
                delete botDb.text[key];
                botDb.save();
                return ctx.reply(tools.msg.info(`🗑️ Text for ${formatter.inlineCode(key)} has been deleted!`));
            }

            (botDb.text ||= {})[key] = text;
            botDb.save();

            return ctx.reply(
                `╔══[ 📝 *Text Saved* ]\n${LINE}\n` +
                `  🔑 Key  : ${formatter.inlineCode(key)}\n` +
                `  📄 Text : ${formatter.italic(text)}\n` +
                `${LINE}`
            );
        } catch (e) { return tools.cmd.handleError(ctx, e); }
    }
};
