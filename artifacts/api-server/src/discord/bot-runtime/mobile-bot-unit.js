// ── Mobile Bot Unit ───────────────────────────────────────────────────────
// TCP-based Agario bot for Agario Mobile servers (port 9000).
// Same binary protocol as the web version but over raw TCP, not WebSocket.

import net from "net";
import { helper }  from "./runtime-helpers.js";
import { buffers } from "./protocol-buffers.js";
import { logger }  from "./runtime-logger.js";

// How often to send a move packet (ms)
const MOVE_TICK_MS = 50;

export class MobileBotUnit {
    constructor(client) {
        this.client          = client;
        this.assignedName    = typeof client.allocateBotName === "function"
            ? client.allocateBotName()
            : client.botName;

        this.socket          = null;
        this.rawBuf          = Buffer.alloc(0);  // unprocessed raw bytes from server

        // Encryption state
        this.decryptionKey   = 0;   // key to XOR received data
        this.encryptionKey   = 0;   // key to XOR sent data (rotates per packet)
        // Track stream offset so XOR cycles correctly across TCP segments
        this.rxOffset        = 0;   // bytes consumed from the encrypted stream

        // Bot state
        this.isConnected     = false;
        this.isAlive         = false;
        this.isClosed        = false;
        this.spawnedAt       = 0;

        // Map geometry
        this.offsetX         = 0;
        this.offsetY         = 0;

        this.moveInterval    = null;
        this.spawnTimeout    = null;
        this.connectTimeout  = null;

        this.connect();
    }

    // ── Connection ────────────────────────────────────────────────────────

    connect() {
        const host = this.client.host;
        const port = this.client.port;

        this.socket = net.createConnection({ host, port });
        this.socket.on("connect", () => this.onConnect());
        this.socket.on("data",    (chunk) => this.onData(chunk));
        this.socket.on("close",   () => this.onClose());
        this.socket.on("error",   (err) => this.onError(err));
        this.socket.setTimeout(15_000);
        this.socket.on("timeout", () => {
            logger.warn(`Bot timeout connecting to ${host}:${port}`);
            this.socket.destroy();
        });
    }

    onConnect() {
        logger.info(`Bot connected → ${this.client.host}:${this.client.port}`);
        this.isConnected = true;
        this.client.connectedBots = (this.client.connectedBots || 0) + 1;

        // Handshake: send protocol version + client version (plain, unencrypted)
        this.rawSend(buffers.protocolVersion(this.client.protocolVersion));
        this.rawSend(buffers.protocolKey(this.client.clientVersion));
    }

    // ── Incoming data ─────────────────────────────────────────────────────

    onData(chunk) {
        this.rawBuf = Buffer.concat([this.rawBuf, chunk]);
        this.parseIncoming();
    }

    /** Parse as many complete packets as possible from rawBuf. */
    parseIncoming() {
        while (this.rawBuf.length > 0) {
            // Before decryptionKey is set, packets arrive plain (0xF1 is unencrypted)
            const data = this.decryptionKey
                ? this.decryptStream(this.rawBuf)
                : this.rawBuf;

            const opcode = data[0];
            const consumed = this.handleOpcode(opcode, data);
            if (consumed === 0) break;  // need more bytes

            this.rawBuf = this.rawBuf.subarray(consumed);
            if (this.decryptionKey) this.rxOffset += consumed;
        }
    }

    /**
     * Decrypt `raw` using XOR starting at current rxOffset in the stream.
     * The key repeats every 4 bytes based on stream position.
     */
    decryptStream(raw) {
        const key    = (this.decryptionKey ^ this.client.clientVersion) >>> 0;
        const result = Buffer.allocUnsafe(raw.length);
        for (let i = 0; i < raw.length; i++) {
            const streamPos = this.rxOffset + i;
            result[i] = raw[i] ^ ((key >>> ((streamPos % 4) * 8)) & 0xff);
        }
        return result;
    }

