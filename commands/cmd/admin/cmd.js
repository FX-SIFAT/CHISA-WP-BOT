"use strict";

const fs   = require("node:fs");
const path = require("node:path");

const CMD_DIR    = path.resolve(__dirname, "../../cmd");
const STATE_FILE = path.resolve(__dirname, "../../../data/cmd_state.json");
const LINE       = "─".repeat(32);
const SELF_NAME  = "cmd"; 

const pendingInstalls = new Map(); 


function readState() {
    try { return JSON.parse(fs.readFileSync(STATE_FILE, "utf8")); }
    catch { return { disabled: [] }; }
}
function saveState(state) {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), "utf8");
}


function scanJs(dir, base = dir) {
    let out = [];
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, e.name);
        if (e.isDirectory()) out = out.concat(scanJs(full, base));
        else if (e.name.endsWith(".js")) out.push({ full, rel: path.relative(base, full) });
    }
    return out;
}

function loadMod(filePath) {
    try {
        delete require.cache[require.resolve(filePath)];
        const m = require(filePath);
        if (!m) return null;
        if (Array.isArray(m)) return (m[0] && m[0].name) ? m[0] : null;
        return (typeof m === "object" && m.name) ? m : null;
    } catch { return null; }
}

// Returns ALL command objects from a file (single or array export)
function loadAllMods(filePath) {
    try {
        delete require.cache[require.resolve(filePath)];
        const m = require(filePath);
        if (!m) return [];
        if (Array.isArray(m)) return m.filter(c => c && c.name);
        return (typeof m === "object" && m.name) ? [m] : [];
    } catch { return []; }
}

function findFile(query) {
    const q = query.toLowerCase();
    for (const { full, rel } of scanJs(CMD_DIR)) {
        const mods = loadAllMods(full);
        for (const mod of mods) {
            const names = [mod.name, ...(mod.aliases || [])].map(n => n?.toLowerCase()).filter(Boolean);
            if (names.includes(q)) return { full, rel, mod };
        }
    }
    return null;
}



function hotUnregister(cmdName) {
    const n = cmdName.toLowerCase();
    for (const [key, c] of botClient.cmd.entries()) {
        const names = [c.name, ...(c.aliases || [])].map(x => x?.toLowerCase()).filter(Boolean);
        if (names.includes(n)) botClient.cmd.delete(key);
    }
}

function hotRegister(mod) {
    hotUnregister(mod.name);
    botClient.cmd.set(mod.name, mod);
}


