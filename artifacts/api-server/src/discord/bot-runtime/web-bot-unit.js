// ── Web Bot Unit ──────────────────────────────────────────────────────────
// WebSocket-based Agario bot. Connects directly to the arena server URL
// (wss://live-arena-XXXX.agar.io:443). No TCP, no port 9000.

import { WebSocket } from "ws";
import { logger } from "./runtime-logger.js";

const MOVE_TICK_MS = 50;

// ── Crypto helpers (ported 1:1 from reference Protocol class) ─────────────

function xorBuffer(buf, key) {
    const keyBytes = Buffer.allocUnsafe(4);
    keyBytes.writeUInt32LE(key >>> 0, 0);
    const out = Buffer.from(buf);
    for (let i = 0; i < out.length; i++) out[i] ^= keyBytes[i % 4];
    return out;
}

function rotateKey(key) {
    key = Math.imul(key, 1540483477) | 0;
    key = (Math.imul(key >>> 24 ^ key, 1540483477) | 0) ^ 114296087;
    key = Math.imul(key >>> 13 ^ key, 1540483477) | 0;
    return (key >>> 15 ^ key);
}

function murmur2(str, seed) {
    let l = str.length, h = seed ^ l, i = 0, k;
    while (l >= 4) {
        k = (str.charCodeAt(i) & 0xff) |
            ((str.charCodeAt(++i) & 0xff) << 8) |
            ((str.charCodeAt(++i) & 0xff) << 16) |
            ((str.charCodeAt(++i) & 0xff) << 24);
        k = (((k & 0xffff) * 0x5bd1e995) + ((((k >>> 16) * 0x5bd1e995) & 0xffff) << 16));
        k ^= k >>> 24;
        k = (((k & 0xffff) * 0x5bd1e995) + ((((k >>> 16) * 0x5bd1e995) & 0xffff) << 16));
        h = (((h & 0xffff) * 0x5bd1e995) + ((((h >>> 16) * 0x5bd1e995) & 0xffff) << 16)) ^ k;
        l -= 4; ++i;
    }
    switch (l) {
        case 3: h ^= (str.charCodeAt(i + 2) & 0xff) << 16; // fallthrough
        case 2: h ^= (str.charCodeAt(i + 1) & 0xff) << 8;  // fallthrough
        case 1:
            h ^= (str.charCodeAt(i) & 0xff);
            h = (((h & 0xffff) * 0x5bd1e995) + ((((h >>> 16) * 0x5bd1e995) & 0xffff) << 16));
    }
    h ^= h >>> 13;
    h = (((h & 0xffff) * 0x5bd1e995) + ((((h >>> 16) * 0x5bd1e995) & 0xffff) << 16));
    return (h ^ (h >>> 15)) >>> 0;
}

// LZ4 block decompression (ported 1:1 from reference Protocol class)
function uncompressMessage(input) {
    const output = [];
    for (let i = 0, j = 0, n = input.length; i < n;) {
        const token = input[i++];
        let literalsLength = token >> 4;
        if (literalsLength > 0) {
            let length = literalsLength + 240;
            while (length === 255) { length = input[i++]; literalsLength += length; }
            const end = i + literalsLength;
            while (i < end) output[j++] = input[i++];
            if (i === n) return Buffer.from(output);
        }
        const offset = input[i++] | (input[i++] << 8);
        if (offset === 0 || offset > j) return null;
        let matchLength = token & 15;
        let length = matchLength + 240;
        while (length === 255) { length = input[i++]; matchLength += length; }
        let pos = j - offset;
        const end = j + matchLength + 4;
        while (j < end) output[j++] = output[pos++];
    }
    return Buffer.from(output);
}

// ── Packet builders ───────────────────────────────────────────────────────

function protocolVersionPacket(v) {
    const buf = Buffer.alloc(5);
    buf[0] = 0xfe;
    buf.writeUInt32LE(v >>> 0, 1);
    return buf;
}

