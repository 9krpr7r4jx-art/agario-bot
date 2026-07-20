// ── Web Bot Manager ───────────────────────────────────────────────────────
// Manages WebSocket bot sessions for Agario (wss://live-arena-*.agar.io).

import { WebBotUnit } from "./web-bot-unit.js";
import { logger }     from "./runtime-logger.js";

// ── Version cache (fetched once from agar.io, reused for all bots) ────────

let _versionCache = null;

/**
 * Fetch protocol version + version int from agar.io JS files.
 * Returns cached result after first successful fetch.
 * Falls back to known-good values if the network request fails.
 */
async function getAgarVersion() {
    if (_versionCache) return _versionCache;

    try {
        const [mainRes, coreRes] = await Promise.all([
            fetch("https://agar.io/mc/agario.js"),
            fetch("https://agar.io/agario.core.js"),
        ]);

        const mainText = await mainRes.text();
        const coreText = await coreRes.text();

        const versionMatch = mainText.match(/var\sversionString="(\d+\.\d+\.\d+)";/);
        const protoMatch   = coreText.match(/\w\[\w\+\d+>>\d\]=\w;\w+\(\w,(\d+)\);/);

        if (!versionMatch || !protoMatch) throw new Error("regex match failed");

        const versionString  = versionMatch[1];
        const protocolVersion = parseInt(protoMatch[1], 10);
        const parts          = versionString.split(".");
        const versionInt     = parseInt(parts[0]) * 10000 + parseInt(parts[1]) * 100 + parseInt(parts[2]);

        _versionCache = { versionString, versionInt, protocolVersion };
        logger.info(`Agar version fetched: ${versionString} (int=${versionInt}, proto=${protocolVersion})`);
        return _versionCache;

    } catch (err) {
        logger.warn(`Failed to fetch agar.io version (${err.message}) — using fallback`);
        // Fallback values — update if bots stop connecting
        _versionCache = { versionString: "2.5.2", versionInt: 20502, protocolVersion: 23 };
        return _versionCache;
    }
}

// ── Runtime manager ───────────────────────────────────────────────────────

class WebRuntimeManager {
    constructor({ serverUrl, host, botName, botCount, ownerName, versionInt, protocolVersion }) {
        this.serverUrl       = serverUrl;
        this.host            = host;
        this.botName         = botName;
        this.botCount        = botCount;
        this.versionInt      = versionInt;
        this.protocolVersion = protocolVersion;

        // Owner tracking — bots follow the player whose in-game name matches ownerName
        this.ownerName = ownerName ?? null;
        this.ownerX    = NaN;
        this.ownerY    = NaN;

        this.connectedBots = 0;
        this._bots         = [];
        this._stopped      = false;
    }

    allocateBotName() { return this.botName; }

    spawnBots() {
        for (let i = 0; i < this.botCount; i++) {
            setTimeout(() => {
                if (!this._stopped) this._bots.push(new WebBotUnit(this));
            }, i * 300);
        }
        logger.info(`Spawning ${this.botCount} web bot(s) → ${this.serverUrl}`);
    }

    stopAllBots() {
        this._stopped = true;
        for (const bot of this._bots) {
            try { bot.stop(); } catch (_) {}
        }
        this._bots = [];
        logger.info("All web bots stopped.");
    }
}

// ── Session store ─────────────────────────────────────────────────────────

const sessions = new Map();

/**
 * Start a WebSocket bot session.
 *
 * @param {string} userId      Discord user ID
 * @param {string} serverUrl   Full WSS URL, e.g. "wss://live-arena-oey3gj.agar.io:443"
 * @param {string} botName     In-game name for all bots
 * @param {number} botCount    Number of bots to spawn
 * @param {string|null} ownerName  In-game name of the player to follow
 */
export async function startSession(userId, serverUrl, botName, botCount, ownerName = null) {
    stopSession(userId);

    const { versionInt, protocolVersion } = await getAgarVersion();

    // Extract hostname from the WSS URL (e.g. "live-arena-oey3gj.agar.io")
    let host = serverUrl;
    try {
        host = new URL(serverUrl).hostname;
    } catch (_) {
        host = serverUrl.replace(/^wss?:\/\//, "").split(":")[0].split("/")[0];
    }

    const manager = new WebRuntimeManager({
        serverUrl, host, botName, botCount, ownerName, versionInt, protocolVersion,
    });
    manager.spawnBots();
    sessions.set(userId, manager);
    logger.info(
        `Session started for ${userId} → ${serverUrl} ` +
        `(${botCount} bots, owner="${ownerName}", ver=${versionInt}, proto=${protocolVersion})`
    );
    return manager;
}

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
