"use strict";

const fs   = require("node:fs");
const path = require("node:path");

const THUMB_PATH = (() => {
    const root = path.resolve(__dirname, "../../..");
    const candidates = [
        path.join(root, "public", "thumbnail.jpg"),
        path.join(root, "thumbnail.jpg"),
    ];
    return candidates.find(p => fs.existsSync(p)) || null;
})();

const STATE_FILE = path.resolve(__dirname, "../../../data/cmd_state.json");

const CAT_META = {
    maker      : { label: "Maker",       emoji: "🛠️"  },
    media      : { label: "Media",       emoji: "🎬"  },
    downloader : { label: "Downloader",  emoji: "📥"  },
    converter  : { label: "Converter",   emoji: "🔄"  },
    game       : { label: "Game",        emoji: "🎮"  },
    fun        : { label: "Fun",         emoji: "😂"  },
    group      : { label: "Group",       emoji: "👥"  },
    admin      : { label: "Admin",       emoji: "🔰"  },
    owner      : { label: "Owner",       emoji: "👑"  },
    economy    : { label: "Economy",     emoji: "💰"  },
    info       : { label: "Information", emoji: "ℹ️"   },
    information: { label: "Information", emoji: "ℹ️"   },
    search     : { label: "Search",      emoji: "🔍"  },
    ai         : { label: "AI",          emoji: "🤖"  },
    tool       : { label: "Tool",        emoji: "🔧"  },
    toolkit    : { label: "Toolkit",     emoji: "🧰"  },
    utility    : { label: "Utility",     emoji: "🧰"  },
    sticker    : { label: "Sticker",     emoji: "🖼️"  },
    music      : { label: "Music",       emoji: "🎵"  },
    social     : { label: "Social",      emoji: "🌐"  },
    profile    : { label: "Profile",     emoji: "👤"  },
    core       : { label: "Core",        emoji: "⚙️"  },
    misc       : { label: "Misc",        emoji: "📦"  },
    islam      : { label: "Islam",       emoji: "🕌"  },
    anime      : { label: "Anime",       emoji: "🌸"  },
    stalker    : { label: "Stalker",     emoji: "🕵️"  },
};

function catMeta(cat) {
    return CAT_META[(cat || "misc").toLowerCase()] || { label: cat, emoji: "📌" };
}

function permBadge(perms = {}) {
    let b = "";
    if (perms.coin)    b += "ⓒ";
    if (perms.group)   b += "Ⓖ";
    if (perms.owner)   b += "Ⓞ";
    if (perms.premium) b += "Ⓟ";
    if (perms.private) b += "ⓟ";
    if (perms.admin)   b += "Ⓐ";
    return b ? ` ${b}` : "";
}

function readDisabled() {
    try { return JSON.parse(fs.readFileSync(STATE_FILE, "utf8")).disabled || []; }
    catch { return []; }
}

function groupCommands(cmdMap) {
    const disabled   = readDisabled();
    const byCategory = {};
    let total        = 0;

    for (const cmd of cmdMap.values()) {
        if (!cmd?.name) continue;
        if (disabled.includes(cmd.name.toLowerCase())) continue;

        const cat = (cmd.category || "misc").toLowerCase();
        (byCategory[cat] ||= []).push(cmd);
        total++;
    }

    for (const list of Object.values(byCategory)) {
        list.sort((a, b) => a.name.localeCompare(b.name));
    }

    return { byCategory, total };
}

function formatCategoryBlock(pfx, cat, cmds) {
    const { label, emoji } = catMeta(cat);
    let text = `╭┈┈┈┈┈┈ ${emoji}\n`;
    text    += `┊ ✿ — ${formatter.bold(label)} (${cmds.length})\n`;
    for (const c of cmds) {
        text += `┊ ➛ ${pfx}${c.name}${permBadge(c.permissions)}\n`;
    }
    text += "╰┈┈┈┈┈┈\n";
    return text;
}

function buildLegend(byCategory) {
    const hasCoin    = Object.values(byCategory).flat().some(c => c.permissions?.coin);
    const hasOwner   = Object.values(byCategory).flat().some(c => c.permissions?.owner);
    const hasPremium = Object.values(byCategory).flat().some(c => c.permissions?.premium);
    const hasGroup   = Object.values(byCategory).flat().some(c => c.permissions?.group);
    const parts = [];
    if (hasCoin)    parts.push("ⓒ Coins");
    if (hasOwner)   parts.push("Ⓞ Owner");
    if (hasPremium) parts.push("Ⓟ Premium");
    if (hasGroup)   parts.push("Ⓖ Group only");
    return parts.join("  ·  ");
}

