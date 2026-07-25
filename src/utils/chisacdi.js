"use strict";


const BASE = "https://marincdi.onrender.com/api/marincdi";

async function call(type, params = {}) {
    const res = await axios.post(BASE, { type, ...params }, {
        timeout: 120_000,
        validateStatus: s => s < 500
    });
    if (!res.data) throw new Error("Empty response from API.");
    if (res.data.error) throw new Error(res.data.error);
    return res.data;
}

async function callMultipart(type, imgBuf, params = {}) {
    
    const boundary = `----MarinCDI${Date.now()}`;
    const crlf = "\r\n";

    const addField = (name, value) =>
        `--${boundary}${crlf}` +
        `Content-Disposition: form-data; name="${name}"${crlf}${crlf}` +
        `${value}${crlf}`;

    const addFile = (name, buf, filename = "image.jpg") =>
        Buffer.concat([
            Buffer.from(
                `--${boundary}${crlf}` +
                `Content-Disposition: form-data; name="${name}"; filename="${filename}"${crlf}` +
                `Content-Type: image/jpeg${crlf}${crlf}`
            ),
            buf,
            Buffer.from(crlf)
        ]);

    const parts = [addField("type", type)];
    for (const [k, v] of Object.entries(params)) parts.push(addField(k, v));

    const body = Buffer.concat([
        Buffer.from(parts.join("")),
        addFile("image", imgBuf),
        Buffer.from(`--${boundary}--${crlf}`)
    ]);

    const res = await axios.post(BASE, body, {
        timeout: 120_000,
        headers: { "Content-Type": `multipart/form-data; boundary=${boundary}` },
        validateStatus: s => s < 500
    });
    if (!res.data) throw new Error("Empty response from API.");
    if (res.data.error) throw new Error(res.data.error);
    return res.data;
}

module.exports = { call, callMultipart };
