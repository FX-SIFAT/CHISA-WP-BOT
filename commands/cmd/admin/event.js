"use strict";

const fs   = require("node:fs");
const path = require("node:path");

const EVENT_DIR  = path.resolve(__dirname, "../../event");
const LINE       = "─".repeat(32);

const PROTECTED = new Set(["messages", "ready", "anticall", "welcome"]);


function scanEventFiles() {
    return fs.readdirSync(EVENT_DIR)
        .filter(f => f.endsWith(".js"))
        .map(f => ({ file: f, full: path.join(EVENT_DIR, f), name: path.basename(f, ".js") }));
}

function readMeta(filePath) {
    const name = path.basename(filePath, ".js");
    try {
        const src = fs.readFileSync(filePath, "utf8");

        const docBlock = src.match(/\/\*\*([\s\S]*?)\*\//);
        let metaName = name, description = "—", event = "—";

        if (docBlock) {
            const mN = docBlock[1].match(/@name\s+(.+)/);
            const mD = docBlock[1].match(/@description\s+(.+)/);
            const mE = docBlock[1].match(/@event\s+(.+)/);
            if (mN) metaName    = mN[1].trim();
            if (mD) description = mD[1].trim();
            if (mE) event       = mE[1].trim();
        }

        if (description === "—") {
            const firstComment = src.split("\n").find(l => l.trim().startsWith("//"));
            if (firstComment) description = firstComment.replace(/^\/\/\s*/, "").trim();
        }

        if (event === "—") {
            const evts = [...new Set(src.match(/Events\.\w+/g) || [])];
            if (evts.length) event = evts.join(", ");
        }

        return { name: metaName, description, event };
    } catch {
        return { name, description: "—", event: "—" };
    }
}

function fileStat(filePath) {
    try { return fs.statSync(filePath); } catch { return null; }
}

function fmtSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KiB`;
    return `${(bytes / 1048576).toFixed(2)} MiB`;
}

function fmtDate(ms) {
    return new Date(ms).toLocaleString("en-GB", { timeZone: config.system?.timeZone || "UTC" });
}

function deriveName(url, code) {
    const nameMatch = code.match(/@name\s+(\S+)/);
    if (nameMatch) return nameMatch[1].toLowerCase().replace(/[^a-z0-9_-]/g, "_");
    try {
        return path.basename(new URL(url).pathname, ".js").toLowerCase().replace(/[^a-z0-9_-]/g, "_") || null;
    } catch {
        return null;
    }
}

async function fetchCode(url) {
    const res = await axios.get(url, { responseType: "text", timeout: 20000 });
    return typeof res.data === "string" ? res.data : JSON.stringify(res.data);
}

function writeEventFile(filePath, code) {
    // Basic sanity: must be a non-empty string
    if (!code || typeof code !== "string" || code.trim().length < 5) {
        return { ok: false, reason: "Code is empty or too short." };
    }
    fs.writeFileSync(filePath, code, "utf8");
    return { ok: true };
}


async function doInstall(ctx, code, nameHint) {
    const safeName = nameHint?.toLowerCase().replace(/[^a-z0-9_-]/g, "_") || `event_${Date.now()}`;

    if (PROTECTED.has(safeName)) {
        return ctx.reply(tools.msg.info(`🔒 ${formatter.inlineCode(safeName)} is a protected core handler and cannot be replaced.`));
    }

    const destFile = path.join(EVENT_DIR, `${safeName}.js`);
    if (fs.existsSync(destFile)) {
        return ctx.reply(
            tools.msg.info(
                `⚠️ Event handler ${formatter.inlineCode(safeName)} already exists.\n` +
                `Use ${formatter.inlineCode(`${ctx.used.prefix}event update ${safeName} <url>`)} to overwrite it.`
            )
        );
    }

    const result = writeEventFile(destFile, code);
    if (!result.ok) return ctx.reply(tools.msg.info(`❌ ${result.reason}`));

    const meta = readMeta(destFile);
    const stat = fileStat(destFile);

    return ctx.reply(
        `╔══[ ✅ *Event Handler Installed* ]\n${LINE}\n` +
        `  🏷️  Name        : ${formatter.bold(safeName)}\n` +
        `  📡 Event       : ${meta.event}\n` +
        `  📝 Description : ${meta.description}\n` +
        `  📦 Size        : ${fmtSize(stat?.size || 0)}\n` +
        `  📄 File        : ${formatter.inlineCode(`commands/event/${safeName}.js`)}\n` +
        `${LINE}\n` +
        `${tools.msg.info("♻️ Restart the bot to activate this event handler.")}`
    );
}

async function doDelete(ctx, name) {
    if (PROTECTED.has(name.toLowerCase())) {
        return ctx.reply(tools.msg.info(`🔒 ${formatter.inlineCode(name)} is a protected core event handler and cannot be deleted.`));
    }

    const targetFile = path.join(EVENT_DIR, `${name}.js`);
    if (!fs.existsSync(targetFile)) {
        return ctx.reply(tools.msg.info(`❌ Event handler ${formatter.inlineCode(name)} not found.`));
    }

    const meta = readMeta(targetFile);
    fs.unlinkSync(targetFile);

    return ctx.reply(
        `╔══[ 🗑️ *Event Handler Deleted* ]\n${LINE}\n` +
        `  🏷️  Name  : ${formatter.bold(meta.name)}\n` +
        `  📡 Event : ${meta.event}\n` +
        `  📄 File  : ${formatter.inlineCode(`commands/event/${name}.js`)}\n` +
        `${LINE}\n` +
        `${tools.msg.info("♻️ Restart the bot to fully stop this event handler.")}`
    );
}

async function doUpdate(ctx, name, url) {
    if (!name) return ctx.reply(tools.msg.info(`Usage: ${formatter.inlineCode(`${ctx.used.prefix}event update <name> <url>`)}`));
    if (!url || !tools.cmd.isUrl(url)) return ctx.reply(tools.msg.info("Provide a valid URL after the name."));

    if (PROTECTED.has(name.toLowerCase())) {
        return ctx.reply(tools.msg.info(`🔒 ${formatter.inlineCode(name)} is a protected core handler and cannot be updated this way.`));
    }

    const targetFile = path.join(EVENT_DIR, `${name}.js`);
    if (!fs.existsSync(targetFile)) {
        return ctx.reply(tools.msg.info(`❌ Event handler ${formatter.inlineCode(name)} not found. Use ${formatter.inlineCode("event install")} instead.`));
    }

    await ctx.replyReact("⏳");

    let code;
    try { code = await fetchCode(url); }
    catch (e) { return ctx.reply(tools.msg.info(`❌ Fetch failed: ${e.message}`)); }

    const result = writeEventFile(targetFile, code);
    if (!result.ok) return ctx.reply(tools.msg.info(`❌ ${result.reason}`));

    const meta = readMeta(targetFile);
    const stat = fileStat(targetFile);

    await ctx.replyReact("✅");
    return ctx.reply(
        `╔══[ 🔁 *Event Handler Updated* ]\n${LINE}\n` +
        `  🏷️  Name        : ${formatter.bold(name)}\n` +
        `  📡 Event       : ${meta.event}\n` +
        `  📝 Description : ${meta.description}\n` +
        `  📦 Size        : ${fmtSize(stat?.size || 0)}\n` +
        `${LINE}\n` +
        `${tools.msg.info("♻️ Restart the bot to apply the update.")}`
    );
}

async function doInfo(ctx, name) {
    const targetFile = path.join(EVENT_DIR, `${name}.js`);
    if (!fs.existsSync(targetFile)) {
        return ctx.reply(tools.msg.info(`❌ Event handler ${formatter.inlineCode(name)} not found.`));
    }

    const meta    = readMeta(targetFile);
    const stat    = fileStat(targetFile);
    const isCore  = PROTECTED.has(name.toLowerCase());

    const src     = fs.readFileSync(targetFile, "utf8");
    const lines   = src.split("\n").length;
    const requires = [...new Set((src.match(/require\(["']([^"']+)["']\)/g) || []).map(r => r.match(/["']([^"']+)["']/)?.[1]).filter(Boolean))];

    return ctx.reply(
        `╔══[ ℹ️  *Event Handler Info* ]\n${LINE}\n` +
        `  🏷️  Name        : ${formatter.bold(meta.name)}\n` +
        `  📡 Event(s)    : ${meta.event}\n` +
        `  📝 Description : ${meta.description}\n` +
        `  🔒 Protected   : ${isCore ? "✅ Yes (core)" : "❌ No"}\n` +
        `  📄 File        : ${formatter.inlineCode(`commands/event/${name}.js`)}\n` +
        `  📦 Size        : ${fmtSize(stat?.size || 0)} (${lines} lines)\n` +
        `  🕐 Modified    : ${fmtDate(stat?.mtimeMs || 0)}\n` +
        `  📦 Requires    : ${requires.length ? requires.map(r => formatter.inlineCode(r)).join(", ") : "—"}\n` +
        LINE
    );
}

async function doSource(ctx, name) {
    const targetFile = path.join(EVENT_DIR, `${name}.js`);
    if (!fs.existsSync(targetFile)) {
        return ctx.reply(tools.msg.info(`❌ Event handler ${formatter.inlineCode(name)} not found.`));
    }

    const buf  = fs.readFileSync(targetFile);
    const stat = fileStat(targetFile);

    await ctx.reply({
        document : buf,
        fileName : `${name}.js`,
        mimetype : "text/plain",
        caption  : tools.msg.info(`Source of event handler ${formatter.inlineCode(name)} — ${fmtSize(stat?.size || buf.length)}`)
    });
}

async function doList(ctx) {
    const files = scanEventFiles();
    if (!files.length) return ctx.reply(tools.msg.info("No event handlers found."));

    let txt = `╔══[ 📋 *Event Handlers* — ${files.length} total ]\n${LINE}\n`;

    for (const { full, name } of files.sort((a, b) => a.name.localeCompare(b.name))) {
        const meta   = readMeta(full);
        const stat   = fileStat(full);
        const isCore = PROTECTED.has(name.toLowerCase());
        const lock   = isCore ? " 🔒" : "";

        txt += `\n  ⚡ ${formatter.bold(name)}${lock}\n`;
        txt += `     📡 ${meta.event}\n`;
        txt += `     📝 ${meta.description}\n`;
        txt += `     📦 ${fmtSize(stat?.size || 0)} · 🕐 ${fmtDate(stat?.mtimeMs || 0)}\n`;
    }

    txt += `\n${LINE}\n🔒 = Protected core handler`;
    return ctx.reply(txt);
}


module.exports = {
    name: "event",
    aliases: ["ev", "evt"],
    category: "maker",
    description: "Advanced event handler manager — install, delete, update, source, info, list",
    usage: "event <sub> [args]",
    permissions: { owner: true },

    async code(ctx) {
        const args = ctx.args || [];
        const sub  = (args[0] || "").toLowerCase();
        const pfx  = ctx.used.prefix;

        if (!sub || sub === "help") {
            return ctx.reply(
                `╔══[ ⚡ *Event Manager* ]\n${LINE}\n\n` +
                `  📥 *install* <url>              — Install from URL\n` +
                `  📥 *install* _(reply to .js)_   — Install from document\n` +
                `  🗑️  *delete*  <name>              — Delete handler\n` +
                `  🔁 *update*  <name> <url>        — Overwrite from URL\n` +
                `  ℹ️   *info*    <name>              — Detailed info\n` +
                `  📄 *source*  <name>              — Get source as file\n` +
                `  📋 *list*                        — List all handlers\n\n` +
                LINE + "\n" +
                tools.msg.info("🔒 Core handlers (messages, ready, anticall, welcome) are protected.")
            );
        }

        if (sub === "install") {
            const url    = args[1];
            const quoted = ctx.quoted;
            const qType  = quoted?.messageType;
            const isDoc  = qType === "documentMessage";
            const isText = qType === "extendedTextMessage" || qType === "conversation";

            if (!url && (isDoc || isText)) {
                await ctx.replyReact("⏳");
                let code;
                try { code = (await quoted.download()).toString("utf8"); }
                catch (e) { return ctx.reply(tools.msg.info(`❌ Download failed: ${e.message}`)); }

                const docName = quoted.message?.documentMessage?.fileName;
                const nameHint = deriveName("", code) || (docName ? path.basename(docName, ".js") : null);
                return doInstall(ctx, code, nameHint);
            }

            // Inline code paste: ,event install myhandler <code>
            if (url && !tools.cmd.isUrl(url)) {
                const nameHint = url;
                const rest = ctx.text?.trim().replace(/^install\s+\S+\s*/i, "") || "";
                if (rest.length > 5) {
                    await ctx.replyReact("⏳");
                    return doInstall(ctx, rest, nameHint);
                }
            }

            if (!url || !tools.cmd.isUrl(url)) {
                return ctx.reply(
                    tools.msg.info(
                        `Provide a URL, reply to a .js file, or paste code inline.\n` +
                        `Example: ${formatter.inlineCode(`${pfx}event install https://example.com/event.js`)}\n` +
                        `Or: ${formatter.inlineCode(`${pfx}event install myhandler <code>`)}`
                    )
                );
            }

            await ctx.replyReact("⏳");
            let code;
            try { code = await fetchCode(url); }
            catch (e) { return ctx.reply(tools.msg.info(`❌ Fetch failed: ${e.message}`)); }

            const nameHint = deriveName(url, code);
            return doInstall(ctx, code, nameHint);
        }

        if (sub === "delete" || sub === "remove") {
            const name = args[1];
            if (!name) return ctx.reply(tools.msg.info(`Usage: ${formatter.inlineCode(`${pfx}event delete <name>`)}`));
            return doDelete(ctx, name);
        }

        if (sub === "update") {
            return doUpdate(ctx, args[1], args[2]);
        }

        if (sub === "info") {
            const name = args[1];
            if (!name) return ctx.reply(tools.msg.info(`Usage: ${formatter.inlineCode(`${pfx}event info <name>`)}`));
            return doInfo(ctx, name);
        }

        if (sub === "source" || sub === "src") {
            const name = args[1];
            if (!name) return ctx.reply(tools.msg.info(`Usage: ${formatter.inlineCode(`${pfx}event source <name>`)}`));
            return doSource(ctx, name);
        }

        if (sub === "list" || sub === "ls") {
            return doList(ctx);
        }

        return ctx.reply(tools.msg.info(`Unknown sub-command. Use ${formatter.inlineCode(`${pfx}event help`)}.`));
    }
};
