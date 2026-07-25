"use strict";

module.exports = {
    name: "trivia",
    aliases: ["quiz", "question", "tanya"],
    category: "game",
    async code(ctx) {
        try {
            await ctx.replyReact("🎯");
            const d = await tools.api.get("/api/game/trivia");

            const correct = d.correct_answer.replace(/&amp;/g, "&");
            const wrong = (d.incorrect_answers || []).map(a => a.replace(/&amp;/g, "&"));
            const all = [...wrong, correct].sort(() => Math.random() - 0.5);
            const letters = ["A", "B", "C", "D"];
            const correctLetter = letters[all.indexOf(correct)];

            const opts = all.map((a, i) => `  ${formatter.bold(letters[i])}. ${a}`).join("\n");

            await ctx.reply(
                `🎯 ${formatter.bold("TRIVIA")}\n` +
                `📂 ${formatter.italic(d.category)} · ${formatter.italic(d.difficulty?.toUpperCase())}\n\n` +
                `❓ ${formatter.bold(d.question.replace(/&amp;/g, "&"))}\n\n` +
                `${opts}\n\n` +
                `_Reply with the letter! Answer in 15s..._`
            );

            await tools.cmd.delay(15_000);
            await ctx.reply(`✅ ${formatter.bold("Answer:")} ${formatter.bold(correctLetter)}. ${correct}`);
        } catch (e) {
            await ctx.replyReact("❌");
            await tools.cmd.handleError(ctx, e);
        }
    }
};