module.exports = {
    name: "menu",
    aliases: ["allmenu", "help", "h", "start"],
    category: "maker",
    description: "Show bot menu and command list",
    usage: "menu [category|all]",

    async code(ctx) {
        try {
            const pfx    = ctx.used.prefix;
            const cmdMap = ctx.bot.cmd;
            const { byCategory, total } = groupCommands(cmdMap);

            const input = ctx.args[0]?.toLowerCase();
            const isAllmenu = ctx.used.command === "allmenu" || input === "all";

            if (input || isAllmenu) {
                let cats;
                if (isAllmenu || input === "all") {
                    cats = Object.keys(byCategory).sort();
                } else {
                    
                    cats = Object.keys(byCategory).filter(k =>
                        k === input || catMeta(k).label.toLowerCase() === input
                    );
                }

                if (!cats.length) {
                    const available = Object.keys(byCategory)
                        .sort()
                        .map(k => `${formatter.inlineCode(pfx + "menu " + k)}`)
                        .join(", ");
                    return ctx.reply(
                        tools.msg.info(`Category ${formatter.inlineCode(input)} not found.\n\n📂 Available: ${available}`)
                    );
                }

                let text = "";
                for (const cat of cats) {
                    text += formatCategoryBlock(pfx, cat, byCategory[cat]) + "\n";
                }
                text += `\n📌 *Legend* : ${buildLegend(byCategory) || "No special perms"}`;
                return ctx.reply(text.trim());
            }

            const userDb  = ctx.db.user;
            const isOwner = ctx.sender.isOwner();

            const statusText = (() => {
                if (isOwner) return "👑 Owner";
                if (userDb?.premium) {
                    const rem = userDb.premiumExpiration
                        ? `${tools.msg.convertMsToDuration(userDb.premiumExpiration - Date.now(), ["days", "hours"])} left`
                        : "Lifetime";
                    return `💎 Premium (${rem})`;
                }
                return "🌐 Free";
            })();

            const coinText = (isOwner || userDb?.premium) ? "♾️ Unlimited" : String(userDb?.coin ?? 0);

            const dbSize = (() => {
                try {
                    const dir = ctx.bot.databaseDir;
                    if (!fs.existsSync(dir)) return "N/A";
                    const bytes = fs.readdirSync(dir).reduce((sum, f) => {
                        try { return sum + fs.statSync(path.join(dir, f)).size; } catch { return sum; }
                    }, 0);
                    return tools.msg.formatSize(bytes);
                } catch { return "N/A"; }
            })();

            const uptime  = tools.msg.convertMsToDuration(Date.now() - ctx.me.readyAt);
            const mode    = tools.msg.ucwords(ctx.db.bot?.mode || "public");

            const caption =
                `╭── 👋 Hello, @${ctx.getId(ctx.sender.jid)}!\n` +
                `│ ${formatter.italic(`Welcome to ${config.bot.name}`)}\n` +
                "│\n" +
                `│ 👤 Status  : ${statusText}\n` +
                `│ ⭐ Level   : ${userDb?.level ?? 0} (${userDb?.xp ?? 0}/100 XP)\n` +
                `│ 🪙 Coins   : ${coinText}\n` +
                "│\n" +
                `│ ✏️  Prefix  : ${formatter.inlineCode(pfx)}\n` +
                `│ 📋 Cmds    : ${total}\n` +
                `│ 🌐 Mode    : ${mode}\n` +
                `│ ⏱️  Uptime  : ${uptime}\n` +
                `│ 💾 DB Size : ${dbSize}\n` +
                "│\n" +
                `╰── ${formatter.italic(config.msg?.footer || config.bot.name + " ♡")}`;

            const rows = [
                {
                    title: "📋 All Categories",
                    description: `Show all ${total} commands at once`,
                    id: `${pfx}${ctx.used.command} all`
                },
                ...Object.keys(byCategory)
                    .sort()
                    .map(cat => {
                        const { label, emoji } = catMeta(cat);
                        const count = byCategory[cat].length;
                        return {
                            title: `${emoji} ${label}`,
                            description: `${count} command${count !== 1 ? "s" : ""}`,
                            id: `${pfx}${ctx.used.command} ${cat}`
                        };
                    })
            ];

            const imageField = THUMB_PATH ? fs.readFileSync(THUMB_PATH) : undefined;

            await ctx.reply({
                ...(imageField ? { image: imageField } : {}),
                caption: caption.trim(),
                mentions: [ctx.sender.jid],
                footer: config.msg?.footer || config.bot.name,
                optionText: "📂 Browse Commands",
                optionTitle: "Select a category",
                offerText: config.bot.name,
                offerCode: config.system?.customPairingCode,
                offerUrl: config.bot?.groupLink,
                offerExpiration: Date.now() + 3_600_000,
                nativeFlow: [
                    {
                        text: "📋 Command List",
                        sections: [{ title: "Menu Categories", highlight_label: "🌕", rows }]
                    },
                    { text: "📞 Contact Owner", id: `${pfx}owner` },
                    { text: "⏱️ Uptime",        id: `${pfx}uptime` }
                ]
            });

        } catch (error) {
            await tools.cmd.handleError(ctx, error);
        }
    }
};