function safeFileName(name) {
    return name.toLowerCase().replace(/[^a-z0-9_-]/g, "_");
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

function permText(mod) {
    const p = [];
    if (mod.permissions?.owner)   p.push("👑 Owner");
    if (mod.permissions?.admin)   p.push("🔰 Admin");
    if (mod.permissions?.premium) p.push("💎 Premium");
    if (mod.permissions?.coin)    p.push(`🪙 ${mod.permissions.coin} coins`);
    return p.length ? p.join(", ") : "🌐 Everyone";
}

async function fetchCode(url) {
    const res = await axios.get(url, { responseType: "text", timeout: 20000 });
    return typeof res.data === "string" ? res.data : JSON.stringify(res.data);
}

function parseCode(code) {
    const tmpFile = path.join(CMD_DIR, "__tmp__.js");
    try {
        fs.writeFileSync(tmpFile, code, "utf8");
        return loadMod(tmpFile);
    } finally {
        if (fs.existsSync(tmpFile)) {
            try { fs.unlinkSync(tmpFile); } catch {}
        }
    }
}


async function doInstall(ctx, code, forceOverwrite = false) {
    const mod = parseCode(code);
    if (!mod || !mod.name) {
        return ctx.reply(tools.msg.info("❌ Invalid command module — missing or invalid `name` export."));
    }

    const safeName = safeFileName(mod.name);
    const cat      = safeFileName(mod.category || "misc");
    const catDir   = path.join(CMD_DIR, cat);
    if (!fs.existsSync(catDir)) fs.mkdirSync(catDir, { recursive: true });

    const destFile = path.join(catDir, `${safeName}.js`);

    if (fs.existsSync(destFile) && !forceOverwrite) {
        
        pendingInstalls.set(ctx.sender.jid, { code, destFile, cat, safeName, mod });
        return ctx.reply({
            text: tools.msg.info(
                `⚠️ Command ${formatter.inlineCode(mod.name)} already exists!\n` +
                `React ✅ to this message to overwrite it, or ignore to cancel.`
            ),
            buttons: [{
                text: "✅ Yes, overwrite it!",
                id: `${ctx.used.prefix}cmd overwrite`
            }]
        });
    }

    fs.writeFileSync(destFile, code, "utf8");

    const allFreshMods = loadAllMods(destFile);
    for (const fm of allFreshMods) hotRegister(fm);

    const state = readState();
    for (const fm of allFreshMods) {
        state.disabled = state.disabled.filter(n => n !== fm.name.toLowerCase());
    }
    saveState(state);

    const stat = fileStat(destFile);
    const allNames = allFreshMods.map(m => m.name).join(", ");
    const allAliases = allFreshMods.flatMap(m => m.aliases || []).join(", ") || "—";
    return ctx.reply(
        `╔══[ ✅ *Command${allFreshMods.length > 1 ? "s" : ""} ${forceOverwrite ? "Overwritten" : "Installed"}* ]\n${LINE}\n` +
        `  🏷️  Name(s)     : ${formatter.bold(allNames)}\n` +
        `  🔗 Aliases     : ${allAliases}\n` +
        `  📂 Category    : ${formatter.inlineCode(cat)}\n` +
        `  📦 Size        : ${fmtSize(stat?.size || 0)}\n` +
        `  📄 File        : ${formatter.inlineCode(`commands/cmd/${cat}/${safeName}.js`)}\n` +
        `${LINE}\n` +
        `${tools.msg.info("⚡ Hot-loaded — active immediately, no restart needed!")}`
    );
}

async function doDelete(ctx, name) {
    const PROTECTED = [SELF_NAME, "event"];
    if (PROTECTED.includes(name.toLowerCase())) {
        return ctx.reply(tools.msg.info(`🔒 ${formatter.inlineCode(name)} is a protected command and cannot be deleted.`));
    }

    const found = findFile(name);
    if (!found) return ctx.reply(tools.msg.info(`❌ Command ${formatter.inlineCode(name)} not found.`));

    // Unregister ALL commands from this file (handles array exports)
    const allMods = loadAllMods(found.full);
    for (const m of allMods) hotUnregister(m.name);
    fs.unlinkSync(found.full);

    let parent = path.dirname(found.full);
    while (parent !== CMD_DIR) {
        try { if (!fs.readdirSync(parent).length) fs.rmdirSync(parent); else break; }
        catch { break; }
        parent = path.dirname(parent);
    }

    const state = readState();
    for (const m of allMods) {
        state.disabled = state.disabled.filter(n => n !== m.name.toLowerCase());
    }
    saveState(state);

    const allNames = allMods.map(m => m.name).join(", ");
    return ctx.reply(
        `╔══[ 🗑️ *Command${allMods.length > 1 ? "s" : ""} Deleted* ]\n${LINE}\n` +
        `  🏷️  Name(s) : ${formatter.bold(allNames)}\n` +
        `  📄 File    : ${formatter.inlineCode(found.rel)}\n` +
        `${LINE}\n` +
        `${tools.msg.info("⚡ Hot-unloaded — removed from memory immediately.")}`
    );
}

async function doReload(ctx, name) {
    if (!name || name === "all") {
        
        let count = 0;
        const state = readState();
        for (const { full } of scanJs(CMD_DIR)) {
            const mods = loadAllMods(full);
            for (const mod of mods) {
                if (state.disabled.includes(mod.name.toLowerCase())) continue;
                hotRegister(mod);
                count++;
            }
        }
        return ctx.reply(
            `╔══[ 🔄 *All Commands Reloaded* ]\n${LINE}\n` +
            `  ✅ ${count} command(s) reloaded from disk.\n` +
            `${LINE}\n` +
            `${tools.msg.info("⚡ All active — no restart needed.")}`
        );
    }

    const found = findFile(name);
    if (!found) return ctx.reply(tools.msg.info(`❌ Command ${formatter.inlineCode(name)} not found on disk.`));

    const freshMods = loadAllMods(found.full);
    if (!freshMods.length) return ctx.reply(tools.msg.info(`❌ Failed to reload — the file has a syntax error.`));

    for (const fm of freshMods) hotRegister(fm);
    const names = freshMods.map(m => m.name).join(", ");

    return ctx.reply(
        `╔══[ 🔄 *Command Reloaded* ]\n${LINE}\n` +
        `  🏷️  Name : ${formatter.bold(names)}\n` +
        `  📄 File : ${formatter.inlineCode(found.rel)}\n` +
        `${LINE}\n` +
        `${tools.msg.info("⚡ Active immediately.")}`
    );
}

async function doDisable(ctx, name) {
    const PROTECTED = [SELF_NAME, "event"];
    if (PROTECTED.includes(name.toLowerCase())) {
        return ctx.reply(tools.msg.info(`🔒 ${formatter.inlineCode(name)} cannot be disabled.`));
    }

    const state = readState();
    if (state.disabled.includes(name.toLowerCase())) {
        return ctx.reply(tools.msg.info(`⚠️ ${formatter.inlineCode(name)} is already disabled.`));
    }

    const found = findFile(name);
    if (!found) return ctx.reply(tools.msg.info(`❌ Command ${formatter.inlineCode(name)} not found on disk.`));

    // Disable ALL commands from this file (handles array exports)
    const allMods = loadAllMods(found.full);
    if (!allMods.length) return ctx.reply(tools.msg.info(`❌ Command ${formatter.inlineCode(name)} not found or not loaded.`));

    for (const m of allMods) {
        hotUnregister(m.name);
        if (!state.disabled.includes(m.name.toLowerCase())) {
            state.disabled.push(m.name.toLowerCase());
        }
    }
    saveState(state);

    const allNames = allMods.map(m => m.name).join(", ");
    return ctx.reply(
        `╔══[ 🚫 *Command${allMods.length > 1 ? "s" : ""} Disabled* ]\n${LINE}\n` +
        `  🏷️  Name(s) : ${formatter.bold(allNames)}\n` +
        `${LINE}\n` +
        `${tools.msg.info("File kept. Use `,cmd enable` to restore.")}`
    );
}

async function doEnable(ctx, name) {
    const state = readState();
    const idx   = state.disabled.indexOf(name.toLowerCase());
    if (idx === -1) return ctx.reply(tools.msg.info(`⚠️ ${formatter.inlineCode(name)} is not in the disabled list.`));

    const found = findFile(name);
    if (!found) {
        
        state.disabled.splice(idx, 1);
        saveState(state);
        return ctx.reply(tools.msg.info(`⚠️ File not found on disk. Removed from disabled list.`));
    }

    // Enable ALL commands from this file (handles array exports)
    const allMods = loadAllMods(found.full);
    for (const m of allMods) {
        hotRegister(m);
        state.disabled = state.disabled.filter(n => n !== m.name.toLowerCase());
    }
    saveState(state);

    const allNames = allMods.map(m => m.name).join(", ");
    return ctx.reply(
        `╔══[ ✅ *Command${allMods.length > 1 ? "s" : ""} Enabled* ]\n${LINE}\n` +
        `  🏷️  Name(s) : ${formatter.bold(allNames)}\n` +
        `${LINE}\n` +
        `${tools.msg.info("⚡ Active immediately.")}`
    );
}

async function doUpdate(ctx, name, url) {
    if (!name) return ctx.reply(tools.msg.info(`Provide the command name.\nExample: ${formatter.inlineCode(`${ctx.used.prefix}cmd update <name> <url>`)}`));
    if (!url || !tools.cmd.isUrl(url)) return ctx.reply(tools.msg.info("Provide a valid URL after the command name."));

    const found = findFile(name);
    if (!found) return ctx.reply(tools.msg.info(`❌ Command ${formatter.inlineCode(name)} not found. Use ${formatter.inlineCode("cmd install")} instead.`));

    await ctx.replyReact("⏳");

    let code;
    try { code = await fetchCode(url); }
    catch (e) { return ctx.reply(tools.msg.info(`❌ Fetch failed: ${e.message}`)); }

    const newMod = parseCode(code);
    if (!newMod?.name) return ctx.reply(tools.msg.info("❌ Invalid module — missing `name` export."));

    fs.writeFileSync(found.full, code, "utf8");
    const freshMod = loadMod(found.full);
    if (freshMod) hotRegister(freshMod);

    await ctx.replyReact("✅");
    return ctx.reply(
        `╔══[ 🔁 *Command Updated* ]\n${LINE}\n` +
        `  🏷️  Name : ${formatter.bold(newMod.name)}\n` +
        `  📄 File : ${formatter.inlineCode(found.rel)}\n` +
        `${LINE}\n` +
        `${tools.msg.info("⚡ Hot-reloaded — active immediately.")}`
    );
}

async function doInfo(ctx, name) {
    
    let liveEntry = null;
    const q = name.toLowerCase();
    for (const c of botClient.cmd.values()) {
        const names = [c.name, ...(c.aliases || [])].map(n => n?.toLowerCase()).filter(Boolean);
        if (names.includes(q)) { liveEntry = c; break; }
    }

    const found  = findFile(name);
    const mod    = found?.mod || liveEntry;
    if (!mod) return ctx.reply(tools.msg.info(`❌ Command ${formatter.inlineCode(name)} not found.`));

    const state     = readState();
    const isLoaded  = !!liveEntry;
    const isDisabled = state.disabled.includes((mod.name || name).toLowerCase());
    const stat      = found ? fileStat(found.full) : null;
    const aliases   = (mod.aliases || []).length ? mod.aliases.join(", ") : "—";
    const statusIcon = isDisabled ? "🚫 Disabled" : isLoaded ? "✅ Active" : "💤 Not loaded";

    return ctx.reply(
        `╔══[ ℹ️  *Command Info* ]\n${LINE}\n` +
        `  🏷️  Name        : ${formatter.bold(mod.name || "—")}\n` +
        `  🔗 Aliases     : ${aliases}\n` +
        `  📂 Category    : ${formatter.inlineCode(mod.category || "—")}\n` +
        `  📝 Description : ${mod.description || "—"}\n` +
        `  💡 Usage       : ${mod.usage ? formatter.inlineCode(mod.usage) : "—"}\n` +
        `  🔒 Permissions : ${permText(mod)}\n` +
        `  ⚡ Status      : ${statusIcon}\n` +
        (found ? `  📄 File        : ${formatter.inlineCode(found.rel)}\n` : "") +
        (stat  ? `  📦 Size        : ${fmtSize(stat.size)}\n` : "") +
        (stat  ? `  🕐 Modified    : ${fmtDate(stat.mtimeMs)}\n` : "") +
        LINE
    );
}

async function doSource(ctx, name) {
    const found = findFile(name);
    if (!found) return ctx.reply(tools.msg.info(`❌ Command ${formatter.inlineCode(name)} not found.`));

    const stat = fileStat(found.full);
    const buf  = fs.readFileSync(found.full);
    const fname = `${safeFileName(found.mod.name)}.js`;

    await ctx.reply({
        document : buf,
        fileName : fname,
        mimetype : "text/plain",
        caption  : tools.msg.info(`Source of ${formatter.inlineCode(found.mod.name)} — ${fmtSize(stat?.size || buf.length)}`)
    });
}

async function doList(ctx, keyword) {
    const files    = scanJs(CMD_DIR);
    const state    = readState();
    const q        = keyword?.toLowerCase();

    const byCategory = {};
    let total = 0;

    for (const { full, rel } of files) {
        const mods = loadAllMods(full);
        for (const mod of mods) {
            if (!mod?.name) continue;

            const isDisabled = state.disabled.includes(mod.name.toLowerCase());
            const isLoaded   = (() => {
                const n = mod.name.toLowerCase();
                for (const c of botClient.cmd.values()) {
                    const names = [c.name, ...(c.aliases || [])].map(x => x?.toLowerCase()).filter(Boolean);
                    if (names.includes(n)) return true;
                }
                return false;
            })();

            if (q) {
                const haystack = [mod.name, ...(mod.aliases || []), mod.category, mod.description]
                    .filter(Boolean).join(" ").toLowerCase();
                if (!haystack.includes(q)) continue;
            }

            const cat = mod.category || "misc";
            if (!byCategory[cat]) byCategory[cat] = [];
            byCategory[cat].push({ mod, isDisabled, isLoaded });
            total++;
        }
    }

    if (total === 0) {
        return ctx.reply(tools.msg.info(q ? `No commands matching "${q}".` : "No commands found."));
    }

    const cats = Object.keys(byCategory).sort();
    let txt = `╔══[ 📋 *Command List*${q ? ` — search: "${q}"` : ""} | ${total} found ]\n${LINE}\n`;

    for (const cat of cats) {
        txt += `\n  📂 *${tools.msg.ucwords(cat)}*\n`;
        for (const { mod, isDisabled, isLoaded } of byCategory[cat].sort((a, b) => a.mod.name.localeCompare(b.mod.name))) {
            const icon = isDisabled ? "🚫" : isLoaded ? "✅" : "💤";
            const aliases = (mod.aliases || []).length ? ` _(${mod.aliases.join("|")})_` : "";
            txt += `    ${icon} ${formatter.inlineCode(mod.name)}${aliases}\n`;
        }
    }

    txt += `\n${LINE}\n`;
    txt += `✅ Active  🚫 Disabled  💤 Not loaded`;
    return ctx.reply(txt);
}


module.exports = {
    name: "cmd",
    aliases: ["command"],
    category: "maker",
    description: "Advanced command manager — install, delete, reload, disable, enable, update, source, list",
    usage: "cmd <sub> [args]",
    permissions: { owner: true },

    async code(ctx) {
        const args = ctx.args || [];
        const sub  = (args[0] || "").toLowerCase();
        const pfx  = ctx.used.prefix;

        if (!sub || sub === "help") {
            return ctx.reply(
                `╔══[ 🛠️ *CMD Manager* ]\n${LINE}\n\n` +
                `  📥 *install* <url>          — Install from URL\n` +
                `  📥 *install* _(reply to .js)_ — Install from document\n` +
                `  🗑️  *delete*  <name>          — Delete + hot-unload\n` +
                `  🔄 *reload*  <name|all>      — Hot-reload from disk\n` +
                `  🚫 *disable* <name>          — Disable (keep file)\n` +
                `  ✅ *enable*  <name>          — Re-enable disabled\n` +
                `  🔁 *update*  <name> <url>    — Overwrite + hot-reload\n` +
                `  ℹ️   *info*    <name>          — Detailed info\n` +
                `  📄 *source*  <name>          — Get source as file\n` +
                `  📋 *list*    [keyword]       — List / search commands\n\n` +
                LINE
            );
        }

        if (sub === "install") {
            const url     = args[1];
            const quoted  = ctx.quoted;
            const qType   = quoted?.messageType;
            const isDoc   = qType === "documentMessage";
            const isText  = qType === "extendedTextMessage" || qType === "conversation";

            if (!url && (isDoc || isText)) {
                await ctx.replyReact("⏳");
                let code;
                try { code = (await quoted.download()).toString("utf8"); }
                catch (e) { return ctx.reply(tools.msg.info(`❌ Download failed: ${e.message}`)); }
                return doInstall(ctx, code);
            }

            if (url && tools.cmd.isUrl(url)) {
                await ctx.replyReact("⏳");
                let code;
                try { code = await fetchCode(url); }
                catch (e) { return ctx.reply(tools.msg.info(`❌ Fetch failed: ${e.message}`)); }
                return doInstall(ctx, code);
            }

            
            const afterInstall = ctx.text?.replace(/^install\s+/i, "").trim() || "";
            const moduleIdx = afterInstall.indexOf("module.exports");
            if (moduleIdx !== -1) {
                const rawCode = afterInstall.slice(moduleIdx).trim();
                await ctx.replyReact("⏳");
                return doInstall(ctx, rawCode);
            }

            return ctx.reply(
                tools.msg.info(
                    `Provide a URL, reply to a .js file, or paste raw code.\n` +
                    `Example: ${formatter.inlineCode(`${pfx}cmd install https://example.com/command.js`)}`
                )
            );
        }

        if (sub === "overwrite") {
            const pending = pendingInstalls.get(ctx.sender.jid);
            if (!pending) {
                return ctx.reply(tools.msg.info("❌ No pending install found. Please run `.cmd install` again."));
            }
            pendingInstalls.delete(ctx.sender.jid);
            await ctx.replyReact("⏳");
            return doInstall(ctx, pending.code, true);
        }

        if (sub === "delete" || sub === "remove") {
            const name = args[1];
            if (!name) return ctx.reply(tools.msg.info(`Usage: ${formatter.inlineCode(`${pfx}cmd delete <name>`)}`));
            return doDelete(ctx, name);
        }

        if (sub === "reload") {
            return doReload(ctx, args[1]);
        }

        if (sub === "disable") {
            const name = args[1];
            if (!name) return ctx.reply(tools.msg.info(`Usage: ${formatter.inlineCode(`${pfx}cmd disable <name>`)}`));
            return doDisable(ctx, name);
        }

        if (sub === "enable") {
            const name = args[1];
            if (!name) return ctx.reply(tools.msg.info(`Usage: ${formatter.inlineCode(`${pfx}cmd enable <name>`)}`));
            return doEnable(ctx, name);
        }

        if (sub === "update") {
            return doUpdate(ctx, args[1], args[2]);
        }

        if (sub === "info") {
            const name = args[1];
            if (!name) return ctx.reply(tools.msg.info(`Usage: ${formatter.inlineCode(`${pfx}cmd info <name>`)}`));
            return doInfo(ctx, name);
        }

        if (sub === "source" || sub === "src") {
            const name = args[1];
            if (!name) return ctx.reply(tools.msg.info(`Usage: ${formatter.inlineCode(`${pfx}cmd source <name>`)}`));
            return doSource(ctx, name);
        }

        if (sub === "list" || sub === "ls") {
            return doList(ctx, args[1]);
        }

        return ctx.reply(tools.msg.info(`Unknown sub-command. Use ${formatter.inlineCode(`${pfx}cmd help`)}.`));
    }
};
