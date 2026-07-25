"use strict";

const { call } = require("../../../src/utils/chisacdi.js");

module.exports = {
    name: "linkpreview",
    aliases: ["lp", "preview", "ogpreview", "meta"],
    category: "tool",
    description: "Fetch rich preview (title, description, image) for any URL",
    usage: "linkpreview <url>",

    async code(ctx) {
        try {
            const pfx = ctx.used.prefix;
            const url = ctx.text?.trim() || ctx.quoted?.body?.trim();

            if (!url || !tools.cmd.isUrl(url)) {
                return ctx.reply(
                    `╔══[ 🔗 *Link Preview* ]\n${"─".repeat(30)}\n` +
                    `  ${formatter.italic("Get rich metadata from any URL")}\n\n` +
                    `  💡 ${formatter.inlineCode(`${pfx}lp https://example.com`)}\n` +
                    `  📌 Or reply to a message containing a URL`
                );
            }

            await ctx.replyReact("🔗");

            const data  = await call("link_preview", { url });

            const title       = data.title       || data.og_title       || "—";
            const description = data.description || data.og_description || "—";
            const image       = data.image       || data.og_image       || null;
            const siteName    = data.site_name   || data.og_site_name   || null;
            const ogUrl       = data.url         || data.og_url         || url;

            const card =
                `╔══[ 🔗 *Link Preview* ]\n${"─".repeat(30)}\n` +
                (siteName    ? `  🌐 Site  : ${formatter.bold(siteName)}\n` : "") +
                `  📌 Title : ${formatter.bold(title)}\n` +
                `  📝 Desc  : ${description.length > 200 ? description.slice(0, 200) + "…" : description}\n` +
                `  🔗 URL   : ${ogUrl}\n` +
                `${"─".repeat(30)}`;

            if (image && tools.cmd.isUrl(image)) {
                try {
                    const r = await axios.get(image, { responseType: "arraybuffer", timeout: 30_000 });
                    const imgBuf = Buffer.from(r.data);
                    await ctx.replyReact("✅");
                    return ctx.reply({ image: imgBuf, caption: card });
                } catch {  }
            }

            await ctx.replyReact("✅");
            await ctx.reply(card);

        } catch (error) {
            await ctx.replyReact("❌");
            await tools.cmd.handleError(ctx, error);
        }
    }
};
