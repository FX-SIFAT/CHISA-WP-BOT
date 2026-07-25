"use strict";

const BASE = "https://vdo-downloaderrr.onrender.com";

function detectEndpoint(url) {
    if (/youtu\.?be/i.test(url))              return `${BASE}/ytb?url=${encodeURIComponent(url)}&format=720`;
    if (/tiktok/i.test(url))                  return `${BASE}/tiktok?url=${encodeURIComponent(url)}`;
    if (/instagram/i.test(url))               return `${BASE}/instagram?url=${encodeURIComponent(url)}`;
    if (/facebook|fb\.watch/i.test(url))      return `${BASE}/facebook?url=${encodeURIComponent(url)}`;
    if (/twitter|x\.com/i.test(url))          return `${BASE}/twitter?url=${encodeURIComponent(url)}`;
    if (/pinterest/i.test(url))               return `${BASE}/pinterest?url=${encodeURIComponent(url)}`;
    return `${BASE}/alldl?url=${encodeURIComponent(url)}`;
}

module.exports = {
    name: /https?:\/\/(www\.)?(youtu\.?be(\.com)?|tiktok\.com|instagram\.com|facebook\.com|fb\.watch|twitter\.com|x\.com|pinterest\.com)[^\s]*/i,
    type: "hears",

    async code(ctx) {
        try {
            const body = ctx.msg?.body || "";
            const match = body.match(/https?:\/\/(www\.)?(youtu\.?be(\.com)?|tiktok\.com|instagram\.com|facebook\.com|fb\.watch|twitter\.com|x\.com|pinterest\.com)[^\s]*/i);
            if (!match) return;

            const url = match[0];

            await ctx.replyReact("📥");

            const apiRes = await axios.get(detectEndpoint(url), { timeout: 60_000 });
            const info   = apiRes.data;

            if (!info?.success || !info?.url) {
                await ctx.replyReact("❌");
                return;
            }

            const dlRes = await axios.get(info.url, {
                responseType: "arraybuffer",
                timeout: 180_000,
                maxContentLength: 200 * 1024 * 1024
            });

            const videoBuf = Buffer.from(dlRes.data);

            if (videoBuf.length < 1024 || (videoBuf.length / 1048576) > 100) {
                await ctx.replyReact("❌");
                return;
            }

            await ctx.replyReact("✅");
            await ctx.reply({ video: videoBuf, mimetype: "video/mp4", caption: "" });

        } catch (_) {
            await ctx.replyReact("❌");
        }
    }
};
