const util = require("node:util");

const APIs = {
    SIFAT_CDTESE: {
        baseURL: "https://raw.githubusercontent.com/FX-SIFAT/SIFATChudtese/refs/heads/main/sifatapichudtese.json"
    },
    siputzx: {
        baseURL: "https://siputzx.my.id"
    },
    SIFAT: {
        baseURL: "https://fx-sifat.vercel.app"
    }
};

function init() {
    consolefy.success(`API list loaded: ${Object.keys(APIs).length} APIs available.`);
}

function createUrl(apiNameOrURL, endpoint, params = {}, apiKeyParamName) {
    try {
        const api = APIs[apiNameOrURL];
        const queryParams = new URLSearchParams(params);
        if (apiKeyParamName && api?.APIKey) queryParams.set(apiKeyParamName, api.APIKey);

        const baseURL = api ? api.baseURL : apiNameOrURL;
        const apiUrl = new URL(endpoint, baseURL);
        apiUrl.search = queryParams.toString();

        return apiUrl.toString();
    } catch (error) {
        consolefy.error(`API URL error: ${util.format(error)}`);
        return null;
    }
}

async function get(endpoint, params = {}) {
    const url = createUrl("SIFAT", endpoint, params);
    const res = await axios.get(url, { timeout: 30_000, validateStatus: s => s < 500 });
    if (!res.data) throw new Error("Empty response");
    const d = res.data;
    if (d?.status === false) throw new Error(d?.error || "API error");
    return d;
}

async function getBinary(endpoint, params = {}) {
    const url = createUrl("SIFAT", endpoint, params);
    const res = await axios.get(url, {
        timeout: 60_000,
        responseType: "arraybuffer",
        validateStatus: s => s < 500
    });
    if (!res.data || res.data.byteLength < 100) throw new Error("No image returned");
    return { buffer: Buffer.from(res.data), type: res.headers["content-type"] || "image/jpeg" };
}

function listUrl() {
    return APIs;
}

module.exports = { init, createUrl, get, getBinary, listUrl };
