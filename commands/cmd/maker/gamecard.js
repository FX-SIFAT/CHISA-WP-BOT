"use strict";

module.exports = [
    {
        name: "fakeff",
        aliases: ["ffcard", "fakefreefirecard", "genffrecard"],
        category: "maker",
        usage: "fakeff <username> | <uid> | <level> | <rank> | <kills> | <likes>",
        permissions: { coin: 10 },
        async code(ctx) {
            try {
                const pfx = ctx.used.prefix + ctx.used.command;
                const parts = (ctx.text || "").split("|").map(s => s.trim());
                if (parts.length < 3 || !parts[0]) {
                    return ctx.reply(
                        `${tools.msg.generateInstruction(["send"], ["text"])}\n` +
                        `💡 ${formatter.inlineCode(`${pfx} SIFAT | 123456 | 70 | Heroic | 5000 | 1000`)}\n` +
                        `_Fields: username | uid | level | rank | kills | likes_`
                    );
                }
                const [username = "Player", id = "000000", level = "70", rank = "Heroic", kills = "1000", likes = "500"] = parts;
                await ctx.replyReact("🎮");
                const { buffer } = await tools.api.getBinary("/api/maker/fake-ff", { username, id, level, rank, kills, likes });
                await ctx.replyReact("✅");
                await ctx.reply({ image: buffer, caption: `🎮 ${formatter.bold(username)} · Free Fire Card` });
            } catch (e) {
                await ctx.replyReact("❌");
                await tools.cmd.handleError(ctx, e);
            }
        }
    },
    {
        name: "ffprofile",
        aliases: ["fakeprofileff", "fakeffprofile", "genfftprofile"],
        category: "maker",
        usage: "ffprofile <uid> | <nickname> | <level> | <likes> | <server>",
        permissions: { coin: 10 },
        async code(ctx) {
            try {
                const pfx = ctx.used.prefix + ctx.used.command;
                const parts = (ctx.text || "").split("|").map(s => s.trim());
                if (parts.length < 2 || !parts[0]) {
                    return ctx.reply(
                        `${tools.msg.generateInstruction(["send"], ["text"])}\n` +
                        `💡 ${formatter.inlineCode(`${pfx} 123456 | SIFAT | 70 | 1000 | IND`)}\n` +
                        `_Fields: uid | nickname | level | likes | server_`
                    );
                }
                const [uid = "000000", nickname = "Player", level = "70", likes = "500", server = "IND"] = parts;
                await ctx.replyReact("🎮");
                const { buffer } = await tools.api.getBinary("/api/maker/fake-profile-ff", { uid, nickname, level, likes, server });
                await ctx.replyReact("✅");
                await ctx.reply({ image: buffer, caption: `🎮 ${formatter.bold(nickname)} · FF Profile` });
            } catch (e) {
                await ctx.replyReact("❌");
                await tools.cmd.handleError(ctx, e);
            }
        }
    },
    {
        name: "fakeml",
        aliases: ["mlcard", "mobilelegendscard", "genmlcard"],
        category: "maker",
        usage: "fakeml <username> | <id> | <level> | <rank> | <hero> | <winrate> | <match> | <kda>",
        permissions: { coin: 10 },
        async code(ctx) {
            try {
                const pfx = ctx.used.prefix + ctx.used.command;
                const parts = (ctx.text || "").split("|").map(s => s.trim());
                if (parts.length < 3 || !parts[0]) {
                    return ctx.reply(
                        `${tools.msg.generateInstruction(["send"], ["text"])}\n` +
                        `💡 ${formatter.inlineCode(`${pfx} SIFAT | 123456 | 100 | Mythic | Layla | 65.5 | 500 | 5.2`)}\n` +
                        `_Fields: username | id | level | rank | hero | winrate | match | kda_`
                    );
                }
                const [username = "Player", id = "000000", level = "100", rank = "Mythic", hero = "Layla", winrate = "60", match = "100", kda = "5.0"] = parts;
                await ctx.replyReact("🎮");
                const { buffer } = await tools.api.getBinary("/api/maker/fake-ml", { username, id, level, rank, hero, winrate, match, kda });
                await ctx.replyReact("✅");
                await ctx.reply({ image: buffer, caption: `🎮 ${formatter.bold(username)} · Mobile Legends Card` });
            } catch (e) {
                await ctx.replyReact("❌");
                await tools.cmd.handleError(ctx, e);
            }
        }
    },
    {
        name: "afinitas",
        aliases: ["mlafin", "afinitasml", "afin"],
        category: "maker",
        usage: "afinitas <ppurl> | <player> | <hero1> | <hero2> | <hero3> | <hero4> | <hero5>",
        permissions: { coin: 10 },
        async code(ctx) {
            try {
                const pfx = ctx.used.prefix + ctx.used.command;
                const parts = (ctx.text || "").split("|").map(s => s.trim());
                if (parts.length < 3 || !tools.cmd.isUrl(parts[0])) {
                    return ctx.reply(
                        `${tools.msg.generateInstruction(["send"], ["text"])}\n` +
                        `💡 ${formatter.inlineCode(`${pfx} https://i.imgur.com/xx.jpg | SIFAT | Layla | Nana | Kagura | Fanny | Hayabusa`)}\n` +
                        `_Fields: profile image URL | player name | hero1 | hero2 | hero3 | hero4 | hero5_`
                    );
                }
                const [ppurl, player = "Player", hero1 = "Layla", hero2 = "Nana", hero3 = "Kagura", hero4 = "Fanny", hero5 = "Hayabusa"] = parts;
                await ctx.replyReact("🎮");
                const { buffer } = await tools.api.getBinary("/api/maker/fake-afinitas-ml", { ppurl, player, hero1, hero2, hero3, hero4, hero5 });
                await ctx.replyReact("✅");
                await ctx.reply({ image: buffer, caption: `🎮 ${formatter.bold(player)} · ML Afinitas` });
            } catch (e) {
                await ctx.replyReact("❌");
                await tools.cmd.handleError(ctx, e);
            }
        }
    },
    {
        name: "fakecall",
        aliases: ["fakecallios", "iosfakecall", "gencall"],
        category: "maker",
        usage: "fakecall <name> | <number> | <avatar url>",
        permissions: { coin: 10 },
        async code(ctx) {
            try {
                const pfx = ctx.used.prefix + ctx.used.command;
                const parts = (ctx.text || "").split("|").map(s => s.trim());
                if (parts.length < 2 || !parts[0]) {
                    return ctx.reply(
                        `${tools.msg.generateInstruction(["send"], ["text"])}\n` +
                        `💡 ${formatter.inlineCode(`${pfx} SIFAT | 01806365125 | https://i.imgur.com/xx.jpg`)}\n` +
                        `_Fields: name | number | avatar URL (optional)_`
                    );
                }
                const [name = "Unknown", number = "0000000000", avatar = ""] = parts;
                await ctx.replyReact("📱");
                const params = { name, number };
                if (avatar && tools.cmd.isUrl(avatar)) params.avatar = avatar;
                const { buffer } = await tools.api.getBinary("/api/maker/fakecall-ios", params);
                await ctx.replyReact("✅");
                await ctx.reply({ image: buffer, caption: `📱 Incoming call from ${formatter.bold(name)}` });
            } catch (e) {
                await ctx.replyReact("❌");
                await tools.cmd.handleError(ctx, e);
            }
        }
    }
];
