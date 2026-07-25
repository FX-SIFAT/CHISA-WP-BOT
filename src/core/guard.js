const { Baileys, Cooldown } = require("wp-heart");
const moment = require("moment-timezone");

module.exports = (bot) => {
    bot.use(async (ctx, next) => {
        const isGroup = ctx.isGroup();
        const isPrivate = ctx.isPrivate();
        const senderJid = ctx.sender.jid;
        const senderId = ctx.getId(senderJid);
        const groupJid = isGroup ? ctx.id : null;
        const groupId = isGroup ? ctx.getId(groupJid) : null;
        const isOwner = ctx.sender.isOwner();
        const isAdmin = isGroup ? await ctx.group().isSenderAdmin() : false;

        const botDb = ctx.db.bot;
        const senderDb = ctx.db.user;
        const groupDb = ctx.db.group;

        if (botDb?.mode === "premium" && !isOwner && !senderDb?.premium) return;
        if (botDb?.mode === "group" && isPrivate && !isOwner && !senderDb?.premium) return;
        if (botDb?.mode === "private" && isGroup && !isOwner && !senderDb?.premium) return;
        if (botDb?.mode === "self" && !isOwner) return;

        if (groupDb?.mutebot === "owner" && !isOwner) return;
        if (groupDb?.mutebot && !isOwner && !isAdmin) return;
        const muteList = groupDb?.mute || [];
        if (muteList.includes(ctx.sender.lid)) return;

        if (isGroup && !ctx.msg.key.fromMe) {
            consolefy.info(`Incoming command: ${ctx.used.command}, group: ${groupId}, sender: ${senderId}`);
        } else if (isPrivate && !ctx.msg.key.fromMe) {
            consolefy.info(`Incoming command: ${ctx.used.command}, from: ${senderId}`);
        }

        const xpGain = 10;
        const xpToLevelUp = 100;
        let newSenderXp = (senderDb?.xp || 0) + xpGain;
        if (newSenderXp >= xpToLevelUp) {
            const senderLevel = senderDb?.level || 0;
            let newSenderLevel = senderLevel + 1;
            newSenderXp -= xpToLevelUp;
            if (senderDb?.autolevelup) {
                const profilePictureUrl = await ctx.profilePictureUrl(senderJid);
                const canvasUrl = tools.api.createUrl("siputzx", "/api/canvas/level-up", {
                    backgroundURL: "https://picsum.photos/600/150",
                    avatarURL: profilePictureUrl,
                    fromLevel: senderLevel,
                    toLevel: newSenderLevel,
                    name: ctx.sender.pushName
                });
                await ctx.reply({
                    image: { url: canvasUrl },
                    caption: tools.msg.info(`Congratulations! You have leveled up to level ${newSenderLevel}.`),
                    buttons: [{ text: "Disable Auto Level-Up", id: `${ctx.used.prefix}setprofile autolevelup` }]
                });
            }
            senderDb.xp = newSenderXp;
            senderDb.level = newSenderLevel;
            senderDb.save();
        } else {
            senderDb.xp = newSenderXp;
            senderDb.save();
        }

        const simulateTyping = async () => {
            if (config.system.autoTypingOnCmd) await ctx.simulateTyping();
        };

        const command = [...ctx.bot.cmd.values()].find(cmd =>
            [cmd.name, ...(cmd?.aliases || [])].some(name => name?.toLowerCase() === ctx.used.command?.toLowerCase())
        );
        const restrictions = [{
            key: "banned",
            condition: senderDb?.banned && ctx.used.command !== "owner",
            msg: config.msg.banned,
            buttons: [{ text: "Contact Owner", id: `${ctx.used.prefix}owner` }],
            reaction: "🚫"
        }, {
            key: "cooldown",
            condition: new Cooldown(ctx, config.system.cooldown, "multi").onCooldown && !isOwner && !senderDb?.premium,
            msg: config.msg.cooldown,
            reaction: "💤"
        }, {
            key: "gamerestrict",
            condition: groupDb?.option?.gamerestrict && isGroup && !isOwner && !isAdmin && command?.category === "game",
            msg: config.msg.gamerestrict,
            reaction: "🎮"
        }, {
            key: "privatePremiumOnly",
            condition: config.system.privatePremiumOnly && !isOwner && !senderDb?.premium && !["price", "owner"].includes(ctx.used.command),
            msg: config.msg.privatePremiumOnly,
            buttons: [{ text: "Premium Price", id: `${ctx.used.prefix}price` }, { text: "Contact Owner", id: `${ctx.used.prefix}owner` }],
            reaction: "💎"
        }, {
            key: "requireBotGroupMembership",
            condition: await (async () => {
                if (!config.system.requireBotGroupMembership || isOwner || senderDb?.premium || ctx.used.command === "botgroup" || !config.bot.groupJid) return false;
                const now = Date.now();
                const duration = 24 * 60 * 60 * 1000;
                if (senderDb?.botGroupMembership?.isMember && now - senderDb?.botGroupMembership?.timestamp < duration) return senderDb.botGroupMembership.isMember;
                const isMember = await ctx.group(config.bot.groupJid).isMemberExist(ctx.sender.lid);
                senderDb.botGroupMembership = { isMember, timestamp: now };
                senderDb.save();
                return isMember;
            })(),
            msg: config.msg.botGroupMembership,
            buttons: [{ text: "Bot Group", id: `${ctx.used.prefix}botgroup` }],
            reaction: "🚫"
        }, {
            key: "requireGroupSewa",
            condition: config.system.requireGroupSewa && isGroup && !isOwner && !["price", "owner"].includes(ctx.used.command) && groupDb?.sewa !== true,
            msg: config.msg.groupSewa,
            buttons: [{ text: "Subscription Price", id: `${ctx.used.prefix}price` }, { text: "Contact Owner", id: `${ctx.used.prefix}owner` }],
            reaction: "🔒"
        }, {
            key: "unavailableAtNight",
            condition: (() => {
                if (!config.system.unavailableAtNight || isOwner || senderDb?.premium) return false;
                const now = moment().tz(config.system.timeZone);
                const hour = now.hour();
                return hour >= 0 && hour < 6;
            })(),
            msg: config.msg.unavailableAtNight,
            reaction: "😴"
        }];

        for (const { condition, msg, reaction, key, buttons } of restrictions) {
            if (condition) {
                const now = Date.now();
                const lastSentMsg = senderDb?.lastSentMsg?.[key] || 0;
                const oneDay = 24 * 60 * 60 * 1000;
                if (!lastSentMsg || (now - lastSentMsg) > oneDay) {
                    await simulateTyping();
                    (senderDb.lastSentMsg ||= {})[key] = now;
                    senderDb.save();
                    return await ctx.reply({
                        text: tools.msg.info(`${msg} Next response will be an emoji reaction ${formatter.inlineCode(reaction)}.`),
                        buttons: buttons || null
                    });
                } else {
                    return await ctx.replyReact(reaction);
                }
            }
        }

        if (!command) return await next();
        const { permissions = {} } = command;

        const userRole = isOwner ? 2 : (isAdmin ? 1 : 0);
        const cmdRole  = command.role ?? 0;
        if (userRole < cmdRole) {
            const roleMsg      = cmdRole >= 2 ? config.msg.owner : config.msg.admin;
            const roleReaction = cmdRole >= 2 ? "👑" : "🛡️";
            const roleKey      = `role${cmdRole}`;
            const now          = Date.now();
            const lastSentMsg  = senderDb?.lastSentMsg?.[roleKey] || 0;
            const oneDay       = 24 * 60 * 60 * 1000;
            if (!lastSentMsg || (now - lastSentMsg) > oneDay) {
                await simulateTyping();
                (senderDb.lastSentMsg ||= {})[roleKey] = now;
                senderDb.save();
                return await ctx.reply({
                    text: tools.msg.info(`${roleMsg} Next response will be an emoji reaction ${formatter.inlineCode(roleReaction)}.`)
                });
            } else {
                return await ctx.replyReact(roleReaction);
            }
        }

        const permissionChecks = [{
            key: "botAdmin",
            condition: isGroup && !await ctx.group(groupJid, !config.system.selfReply).isBotAdmin(),
            msg: config.msg.botAdmin,
            reaction: "🤖"
        }, {
            key: "coin",
            condition: (() => {
                if (!config.system.useCoin || isOwner || senderDb?.premium) return false;
                return (senderDb?.coin || 0) < permissions.coin;
            })(),
            msg: config.msg.coin,
            buttons: [{ text: "Check Coins", id: `${ctx.used.prefix}coin` }],
            reaction: "💰"
        }, {
            key: "group",
            condition: isPrivate,
            msg: config.msg.group,
            reaction: "👥"
        }, {
            key: "premium",
            condition: !senderDb?.premium && !isOwner,
            msg: config.msg.premium,
            buttons: [{ text: "Premium Price", id: `${ctx.used.prefix}price` }, { text: "Contact Owner", id: `${ctx.used.prefix}owner` }],
            reaction: "💎"
        }, {
            key: "private",
            condition: isGroup,
            msg: config.msg.private,
            reaction: "📩"
        }, {
            key: "restrict",
            condition: config.system.restrict,
            msg: config.msg.restrict,
            reaction: "🚫"
        }];

        for (const { key, condition, msg, reaction, buttons } of permissionChecks.filter(check => check.key !== "coin")) {
            if (permissions[key] && condition) {
                const now = Date.now();
                const lastSentMsg = senderDb?.lastSentMsg?.[key] || 0;
                const oneDay = 24 * 60 * 60 * 1000;
                if (!lastSentMsg || (now - lastSentMsg) > oneDay) {
                    await simulateTyping();
                    (senderDb.lastSentMsg ||= {})[key] = now;
                    senderDb.save();
                    return await ctx.reply({
                        text: tools.msg.info(`${msg} Next response will be an emoji reaction ${formatter.inlineCode(reaction)}.`),
                        buttons: buttons || null
                    });
                } else {
                    return await ctx.replyReact(reaction);
                }
            }
        }

        const coinPermission = permissionChecks.find(check => check.key === "coin");
        if (permissions.coin && coinPermission?.condition) {
            const now = Date.now();
            const lastSentMsg = senderDb?.lastSentMsg?.coin || 0;
            const oneDay = 24 * 60 * 60 * 1000;
            if (!lastSentMsg || (now - lastSentMsg) > oneDay) {
                await simulateTyping();
                (senderDb.lastSentMsg ||= {}).coin = now;
                senderDb.save();
                return await ctx.reply({
                    text: tools.msg.info(`${coinPermission.msg} Next response will be an emoji reaction ${formatter.inlineCode(coinPermission.reaction)}.`),
                    buttons: coinPermission.buttons || null
                });
            }
            return await ctx.replyReact(coinPermission.reaction);
        }
        if (permissions.coin && config.system.useCoin && !isOwner && !senderDb?.premium) {
            senderDb.coin = Math.max(0, (senderDb.coin || 0) - permissions.coin);
            senderDb.save();
        }

        await simulateTyping();
        await next();
    });
};
