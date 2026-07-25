"use strict";

const LINE = "─".repeat(32);

function formatExpiry(exp) {
    if (!exp) return "♾️ Permanent";
    const diff = exp - Date.now();
    if (diff <= 0) return "⏰ Expired";
    return `⏳ ${tools.msg.convertMsToDuration(diff)} remaining`;
}

async function doAdd(ctx) {
    const isGroup = ctx.isGroup();
    const target = isGroup ? { jid: ctx.id, source: "group" } : await ctx.target(["text_group"]);
    const daysAmount = parseInt(ctx.args[isGroup ? 0 : 1], 10);

    if (!target.jid)
        return ctx.reply(
            `╔══[ 🔑 *Add Group Rental* ]\n${LINE}\n` +
            `${tools.msg.generateInstruction(["send"], ["text"])}\n` +
            `${tools.msg.generateCmdExample(ctx.used, "1234567890 30 -s")}\n` +
            `${tools.msg.generateNotes([
                "Use in a group to automatically rent that group.",
                "Omit days for permanent rental."
            ])}\n` +
            tools.msg.generatesFlagInfo({ "-s": "Silent — don't notify the group owner" }) + `\n${LINE}`
        );

    const group = ctx.group(target.jid);
    if (!group)
        return ctx.reply(tools.msg.info("⚠️ Group not valid or bot is not in that group!"));

    if (!isNaN(daysAmount) && daysAmount <= 0)
        return ctx.reply(tools.msg.info("⚠️ Rental duration must be greater than 0 days!"));

    const flag = ctx.flag({ silent: { type: "boolean", short: "s", default: false } });
    const isPermanent = isNaN(daysAmount);

    try {
        const groupName = await group.name();
        const groupOwner = await group.owner();
        const groupJid = `${group.id}@g.us`;
        const groupMentions = [{ groupJid, groupSubject: groupName }];

        const targetDb = ctx.getDb("groups", target.jid);
        targetDb.sewa = true;

        if (!isPermanent) {
            targetDb.sewaExpiration = Date.now() + daysAmount * 864e5;
        } else {
            delete targetDb.sewaExpiration;
        }
        targetDb.save();

        await ctx.replyReact("✅");

        if (!flag.silent && groupOwner && !config.system.restrict) {
            await ctx.sendMessage(groupOwner, {
                text: tools.msg.info(
                    isPermanent
                        ? `🔑 Bot permanently rented to group @${groupJid}!`
                        : `🔑 Bot rented to group @${groupJid} for ${daysAmount} days!`
                ),
                contextInfo: { groupMentions }
            });
        }

        return ctx.reply(
            `╔══[ 🔑 *Group Rental Added* ]\n${LINE}\n` +
            `  👥 Group    : ${groupName}\n` +
            `  ⏱️  Duration : ${isPermanent ? "♾️ Permanent" : `${daysAmount} days`}\n` +
            `  📅 Expires  : ${isPermanent ? "Never" : new Date(targetDb.sewaExpiration).toLocaleDateString("en-GB")}\n` +
            `${LINE}`
        );
    } catch (e) { return tools.cmd.handleError(ctx, e); }
}

async function doRemove(ctx) {
    const isGroup = ctx.isGroup();
    const target = isGroup ? { jid: ctx.id, source: "group" } : await ctx.target(["text_group"]);

    if (!target.jid)
        return ctx.reply(
            `╔══[ ❌ *Remove Group Rental* ]\n${LINE}\n` +
            `${tools.msg.generateInstruction(["send"], ["text"])}\n` +
            `${tools.msg.generateCmdExample(ctx.used, "1234567890 -s")}\n` +
            `${tools.msg.generateNotes(["Use in a group to remove rental for that group."])}\n` +
            tools.msg.generatesFlagInfo({ "-s": "Silent — don't notify the group owner" }) + `\n${LINE}`
        );

    const group = ctx.group(target.jid);
    if (!group)
        return ctx.reply(tools.msg.info("⚠️ Group not valid or bot is not in that group!"));

    const flag = ctx.flag({ silent: { type: "boolean", short: "s", default: false } });

    try {
        
        const targetDb = ctx.getDb("groups", target.jid);

        if (!targetDb?.sewa)
            return ctx.reply(tools.msg.info("⚠️ This group does not have an active rental!"));

        const groupName = await group.name();
        const groupOwner = await group.owner();
        const groupJid = `${group.id}@g.us`;
        const groupMentions = [{ groupJid, groupSubject: groupName }];

        delete targetDb.sewa;
        delete targetDb.sewaExpiration;
        targetDb.save();

        await ctx.replyReact("✅");

        if (!flag.silent && groupOwner && !config.system.restrict) {
            await ctx.sendMessage(groupOwner, {
                text: tools.msg.info(`❌ Bot rental for group @${groupJid} has been cancelled by the owner.`),
                contextInfo: { groupMentions }
            });
        }

        return ctx.reply(
            `╔══[ ❌ *Group Rental Removed* ]\n${LINE}\n  👥 Group : ${groupName}\n${LINE}`
        );
    } catch (e) { return tools.cmd.handleError(ctx, e); }
}

async function doList(ctx) {
    try {
        const groups = ctx.db.groups.getMany(g => g.sewa);
        if (!groups.length)
            return ctx.reply(`╔══[ 🔑 *Rented Groups* ]\n${LINE}\n  ℹ️ No rented groups found.\n${LINE}`);

        const groupMentions = [];
        const lines = [];

        for (let i = 0; i < groups.length; i++) {
            const g = groups[i];
            const groupJid = g.jid;
            let groupSubject = groupJid;
            try { groupSubject = await ctx.group(groupJid).name() || groupJid; } catch {}
            groupMentions.push({ groupJid, groupSubject });
            lines.push(`  ${i + 1}. ${groupSubject}\n     └ @${groupJid} — ${formatExpiry(g.sewaExpiration)}`);
        }

        return ctx.reply({
            text: `╔══[ 🔑 *Rented Groups* | ${groups.length} total ]\n${LINE}\n${lines.join("\n")}\n${LINE}`,
            contextInfo: { groupMentions }
        });
    } catch (e) { return tools.cmd.handleError(ctx, e); }
}

module.exports = [
    {
        name: "addsewa",
        aliases: ["addsewagroup", "addsewagrup", "adg"],
        category: "admin",
        role: 2,
        description: "Add group rental (optional: specify days)",
        usage: "addsewa [groupId] [days] [-s]",
        async code(ctx) { return doAdd(ctx); }
    },
    {
        name: "delsewa",
        aliases: ["delsewagroup", "delsewagrup", "dsg"],
        category: "admin",
        role: 2,
        description: "Remove group rental",
        usage: "delsewa [groupId] [-s]",
        async code(ctx) { return doRemove(ctx); }
    },
    {
        name: "listsewa",
        aliases: ["listsewagroup", "listsewagroups"],
        category: "admin",
        role: 2,
        description: "List all rented groups with expiry info",
        usage: "listsewa",
        async code(ctx) { return doList(ctx); }
    }
];
