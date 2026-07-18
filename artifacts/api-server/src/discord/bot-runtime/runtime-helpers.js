// ── Runtime Helpers ────────────────────────────────────────────────────────
// Implements murmur2, XOR encryption, buffer helpers needed by bot-unit.js

import { inflateRawSync } from "zlib";

const AGAR_KEY_MULTIPLIER = 1540483477;
const AGAR_KEY_XOR        = 114296087;
const textEncoder         = new TextEncoder();

function murmur2(source, seed = 0) {
    const MULT  = 0x5bd1e995;
    const bytes = textEncoder.encode(String(source || ""));
    let length  = bytes.length;
    let offset  = 0;
    let hash    = (seed ^ length) >>> 0;

    while (length >= 4) {
        let block =
            (bytes[offset]      & 0xff)        |
            ((bytes[offset + 1] & 0xff) << 8)  |
            ((bytes[offset + 2] & 0xff) << 16) |
            ((bytes[offset + 3] & 0xff) << 24);
        block  = Math.imul(block, MULT) >>> 0;
        block ^= block >>> 24;
        block  = Math.imul(block, MULT) >>> 0;
        hash   = Math.imul(hash, MULT) >>> 0;
        hash  ^= block;
        offset += 4;
        length -= 4;
    }
    switch (length) {
        case 3: hash ^= (bytes[offset + 2] & 0xff) << 16; // fall-through
        case 2: hash ^= (bytes[offset + 1] & 0xff) << 8;  // fall-through
        case 1:
            hash ^= bytes[offset] & 0xff;
            hash  = Math.imul(hash, MULT) >>> 0;
            break;
    }
    hash ^= hash >>> 13;
    hash  = Math.imul(hash, MULT) >>> 0;
    hash ^= hash >>> 15;
    return hash >>> 0;
}

function rotateKey(key) {
    let k = Math.imul(key | 0, AGAR_KEY_MULTIPLIER);
    k = (Math.imul(((k >>> 24) ^ k) | 0, AGAR_KEY_MULTIPLIER) ^ AGAR_KEY_XOR) | 0;
    k = Math.imul(((k >>> 13) ^ k) | 0, AGAR_KEY_MULTIPLIER);
    return (((k >>> 15) ^ k) >>> 0);
}

function xorBuffer(raw, key) {
    const buf    = Buffer.isBuffer(raw) ? raw : Buffer.from(raw);
    const result = Buffer.allocUnsafe(buf.length);
    const k      = key >>> 0;
    for (let i = 0; i < buf.length; i++) {
        result[i] = buf[i] ^ ((k >>> ((i % 4) * 8)) & 0xff);
    }
    return result;
}

function generateHeaders() {
    return {
        "Accept-Encoding":       "gzip, deflate, br",
        "Pragma":                "no-cache",
        "Origin":                "https://agar.io",
        "Accept-Language":       "en-US,en;q=0.9",
        "User-Agent":            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Upgrade":               "websocket",
        "Cache-Control":         "no-cache",
        "Connection":            "Upgrade",
        "Sec-WebSocket-Version": "13",
    };
}

/** Agario mass formula: mass = size² / 100 */
function size2mass(size) {
    return (size * size) / 100;
}

function intToHex(n) {
    return `#${(n & 0xffffff).toString(16).padStart(6, "0")}`;
}

function uncompressBuffer(data, target) {
    try {
        const inflated = inflateRawSync(data);
        inflated.copy(target);
        return target;
    } catch (_) {
        // If decompression fails, copy as-is (best effort)
        data.copy(target);
        return target;
    }
}

function calculateDistance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}

export const helper = {
    murmur2,
    rotateKey,
    xorBuffer,
    generateHeaders,
    size2mass,
    intToHex,
    uncompressBuffer,
    calculateDistance,
};
