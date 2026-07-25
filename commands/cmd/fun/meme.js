"use strict";

async function sendMeme(ctx, endpoint) {
    await ctx.replyReact("😂");
    const d = await tools.api.get(endpoint);
    const imgRes = await axios.get(d.url, { responseType: "arraybuffer", timeout: 30_000 });
    const buf = Buffer.from(imgRes.data);
    await ctx.replyReact("✅");
    await ctx.reply({
        image: buf,
        caption: `😂 ${formatter.bold(d.title)}\n` +
            `📌 ${d.subreddit ? "r/" + d.subreddit : ""} · ⬆️ ${d.upvotes?.toLocaleString()}`
    });
}

module.exports = [
    {
        name: "meme",
        aliases: ["randommeme", "funmeme", "memes"],
        category: "fun",
        async code(ctx) {
            try { await sendMeme(ctx, "/api/meme/random"); }
            catch (e) { await ctx.replyReact("❌"); await tools.cmd.handleError(ctx, e); }
        }
    },
    {
        name: "phum",
        aliases: ["programmermeme", "codememe", "devmeme", "progmeme"],
        category: "fun",
        async code(ctx) {
            try { await sendMeme(ctx, "/api/meme/programmerhumor"); }
            catch (e) { await ctx.replyReact("❌"); await tools.cmd.handleError(ctx, e); }
        }
    }
];
