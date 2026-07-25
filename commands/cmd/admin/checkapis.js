"use strict";

const LINE = "─".repeat(32);

module.exports = {
    name: "checkapis",
    aliases: ["checkapi", "apicheck", "cekapi"],
    category: "admin",
    role: 2,
    description: "Check status of all configured APIs",
    usage: "checkapis",

    async code(ctx) {
        try {
            await ctx.replyReact("⏳");
            const APIs = tools.api.listUrl();
            const entries = Object.entries(APIs);

            if (!entries.length)
                return ctx.reply(tools.msg.info("⚠️ No APIs configured."));

            const results = await Promise.allSettled(
                entries.map(([name, api]) =>
                    axios.get(api.baseURL, {
                        timeout: 8000,
                        headers: { "User-Agent": "Mozilla/5.0" }
                    }).then(r => ({ name, url: api.baseURL, status: r.status, ok: true }))
                      .catch(e => ({
                          name,
                          url: api.baseURL,
                          status: e.response?.status || null,
                          ok: false,
                          err: e.request && !e.response ? "No response" : e.message
                      }))
                )
            );

            let online = 0, offline = 0;
            const lines = results.map(r => {
                const { name, url, status, ok, err } = r.value;
                if (ok) { online++; return `  ✅ ${url}\n     └ Status: ${status}`; }
                offline++;
                return `  ❌ ${url}\n     └ ${status ? `Status: ${status}` : err || "Unknown error"}`;
            });

            await ctx.replyReact(offline === 0 ? "✅" : online === 0 ? "❌" : "⚠️");
            return ctx.reply(
                `╔══[ 🌐 *API Status* | ${entries.length} APIs ]\n${LINE}\n` +
                `${lines.join("\n")}\n\n` +
                `  ✅ Online  : ${online}\n` +
                `  ❌ Offline : ${offline}\n` +
                `${LINE}`
            );
        } catch (e) { return tools.cmd.handleError(ctx, e); }
    }
};
