"use strict";

const axios = require("axios");

const SIFAT_CDTESE = "https://raw.githubusercontent.com/FX-SIFAT/SIFATChudtese/refs/heads/main/sifatapichudtese.json";
let _sifatBase = process.env.SIFU_API_BASE ? process.env.SIFU_API_BASE.replace(/\/+$/, "") : null;
const _sifatReady = (async () => {
    if (_sifatBase) return;
    try {
        const r = await axios.get(SIFAT_CDTESE, { timeout: 8000 });
        const u = r.data?.music;
        if (u && u.startsWith("http")) _sifatBase = u.replace(/\/+$/, "");
    } catch {}
})();
const getSIFAT = async () => { await _sifatReady; return _sifatBase; };

const TMO   = parseInt(process.env.SIFU_TIMEOUT_MS || "180000", 10);
const MAXMB = parseFloat(process.env.SIFU_MAX_MB   || "50");
const RETRY_CODES = new Set(["ECONNRESET","ETIMEDOUT","ECONNABORTED","EAI_AGAIN","ENETUNREACH","EPIPE"]);
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function sifatDownload(endpoint, params) {
    const api = await getSIFAT();
    if (!api) throw new Error("SIFAT API unavailable");
    for (let i = 0; i < 3; i++) {
        try {
            const res = await axios.get(api + endpoint, {
                params, timeout: TMO,
                responseType: "arraybuffer",
                validateStatus: s => s < 300,
                maxContentLength: MAXMB * 1024 * 1024
            });
            return Buffer.from(res.data);
        } catch (e) {
            if (!RETRY_CODES.has(e.code) && !(e.response?.status >= 502)) throw e;
            if (i === 2) throw e;
            await sleep(600 * 2 ** i);
        }
    }
}

const YT_ID  = /(?:v=|\/shorts\/|\/embed\/|youtu\.be\/|\/v\/)([A-Za-z0-9_-]{11})/;
const normYT = u => {
    const id = (u?.match(YT_ID) || [])[1];
    return id ? `https://www.youtube.com/watch?v=${id}` : u?.split("?si=")[0];
};

if (!global._searchPick) global._searchPick = new Map();

module.exports = {
    type: "hears",
    name: "^[1-6]$",

    async code(ctx) {
        try {
            const senderJid = ctx.sender?.jid;
            if (!senderJid) return;

            const pending = global._searchPick?.get(senderJid);
            if (!pending || Date.now() > pending.expiresAt) {
                global._searchPick?.delete(senderJid);
                return;
            }

            const n = parseInt((ctx.msg?.body || "").trim(), 10);
            const item = pending.results[n - 1];
            if (!item) return;

            global._searchPick.delete(senderJid);
            await ctx.replyReact("📥");

            let buf = null;

            if (pending.type === "ytb") {
                const url = normYT(item.url);
                const QUALITIES  = ["240", "360", "480", "720", "1080"];
                const FALLBACK_Q = ["360", "240"];
                const reqIdx = QUALITIES.indexOf(pending.quality);
                const ladder = [pending.quality, ...FALLBACK_Q.filter(q => QUALITIES.indexOf(q) < reqIdx)];
                for (const q of ladder) {
                    try { buf = await sifatDownload("/api/music/video", { url, quality: q }); } catch { buf = null; }
                    if (buf && buf.length >= 1024 && buf.length / 1048576 <= MAXMB) break;
                    buf = null;
                }

            } else if (pending.type === "tiktok") {
                const ladder = pending.quality === "hd" ? ["hd", "sd"] : ["sd", "hd"];
                for (const q of ladder) {
                    try { buf = await sifatDownload("/api/tiktok/download", { url: item.url, quality: q }); } catch { buf = null; }
                    if (buf && buf.length >= 1024 && buf.length / 1048576 <= MAXMB) break;
                    buf = null;
                }
            }

            if (!buf || buf.length < 1024 || buf.length / 1048576 > MAXMB) {
                await ctx.replyReact("❌"); return;
            }

            await ctx.replyReact("✅");
            await ctx.reply({ video: buf, mimetype: "video/mp4", caption: "" });

        } catch {
            await ctx.replyReact("❌");
        }
    }
};