    /**
     * Handle one packet starting with `opcode` from `data`.
     * Returns number of bytes consumed (0 = incomplete packet, retry when more data arrives).
     */
    handleOpcode(opcode, data) {
        switch (opcode) {

            // ── 0xF1: Server sends decryption key + server-id string ──────
            case 0xf1: {
                if (data.length < 6) return 0;
                const keyVal = data.readUInt32LE(1);
                // Find null-terminator of the server-id string
                let end = 5;
                while (end < data.length && data[end] !== 0x00) end++;
                if (end >= data.length) return 0;  // string incomplete

                const serverToken = data.toString("utf8", 5, end);
                this.decryptionKey = keyVal;
                // Derive encryption key from mobile server hostname + token
                // (same formula as web, but no URL path — just hostname)
                this.encryptionKey = helper.murmur2(this.client.host + serverToken, 0xff);
                logger.info(
                    `Bot 0xF1 → decKey=${keyVal}, encKey=${this.encryptionKey}, token="${serverToken}"`,
                );
                // After this packet, further server data arrives encrypted → reset rxOffset
                this.rxOffset = 0;
                return end + 1;  // opcode(1) + key(4) + string(N) + null(1)
            }

            // ── 0xF2: Server ready for spawn ──────────────────────────────
            case 0xf2: {
                logger.info("Bot 0xF2 → sending spawn…");
                this.sendPacket(buffers.spawn(this.assignedName), true);
                // If a party code is set, send userparty right after spawn
                if (this.client.partyCode) {
                    logger.info(`Bot sending userparty → "${this.client.partyCode}"`);
                    this.sendPacket(buffers.userParty(this.client.partyCode), true);
                }
                this.spawnedAt = Date.now();
                this.isAlive   = true;
                this.startMoving();
                return 1;
            }

            // ── 0x12: Clear all cells ─────────────────────────────────────
            case 0x12: {
                this.isAlive = false;
                this.scheduleRespawn();
                return 1;
            }

            // ── 0x20: "You are" packet (my cell ID) ──────────────────────
            case 0x20: {
                if (data.length < 5) return 0;
                return 5;  // opcode(1) + uint32(4)
            }

            // ── 0x40: Update viewport offset ─────────────────────────────
            case 0x40: {
                if (data.length < 33) return 0;
                // 4 doubles (8 bytes each) + 1 uint8
                this.offsetX = (data.readDoubleBE(1) + data.readDoubleBE(17)) / 2;
                this.offsetY = (data.readDoubleBE(9) + data.readDoubleBE(25)) / 2;
                return 33;
            }

            // ── 0x45: Ghost-cells reset ───────────────────────────────────
            case 0x45: {
                if (data.length < 5) return 0;
                const count = data.readUInt32LE(1);
                const needed = 5 + count * 4;
                if (data.length < needed) return 0;
                return needed;
            }

            // ── 0x55: Connection unusable (banned / full) ─────────────────
            case 0x55: {
                logger.warn("Bot received 0x55 — server says connection unusable");
                this.socket.destroy();
                return 1;
            }

            // ── 0xFF: Compressed game-state update ────────────────────────
            case 0xff: {
                if (data.length < 5) return 0;
                const compressedSize = data.readUInt32LE(1);
                if (data.length < 5 + compressedSize) return 0;
                const compressed = data.subarray(5, 5 + compressedSize);
                try {
                    const decompressed = helper.uncompressBuffer(
                        compressed,
                        Buffer.alloc(compressedSize * 4),
                    );
                    this.handleGameMessage(decompressed);
                } catch (_) {}
                return 5 + compressedSize;
            }

            // ── 0x67 / 0x68: Unused ────────────────────────────────────────
            case 0x67:
            case 0x68:
                return 1;

            default:
                // Unknown opcode — skip 1 byte so we don't stall
                logger.warn(`Bot unknown opcode 0x${opcode.toString(16)} — skipping`);
                return 1;
        }
    }

