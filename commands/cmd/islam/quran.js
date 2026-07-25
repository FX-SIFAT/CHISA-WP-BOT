"use strict";

module.exports = [
    {
        name: "rquran",
        aliases: ["randomayah", "randverse", "quranrandom"],
        category: "islam",
        async code(ctx) {
            try {
                await ctx.replyReact("📖");
                const d = await tools.api.get("/api/islam/random");
                const v = d.data;
                await ctx.replyReact("✅");
                await ctx.reply(
                    `📖 ${formatter.bold(`${v.surah_name} (${v.surah_arabic})`)} · Ayah ${formatter.bold(v.ayah)}\n` +
                    `🕌 ${formatter.italic(v.place)}\n\n` +
                    `${formatter.bold(v.text)}\n\n` +
                    `_${v.translation_en}_`
                );
            } catch (e) {
                await ctx.replyReact("❌");
                await tools.cmd.handleError(ctx, e);
            }
        }
    },
    {
        name: "ayah",
        aliases: ["quran", "verse"],
        category: "islam",
        usage: "ayah <surah> <ayah>",
        async code(ctx) {
            try {
                const [s, a] = (ctx.text || "").trim().split(/\s+/);
                if (!s || !a || isNaN(s) || isNaN(a)) {
                    return ctx.reply(
                        `${tools.msg.generateInstruction(["send"], ["text"])}\n` +
                        `${tools.msg.generateCmdExample(ctx.used, "2 255")}`
                    );
                }
                await ctx.replyReact("📖");
                const d = await tools.api.get("/api/islam/ayah", { surah: s, ayah: a });
                const v = d.data;
                await ctx.replyReact("✅");
                await ctx.reply(
                    `📖 ${formatter.bold(`${v.surah_name} (${v.surah_arabic})`)} · Ayah ${formatter.bold(v.ayah)}\n` +
                    `🕌 ${formatter.italic(v.place)}\n\n` +
                    `${formatter.bold(v.text)}\n\n` +
                    `🇬🇧 _${v.translation_en}_\n` +
                    (v.translation_bn ? `🇧🇩 _${v.translation_bn}_` : "")
                );
            } catch (e) {
                await ctx.replyReact("❌");
                await tools.cmd.handleError(ctx, e);
            }
        }
    },
    {
        name: "qsearch",
        aliases: ["quransearch", "searchquran", "qfind"],
        category: "islam",
        usage: "qsearch <keyword>",
        async code(ctx) {
            try {
                const q = ctx.text?.trim();
                if (!q) {
                    return ctx.reply(
                        `${tools.msg.generateInstruction(["send"], ["text"])}\n` +
                        `${tools.msg.generateCmdExample(ctx.used, "mercy")}`
                    );
                }
                await ctx.replyReact("🔍");
                const d = await tools.api.get("/api/islam/search", { q });
                const results = d.data || [];
                if (!results.length) {
                    await ctx.replyReact("❌");
                    return ctx.reply(tools.msg.info(config.msg.notFound));
                }
                const top = results.slice(0, 5);
                const text = top.map((v, i) =>
                    `${formatter.bold(`[${i + 1}]`)} ${v.surah_name} · Ayah ${v.ayah}\n` +
                    `     ${v.text?.slice(0, 60)}…\n` +
                    `     _${v.translation_en?.slice(0, 80)}…_`
                ).join("\n\n");
                await ctx.replyReact("✅");
                await ctx.reply(`🔍 ${formatter.bold(`Quran Search`)} — _${q}_\n\n${text}`);
            } catch (e) {
                await ctx.replyReact("❌");
                await tools.cmd.handleError(ctx, e);
            }
        }
    },
    {
        name: "surah",
        aliases: ["getsurah", "surahinfo"],
        category: "islam",
        usage: "surah <number>",
        async code(ctx) {
            try {
                const num = ctx.text?.trim();
                if (!num || isNaN(num)) {
                    return ctx.reply(
                        `${tools.msg.generateInstruction(["send"], ["text"])}\n` +
                        `${tools.msg.generateCmdExample(ctx.used, "36")}`
                    );
                }
                await ctx.replyReact("📖");
                const d = await tools.api.get("/api/islam/surah", { number: num });
                const s = d.data;
                const verses = s.verses?.slice(0, 3) || [];
                const preview = verses.map((v, i) =>
                    `  ${formatter.bold(`[${i + 1}]`)} ${v.text?.slice(0, 50)}…\n  _${v.translation_en?.slice(0, 70)}…_`
                ).join("\n");
                await ctx.replyReact("✅");
                await ctx.reply(
                    `📖 ${formatter.bold(`${s.name} (${s.name_translations?.ar || ""})`)} · Surah ${formatter.bold(s.number_of_surah)}\n` +
                    `🌍 _${s.name_translations?.en || ""}_ · ${formatter.bold(s.number_of_ayah)} Ayahs · ${s.place}\n\n` +
                    (preview ? `${formatter.bold("First 3 verses:")}\n${preview}\n\n` : "") +
                    (s.recitations?.[0]?.audio_url ? `🎵 ${s.recitations[0].audio_url}` : "")
                );
            } catch (e) {
                await ctx.replyReact("❌");
                await tools.cmd.handleError(ctx, e);
            }
        }
    },
    {
        name: "surahs",
        aliases: ["surahlist", "allsurahs", "quranlist"],
        category: "islam",
        async code(ctx) {
            try {
                await ctx.replyReact("📖");
                const d = await tools.api.get("/api/islam/surahs");
                const list = d.data || [];
                const text = list.map(s =>
                    `${formatter.bold(`[${s.number_of_surah}]`)} ${s.name} — _${s.name_translations?.en}_ (${s.number_of_ayah} ayahs)`
                ).join("\n");
                await ctx.replyReact("✅");
                await ctx.reply(`📖 ${formatter.bold("114 Surahs of the Quran")}\n\n${text}`);
            } catch (e) {
                await ctx.replyReact("❌");
                await tools.cmd.handleError(ctx, e);
            }
        }
    }
];