function versionIntPacket(v) {
    const buf = Buffer.alloc(5);
    buf[0] = 0xff;
    buf.writeUInt32LE(v >>> 0, 1);
    return buf;
}

function spawnPacket(name) {
    // opcode 0x00 + UTF-8 name (web protocol, no null terminator)
    const encoded = Buffer.from(unescape(encodeURIComponent(String(name))), "binary");
    const buf = Buffer.alloc(1 + encoded.length);
    buf[0] = 0x00;
    encoded.copy(buf, 1);
    return buf;
}

function movePacket(x, y, movementKey) {
    const buf = Buffer.alloc(13);
    buf[0] = 0x10;
    buf.writeInt32LE(x | 0, 1);
    buf.writeInt32LE(y | 0, 5);
    buf.writeUInt32LE(movementKey >>> 0, 9);
    return buf;
}

// ── Bot unit ──────────────────────────────────────────────────────────────

export class WebBotUnit {
    constructor(client) {
        this.client       = client;
        this.assignedName = typeof client.allocateBotName === "function"
            ? client.allocateBotName()
            : client.botName;

        this.ws            = null;
        this.encryptionKey = 0;
        this.decryptionKey = 0;
        this.movementKey   = 0;

        this.isAlive  = false;
        this.isClosed = false;
        this.moveInterval = null;

        this.connect();
    }

    connect() {
        const url = this.client.serverUrl;
        try {
            this.ws = new WebSocket(url, {
                headers: {
                    Origin:     "https://agar.io",
                    "User-Agent":
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
                        "AppleWebKit/537.36 (KHTML, like Gecko) " +
                        "Chrome/124.0.0.0 Safari/537.36",
                },
            });
            this.ws.binaryType = "arraybuffer";
            this.ws.on("open",    ()    => this.onOpen());
            this.ws.on("message", (msg) => this.onMessage(msg));
            this.ws.on("close",   ()    => this.onClose());
            this.ws.on("error",   (err) => this.onError(err));
        } catch (err) {
            logger.error(`Bot failed to create WebSocket → ${url}: ${err.message}`);
        }
    }

    onOpen() {
        logger.info(`Bot connected → ${this.client.serverUrl}`);
        this.client.connectedBots = (this.client.connectedBots || 0) + 1;
        // Handshake — both packets sent plain (unencrypted)
        this.rawSend(protocolVersionPacket(this.client.protocolVersion));
        this.rawSend(versionIntPacket(this.client.versionInt));
    }

    onMessage(data) {
        // Convert to Buffer
        const raw = Buffer.isBuffer(data) ? data : Buffer.from(data);

        // XOR-decrypt with decryptionKey (0 before 0xF1 → no-op)
        const msg = this.decryptionKey ? xorBuffer(raw, this.decryptionKey) : raw;
        const opcode = msg[0];

        switch (opcode) {

            // 0xF1 (241): key exchange — server sends movementKey + version string
            case 241: {
                const movementKey = msg.readInt32LE(1);
                this.movementKey   = movementKey;
                this.decryptionKey = (movementKey ^ this.client.versionInt) >>> 0;

                let off = 5;
                let version = "";
                while (off < msg.length) {
                    const c = msg[off++];
                    if (c === 0) break;
                    version += String.fromCharCode(c);
                }

                this.encryptionKey = murmur2(this.client.host + version, 255);
                logger.info(
                    `Bot 0xF1 → movKey=${movementKey} decKey=${this.decryptionKey} ` +
                    `encKey=${this.encryptionKey} ver="${version}"`
                );

                // Spawn (encrypted)
                this.send(spawnPacket(this.assignedName), true);
                this.isAlive = true;
                this.startMoving();
                break;
            }

            // 0x10 (16): world update — direct (uncompressed)
            case 16:
                this.parseWorldUpdate(msg);
                break;

            // 0xFF (255): compressed message
            case 255: {
                if (msg.length < 6) break;
                const inner = msg.subarray(5);
                try {
                    const decompressed = uncompressMessage(inner);
                    if (decompressed && decompressed[0] === 16) {
                        this.parseWorldUpdate(decompressed);
                    }
                } catch (_) {}
                break;
            }

            // Other opcodes — ignore
            default:
                break;
        }
    }