    /** Handle decompressed game-state packets (from 0xFF). */
    handleGameMessage(data) {
        if (data.length < 1) return;
        const opcode = data[0];

        if (opcode === 0x10) {
            // updateNodes — contains cell positions and account IDs
            this.parseUpdateNodes(data);
        } else if (opcode === 0x40) {
            if (data.length >= 33) {
                this.offsetX = (data.readDoubleBE(1) + data.readDoubleBE(17)) / 2;
                this.offsetY = (data.readDoubleBE(9) + data.readDoubleBE(25)) / 2;
            }
        }
    }

    /**
     * Parse an 0x10 updateNodes packet to find the owner's cell by UID.
     * Sets client.ownerX / ownerY when found.
     */
    parseUpdateNodes(data) {
        // Simplified parser — enough to extract positions and accountIDs
        try {
            let off = 1; // skip opcode

            // eat/destroy pairs first
            if (data.length < 3) return;
            const eatCount = data.readUInt16LE(off); off += 2;
            off += eatCount * 8; // each pair = 2×uint32

            // node list until id==0
            while (off + 4 <= data.length) {
                const id = data.readUInt32LE(off); off += 4;
                if (id === 0) break;
                if (off + 14 > data.length) break;
                const x    = data.readInt32LE(off);  off += 4;
                const y    = data.readInt32LE(off);  off += 4;
                const size = data.readUInt16LE(off); off += 2;

                const flags = data.readUInt8(off);   off += 1;
                const isFood = (flags & 0x01) !== 0;
                const isVirus= (flags & 0x02) !== 0;
                const hasAccountId = (flags & 0x04) !== 0;
                const hasName      = (flags & 0x08) !== 0;

                // optional accountID (uint32)
                let accountId = 0;
                if (hasAccountId) {
                    if (off + 4 > data.length) break;
                    accountId = data.readUInt32LE(off); off += 4;
                }

                // optional name string (null-terminated UTF-8)
                if (hasName) {
                    while (off < data.length && data[off] !== 0x00) off++;
                    off++; // skip null terminator
                }

                // Check if this is our owner's cell (match by accountId from UID)
                if (this.client.ownerAccountId && accountId === this.client.ownerAccountId) {
                    this.client.ownerX = x;
                    this.client.ownerY = y;
                }
            }
        } catch (_) {}
    }

    // ── Sending ───────────────────────────────────────────────────────────

    rawSend(buf) {
        if (!this.socket || this.socket.destroyed) return;
        this.socket.write(buf);
    }

    /** Send an encrypted (or plain) packet. */
    sendPacket(buf, encrypt = false) {
        let data = buf;
        if (encrypt && this.encryptionKey) {
            data = helper.xorBuffer(buf, this.encryptionKey);
            this.encryptionKey = helper.rotateKey(this.encryptionKey);
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

        const ownerX = this.client.ownerX;
        const ownerY = this.client.ownerY;
        const targetX = Number.isFinite(ownerX) ? ownerX : 0;
        const targetY = Number.isFinite(ownerY) ? ownerY : 0;

        this.sendPacket(buffers.moveTo(targetX, targetY, this.decryptionKey), true);
    }

    scheduleRespawn() {
        if (this.isClosed) return;
        clearTimeout(this.spawnTimeout);
        this.spawnTimeout = setTimeout(() => {
            if (!this.isClosed) {
                this.sendPacket(buffers.spawn(this.assignedName), true);
                this.isAlive   = true;
                this.spawnedAt = Date.now();
            }
        }, 3_000);
    }

    // ── Cleanup ───────────────────────────────────────────────────────────

    stop() {
        this.isClosed = true;
        clearInterval(this.moveInterval);
        clearTimeout(this.spawnTimeout);
        clearTimeout(this.connectTimeout);
        this.moveInterval = null;
        if (this.socket) { this.socket.destroy(); this.socket = null; }
    }

    onClose() {
        this.isAlive     = false;
        this.isConnected = false;
        this.client.connectedBots = Math.max(0, (this.client.connectedBots || 1) - 1);
        clearInterval(this.moveInterval);
        this.moveInterval = null;
        logger.info(`Bot disconnected from ${this.client.host}:${this.client.port}`);
    }

    onError(err) {
        logger.error(`Bot error on ${this.client.host}:${this.client.port} — ${err.message}`);
    }
}
