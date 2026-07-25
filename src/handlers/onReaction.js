"use strict";


const { Events } = require("wp-heart");
const ANGRY_EMOJIS = new Set(["😡", "🤬", "👿", "😾"]);
let reactionCore = null;

module.exports = (bot) => {
    
    bot.ev.on(Events.ClientReady, () => {
        if (reactionCore === bot.core) return;
        reactionCore = bot.core;
        bot.core.ev.on("messages.upsert", async ({ messages, type }) => {
            if (type !== "notify") return;

            for (const message of messages) {
                const reaction = message.message?.reactionMessage;
                if (!reaction) continue;

                if (!ANGRY_EMOJIS.has(reaction.text)) continue;

                const reactedKey = reaction.key;
                if (!reactedKey?.fromMe) continue;

                const chatJid = message.key.remoteJid;
                try {
                    await bot.core.sendMessage(chatJid, { delete: reactedKey });
                    consolefy.log(`Angry react → deleted bot message in ${chatJid}`);
                } catch (err) {
                    consolefy.error("Failed to delete on angry react:", err.message);
                }
            }
        });
    });
};
