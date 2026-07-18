// ── Agario Bot Manager ────────────────────────────────────────────────────
// Orchestrates BotUnit instances for a Discord tracker session.
// Each Discord user gets one RuntimeManager (= one "client" object) that
// multiple BotUnit instances share so they all follow the same owner target.

import { BotUnit } from "./bot-unit.js";
import { logger }  from "./runtime-logger.js";

// ── Constants ─────────────────────────────────────────────────────────────

const PROTOCOL_VERSION = 23;
const CLIENT_VERSION   = 31128;

// ── RuntimeManager ────────────────────────────────────────────────────────
// The "client" object that every BotUnit reads from.

class RuntimeManager {
    constructor({ server, botName, botCount }) {
        // Connection
        this.server          = server;
        this.protocolVersion = PROTOCOL_VERSION;
        this.clientVersion   = CLIENT_VERSION;

        // Identity
        this.botName = botName;
        this.botCount = botCount;

        // Behaviour flags (off by default → safe follow mode)
        this.botAi       = false;
        this.botLock     = false;
        this.botDeltaAi  = false;
        this.botOrbit    = true;   // orbit around owner
        this.botVShield  = false;

        // Mass thresholds
        this.followMassGoal  = 50;
        this.lockTargetMass  = 410;

        // Owner position (updated when bots spot the target in packets)
        this.ownerX      = NaN;
        this.ownerY      = NaN;
        this.ownerRadius = 0;

        // User cursor (not used in headless mode)
        this.userX = NaN;
        this.userY = NaN;

        // State
        this.isAlive      = false;
        this.rQuadrant    = 1;
        this.connectedBots = 0;
        this.startedBots  = false;
        this.stoppedBots  = false;

        // Internal
        this._orbitSlot   = 0;
        this._bots        = [];
    }

    // ── Methods called by BotUnit ──────────────────────────────────────────

    allocateOrbitSlot() {
        return this._orbitSlot++;
    }

    allocateBotName() {
        return this.botName;
    }

    isPlayerName(_name) {
        return false; // Headless — we don't know the owner's display name
    }

    isKnownBotName(name) {
        return name === this.botName;
    }

    getBotConnectionOptions() {
        return { agent: undefined, proxyUrl: null, connectTimeoutMs: 0 };
    }

    // ── Spawn / stop ───────────────────────────────────────────────────────

    spawnBots() {
        for (let i = 0; i < this.botCount; i++) {
            this._bots.push(new BotUnit(this));
        }
        logger.info(`Spawned ${this.botCount} bot(s) → ${this.server}`);
    }

    stopAllBots() {
        this.stoppedBots = true;
        for (const bot of this._bots) {
            try { bot.stop(); } catch (_) {}
        }
        this._bots = [];
        logger.info("All bots stopped.");
    }

    /** Update owner position from outside (e.g. when target cell is seen) */
    setOwnerPosition(x, y, radius = 0) {
        this.ownerX      = x;
        this.ownerY      = y;
        this.ownerRadius = radius;
        this.isAlive     = true;
    }
}

// ── Session store (userId → RuntimeManager) ───────────────────────────────

const sessions = new Map();

/**
 * Build the Agario WebSocket URL from a region hostname + game mode + party code.
 * Format derived from bot-unit.js source regex:
 *   wss://web-arenas-live-{region}.agario.miniclippt.com/{mode}/{partyCode}
 *
 * @param {string} regionHostname  e.g. "eu-west-3.mobile-live-v26.agario.miniclippt.com"
 * @param {string} gameMode        "Burst" | "Classic"
 * @param {string} partyCode       e.g. "CYWE9S" or "Public"
 * @returns {string}  Full wss:// URL
 */
export function buildServerUrl(regionHostname, gameMode, partyCode) {
    // Extract short region name: "eu-west-3.mobile-live-v26..." → "eu-west-3"
    const regionShort = regionHostname.split(".")[0];
    const mode        = gameMode.toLowerCase(); // "Burst" → "burst"
    const party       = partyCode && partyCode !== "Public" ? `/${partyCode}` : "";
    return `wss://web-arenas-live-${regionShort}.agario.miniclippt.com/${mode}${party}`;
}

/**
 * Start a bot session for a Discord user.
 *
 * @param {string}  userId
 * @param {string}  serverUrl  Full wss:// URL (from buildServerUrl or user-provided)
 * @param {string}  botName    Name shown on bots in-game
 * @param {number}  botCount   How many bots to spawn (default 10)
 */
export function startSession(userId, serverUrl, botName, botCount = 10) {
    // Stop any existing session first
    stopSession(userId);

    const manager = new RuntimeManager({ server: serverUrl, botName, botCount });
    manager.spawnBots();
    sessions.set(userId, manager);
    return manager;
}

/**
 * Stop a bot session for a Discord user.
 * @param {string} userId
 */
export function stopSession(userId) {
    const manager = sessions.get(userId);
    if (!manager) return false;
    manager.stopAllBots();
    sessions.delete(userId);
    return true;
}

/** How many active sessions exist right now */
export function activeSessionCount() {
    return sessions.size;
}
