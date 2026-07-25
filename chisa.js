try { require("node:process").loadEnvFile(); } catch {}
const { Config, Formatter } = require("wp-heart");
const axios = require("axios");
const axiosRetry = require("axios-retry").default;
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const crypto = require("node:crypto");
const { styleText } = require("node:util");
const pkg = require("./package.json");
const { getHTML } = require("./src/web/status.js");

axiosRetry(axios, {
    retries: 3,
    retryCondition: (error) => {
        const status = error.response?.status;
        return axiosRetry.isNetworkOrIdempotentRequestError(error) || status === 408 || status === 429;
    }
});

const tag = pkg.name;
Object.assign(global, {
    axios,
    config: new Config(path.resolve(__dirname, "settings.json")),
    consolefy: {
        log:     (...a) => console.log(`[${tag}]`, ...a),
        info:    (...a) => console.info(`[${tag}]`, ...a),
        warn:    (...a) => console.warn(`[${tag}] WARN`, ...a),
        error:   (...a) => console.error(`[${tag}] ERROR`, ...a),
        success: (...a) => console.log(`[${tag}] ✓`, ...a),
    },
    formatter: Formatter,
    tools: require("./src/utils/index.js")
});

{
    const chisaImages = ["chisa1.jpg","chisa2.jpg","chisa3.jpg","chisa4.jpg","chisa5.jpg"]
        .map(f => path.join(__dirname, "public", f))
        .filter(f => fs.existsSync(f));

    global.chisaImages = chisaImages;

    if (chisaImages.length > 0) {
        const picked = chisaImages[Math.floor(Math.random() * chisaImages.length)];
        
        fs.copyFileSync(picked, path.join(__dirname, "public", "thumbnail.jpg"));
        config.bot.thumbnail = picked;
    } else if (config.bot?.thumbnail) {
        
        const thumb = config.bot.thumbnail;
        if (!/^https?:\/\//.test(thumb)) {
            const candidate = thumb.startsWith("/") ? thumb : path.resolve(__dirname, thumb);
            const absPath = fs.existsSync(candidate)
                ? candidate
                : (fs.existsSync(path.join(__dirname, "public", path.basename(thumb)))
                    ? path.join(__dirname, "public", path.basename(thumb))
                    : null);
            if (absPath) config.bot.thumbnail = absPath;
        }
    }
}
global.thumbnailPath = config.bot?.thumbnail || null;

consolefy.log("Starting...");

const c = (t, s) => { try { return styleText(s, t); } catch { return t; } };
console.log("");
console.log(c("  ================================", "cyan"));
console.log(c("    CHISA", "blueBright") + "  " + c("v" + pkg.version, "white"));
console.log(c("    Advanced WhatsApp Bot", "white"));
console.log(c("    by ", "cyan") + c("SIFAT", "yellowBright"));
console.log(c("  ================================", "cyan"));
console.log("");

global.botState = { connected: false, pairingCode: null, phone: config.bot?.phoneNumber || null };
global.loginResetToken = crypto.randomBytes(24).toString("hex");
let lastLoginResetAt = 0;

process.on("uncaughtException", (err) => consolefy.error("Uncaught exception:", err));
process.on("unhandledRejection", (reason) => consolefy.error("Unhandled rejection:", reason));

const port = config.system?.port || 5000;
const startTime = Date.now();
const MIME = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp"
};

const server = http.createServer((req, res) => {
    const url = req.url?.split("?")[0];

    if (url === "/api/status") {
        if (req.method !== "GET") {
            res.writeHead(405, {
                "Allow": "GET",
                "Content-Type": "application/json; charset=utf-8"
            });
            return res.end(JSON.stringify({ error: "Method not allowed" }));
        }
        res.writeHead(200, {
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": "no-store"
        });
        return res.end(JSON.stringify({
            status: "alive",
            bot: pkg.name,
            version: pkg.version,
            uptime: process.uptime(),
            connected: global.botState.connected,
            pairingCode: global.botState.pairingCode,
            phone: global.botState.phone
        }));
    }

    if (url === "/api/request-login" && req.method === "POST") {
        res.writeHead(200, {
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": "no-store"
        });
        if (global.botState.connected) {
            return res.end(JSON.stringify({ success: false, message: "Already connected" }));
        }
        const token = req.headers["x-chisa-reset-token"];
        const csrfCookie = req.headers.cookie?.match(/(?:^|;\s*)chisa_csrf=([^;]+)/)?.[1];
        const origin = req.headers.origin;
        const host = req.headers.host;
        if (token !== global.loginResetToken || csrfCookie !== global.loginResetToken || (origin && !origin.endsWith(`://${host}`))) {
            return res.end(JSON.stringify({ success: false, message: "Unauthorized request" }));
        }
        const now = Date.now();
        if (now - lastLoginResetAt < 60_000) {
            return res.end(JSON.stringify({ success: false, message: "Please wait before requesting another pairing code." }));
        }
        lastLoginResetAt = now;
        const botClient = global.botClient;
        if (!botClient?.resetSession) {
            return res.end(JSON.stringify({ success: false, message: "Bot client is not ready yet." }));
        }
        botClient.resetSession().catch(error => {
            consolefy.error("Session reset error:", error);
            lastLoginResetAt = 0;
        });
        return res.end(JSON.stringify({ success: true, message: "Session cleared — new pairing code coming shortly..." }));
    }

    if (url === "/api/request-login") {
        res.writeHead(405, {
            "Allow": "POST",
            "Content-Type": "application/json; charset=utf-8"
        });
        return res.end(JSON.stringify({ error: "Method not allowed" }));
    }

    const ext = path.extname(url).toLowerCase();
    if (MIME[ext]) {
        const filePath = path.join(__dirname, "public", path.basename(url));
        if (fs.existsSync(filePath)) {
            res.writeHead(200, { "Content-Type": MIME[ext], "Cache-Control": "public, max-age=86400" });
            return res.end(fs.readFileSync(filePath));
        }
    }

    if (url !== "/") {
        res.writeHead(404, { "Content-Type": "application/json; charset=utf-8" });
        return res.end(JSON.stringify({ error: "Not found" }));
    }

    if (req.method !== "GET") {
        res.writeHead(405, {
            "Allow": "GET",
            "Content-Type": "application/json; charset=utf-8"
        });
        return res.end(JSON.stringify({ error: "Method not allowed" }));
    }

    res.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        "Set-Cookie": `chisa_csrf=${global.loginResetToken}; HttpOnly; SameSite=Strict; Path=/`
    });
    res.end(getHTML(pkg, startTime, global.botState, global.loginResetToken));
});

server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
        consolefy.warn(`Port ${port} in use, retrying in 3s...`);
        server.close(() => {
            setTimeout(() => server.listen(port, "0.0.0.0"), 3000);
        });
    } else {
        consolefy.error(`Server error: ${err.message}`);
    }
});

server.listen(port, "0.0.0.0", () => {
    consolefy.success(`${pkg.name} health server running on port ${port}`);
});

(async () => {
    try {
        await tools.api.init();
    } catch (error) {
        consolefy.warn(`API catalog initialization failed: ${error.message}`);
    }
    try {
        require("./src/core/sifat.js");
    } catch (error) {
        consolefy.error("Bot startup failed:", error);
    }
})();
