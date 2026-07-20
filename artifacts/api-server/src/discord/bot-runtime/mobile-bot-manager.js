// ── Mobile Bot Manager ────────────────────────────────────────────────────
// Manages TCP bot sessions for Agario Mobile servers (port 9000).

import { MobileBotUnit } from "./mobile-bot-unit.js";
import { logger }        from "./runtime-logger.js";

const PROTOCOL_VERSION = 23;
const CLIENT_VERSION   = 31128;
const MOBILE_PORT      = 9000;

// ── MobileRuntimeManager ─────────────────────────────────────────────────
// The "client" object shared by all MobileBotUnit instances in a session.

class MobileRuntimeManager {
    constructor({ host, port, botName, botCount, ownerAccountId, partyCode }) {
        // Connection
        this.host            = host;
        this.port            = port;
        this.protocolVersion = PROTOCOL_VERSION;
        this.clientVersion   = CLIENT_VERSION;

        // Identity
        this.botName         = botName;
        this.botCount        = botCount;
        // Party code to join after spawn (null = public game)
        this.partyCode       = partyCode ?? null;

        // Owner tracking — set when a bot spots the owner's cell
        this.ownerX          = NaN;
        this.ownerY          = NaN;
        this.ownerRadius     = 0;
        // Numeric accountId derived from the UID string (the uint32 in game packets)
        // We store the full UID here; the bot tries to match by accountId if we compute it
        this.ownerUid        = null;
        this.ownerAccountId  = ownerAccountId ?? null;

        // Stats
        this.connectedBots   = 0;

        // Internal
        this._orbitSlot      = 0;
        this._bots           = [];
    }

    allocateBotName()    { return this.botName; }
    allocateOrbitSlot()  { return this._orbitSlot++; }
    isPlayerName(_name)  { return false; }
    isKnownBotName(name) { return name === this.botName; }

    getBotConnectionOptions() {
        return { agent: undefined, proxyUrl: null, connectTimeoutMs: 0 };
    }

    spawnBots() {
        for (let i = 0; i < this.botCount; i++) {
            // Stagger spawns by 300 ms each to avoid overwhelming the server
            setTimeout(() => {
                if (!this._stopped) this._bots.push(new MobileBotUnit(this));
            }, i * 300);
        }
        logger.info(`Spawning ${this.botCount} mobile bot(s) → ${this.host}:${this.port}`);
    }

    stopAllBots() {
        this._stopped = true;
        for (const bot of this._bots) {
            try { bot.stop(); } catch (_) {}
        }
        this._bots = [];
        logger.info("All mobile bots stopped.");
    }

    setOwnerPosition(x, y, radius = 0) {
        this.ownerX      = x;
        this.ownerY      = y;
        this.ownerRadius = radius;
    }
}

// ── Helpers ───────────────────────────────────────────────────────────────

/**
 * Extract the mobile hostname from a region value.
 * Input:  "eu-west-3.mobile-live-v26.agario.miniclippt.com"
 * Output: "eu-west-3.mobile-live-v26.agario.miniclippt.com"  (already a hostname)
 */
export function buildMobileHost(regionHostname) {
    // The region values already ARE the full mobile hostname
    return regionHostname.trim();
}

/**
 * Try to derive the numeric accountId from a UUID string.
 * Agario embeds a uint32 accountId in node packets — it's the first 4 bytes
 * of the UUID (as big-endian uint32 from the hex string, no dashes).
 */
export function uidToAccountId(uid) {
    if (!uid) return null;
    const hex = uid.replace(/-/g, "").slice(0, 8);
    const val = parseInt(hex, 16);
    return Number.isNaN(val) ? null : val >>> 0;
}

// ── Session store ─────────────────────────────────────────────────────────

const sessions = new Map();

/**
 * Start a mobile bot session.
 *
 * @param {string} userId
 * @param {string} host         e.g. "eu-west-3.mobile-live-v26.agario.miniclippt.com"
 * @param {number} port         default 9000
 * @param {string} botName      name shown in-game
 * @param {number} botCount     number of bots
 * @param {string|null} uid     owner's UID string
 * @param {string|null} partyCode  party room code (null = join public game)
 */
export function startSession(userId, host, port, botName, botCount, uid, partyCode = null) {
    stopSession(userId);

    const ownerAccountId = uidToAccountId(uid);
    const manager = new MobileRuntimeManager({ host, port, botName, botCount, ownerAccountId, partyCode });
    manager.spawnBots();
    sessions.set(userId, manager);
    logger.info(`Session started for ${userId} → ${host}:${port} (${botCount} bots${partyCode ? `, party="${partyCode}"` : ""})`);
    return manager;
}

/**
 * Stop a mobile bot session.
 */
export function stopSession(userId) {
    const manager = sessions.get(userId);
    if (!manager) return false;
    manager.stopAllBots();
    sessions.delete(userId);
    return true;
}

export function activeSessionCount() {
    return sessions.size;
}