    /**
     * Parse an 0x10 world-update packet to track the owner's cell position.
     * Follows the exact field layout from the reference ClientSide code.
     */
    parseWorldUpdate(data) {
        try {
            let off = 1;
            // eat/destroy count → skip pairs
            if (off + 2 > data.length) return;
            const eatCount = data.readUInt16LE(off); off += 2;
            off += eatCount * 8;

            while (off + 4 <= data.length) {
                const id = data.readUInt32LE(off); off += 4;
                if (id === 0) break;
                if (off + 10 > data.length) break;

                const x     = data.readInt32LE(off);  off += 4;
                const y     = data.readInt32LE(off);  off += 4;
                const _size = data.readUInt16LE(off); off += 2;
                const flags = data.readUInt8(off);    off += 1;

                // extended flags byte
                let extFlags = 0;
                if (flags & 128) { extFlags = data.readUInt8(off); off += 1; }

                // color (3 bytes)
                if (flags & 2) off += 3;

                // skin string (null-terminated)
                let skin = "";
                if (flags & 4) {
                    while (off < data.length) {
                        const c = data[off++];
                        if (c === 0) break;
                        skin += String.fromCharCode(c);
                    }
                }

                // name string (null-terminated)
                let name = "";
                if (flags & 8) {
                    while (off < data.length) {
                        const c = data[off++];
                        if (c === 0) break;
                        name += String.fromCharCode(c);
                    }
                    try { name = decodeURIComponent(escape(name)); } catch (_) {}
                }

                // extended: skip 4 bytes if extFlags & 4
                if (extFlags & 4) off += 4;

                // Match owner by display name
                if (
                    this.client.ownerName &&
                    name &&
                    name.toLowerCase() === this.client.ownerName.toLowerCase()
                ) {
                    this.client.ownerX = x;
                    this.client.ownerY = y;
                }
            }
        } catch (_) {}
    }

    // ── Sending ───────────────────────────────────────────────────────────

    rawSend(buf) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(buf);
        }
    }

    send(buf, encrypt = false) {
        let data = buf;
        if (encrypt && this.encryptionKey) {
            data = xorBuffer(buf, this.encryptionKey);
            this.encryptionKey = rotateKey(this.encryptionKey);
        }
        this.rawSend(data);
    }

    // ── Game loop ─────────────────────────────────────────────────────────

    startMoving() {
        if (this.moveInterval) return;
        this.moveInterval = setInterval(() => this.tick(), MOVE_TICK_MS);
        if (typeof this.moveInterval?.unref === "function") this.moveInterval.unref();
    }

    tick() {
        if (this.isClosed || !this.isAlive) return;
        const x = Number.isFinite(this.client.ownerX) ? this.client.ownerX : 0;
        const y = Number.isFinite(this.client.ownerY) ? this.client.ownerY : 0;
        this.send(movePacket(x, y, this.movementKey), true);
    }

    // ── Cleanup ───────────────────────────────────────────────────────────

    stop() {
        this.isClosed = true;
        clearInterval(this.moveInterval);
        this.moveInterval = null;
        if (this.ws) {
            try { this.ws.close(); } catch (_) {}
            this.ws = null;
        }
    }

    onClose() {
        this.isAlive = false;
        this.client.connectedBots = Math.max(0, (this.client.connectedBots || 1) - 1);
        clearInterval(this.moveInterval);
        this.moveInterval = null;
        logger.info(`Bot disconnected from ${this.client.serverUrl}`);
    }

    onError(err) {
        logger.error(`Bot error on ${this.client.serverUrl} — ${err.message}`);
    }
}
