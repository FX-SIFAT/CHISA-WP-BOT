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

const TMO    = parseInt(process.env.SIFU_TIMEOUT_MS || "180000", 10);
const MAXMB  = parseFloat(process.env.SIFU_MAX_MB   || "50");
const PICK_TTL = 5 * 60 * 1000;

const RETRY_CODES = new Set(["ECONNRESET","ETIMEDOUT","ECONNABORTED","EAI_AGAIN","ENETUNREACH","EPIPE"]);
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function sifatGet(endpoint, params) {
    const api = await getSIFAT();
    if (!api) throw new Error("SIFAT API unavailable");
    for (let i = 0; i < 3; i++) {
        try {
            return (await axios.get(api + endpoint, { params, timeout: TMO, validateStatus: s => s < 300 })).data;
        } catch (e) {
            if (!RETRY_CODES.has(e.code) && !(e.response?.status >= 502)) throw e;
            if (i === 2) throw e;
            await sleep(600 * 2 ** i);
        }
    }
}

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

const YT_RX  = /^(https?:\/\/)?(www\.|music\.|m\.)?(youtube\.com|youtu\.be)\//i;
const YT_ID  = /(?:v=|\/shorts\/|\/embed\/|youtu\.be\/|\/v\/)([A-Za-z0-9_-]{11})/;
const isYT   = s => YT_RX.test(String(s).trim());
const normYT = u => {
    const id = (u?.match(YT_ID) || [])[1];
    return id ? `https://www.youtube.com/watch?v=${id}` : u?.split("?si=")[0];
};

const QUALITIES  = ["240", "360", "480", "720", "1080"];
const DEF_Q      = "360";
const FALLBACK_Q = ["360", "240"];

if (!global._searchPick) global._searchPick = new Map();

module.exports = {
    name: "ytb",
    aliases: ["yt", "youtube", "ytvideo", "ytdl", "youtubedown"],
    category: "downloader",
    description: "YouTube video search & download",
    usage: "ytb <query | URL> [-q 240|360|480|720|1080] [list]",
    permissions: { coin: 15 },

    async code(ctx) {
        const senderJid = ctx.sender?.jid;
        try {
            const args = ctx.args || [];
            let quality = DEF_Q;
            const rest = [];

            for (let i = 0; i < args.length; i++) {
                const a = args[i].toLowerCase();
                if ((a === "-q" || a === "--quality") && QUALITIES.includes(args[i + 1])) {
                    quality = args[++i]; continue;
                }
                rest.push(args[i]);
            }

            const query = rest.join(" ").trim() || ctx.text?.trim() || "";
            if (!query) { await ctx.replyReact("❓"); return; }

            
            if (isYT(query)) {
                
                const url = normYT(query);
                await ctx.replyReact("📥");

                const reqIdx = QUALITIES.indexOf(quality);
                const ladder = [quality, ...FALLBACK_Q.filter(q => QUALITIES.indexOf(q) < reqIdx)];
                let buf = null;
                for (const q of ladder) {
                    try { buf = await sifatDownload("/api/music/video", { url, quality: q }); } catch { buf = null; }
                    if (buf && buf.length >= 1024 && buf.length / 1048576 <= MAXMB) break;
                    buf = null;
                }

                if (!buf || buf.length < 1024 || buf.length / 1048576 > MAXMB) {
                    await ctx.replyReact("❌"); return;
                }
                await ctx.replyReact("✅");
                await ctx.reply({ video: buf, mimetype: "video/mp4", caption: "" });
                return;
            }

            
            {
                await ctx.replyReact("🔍");
                const searchData = await sifatGet("/api/music/search", { q: query, limit: 6 });
                const results = searchData?.results || [];
                if (!results.length) { await ctx.replyReact("❌"); return; }

                const imgBuf = await sifatDownload("/api/video/search-image", { q: query, limit: 6, cmd: "Reply 1-6" });
                if (!imgBuf || imgBuf.length < 512) { await ctx.replyReact("❌"); return; }

                global._searchPick.set(senderJid, {
                    type: "ytb", results, quality,
                    expiresAt: Date.now() + PICK_TTL
                });

                await ctx.replyReact("✅");
                await ctx.reply({ image: imgBuf, caption: "" });
                return;
            }
 
            let url = null;

            const reqIdx = QUALITIES.indexOf(quality);
            const ladder = [quality, ...FALLBACK_Q.filter(q => QUALITIES.indexOf(q) < reqIdx)];
            let buf = null;
            for (const q of ladder) {
                try { buf = await sifatDownload("/api/music/video", { url, quality: q }); } catch { buf = null; }
                if (buf && buf.length >= 1024 && buf.length / 1048576 <= MAXMB) break;
                buf = null; 
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
      
