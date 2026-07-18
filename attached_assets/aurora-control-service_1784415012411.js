import { WebSocket, WebSocketServer } from "ws";
import {
    BRIDGE_AUTH_TIMEOUT_MS,
    buildBridgeAuthErrorPayload,
    buildBridgeAuthOkPayload,
    isValidBridgeAuthPayload,
    normalizeAuthPayload,
} from "./runtime-auth.js";
import { proxyManager } from "./runtime-proxy.js";

const STATUS_BROADCAST_INTERVAL_MS = 25;
const EXPECTED_SCRIPT_KEY = "key2";
const EXPECTED_SCRIPT_VERSION = 3;
const BURST_BOTS_PER_WAVE = 14;
const BURST_WAVE_COUNT = 3;
const BURST_WAVE_DELAY_MS = 3022;
const SPAWN_DISCONNECT_DELAY_MS = 2;
const MAX_BOTS = BURST_BOTS_PER_WAVE * BURST_WAVE_COUNT;
const AGAR_MURMUR_MULTIPLIER = 0x5bd1e995;
const AGAR_MURMUR_SHIFT = 24;
const AGAR_KEY_MULTIPLIER = 1540483477;
const AGAR_KEY_XOR = 114296087;
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder("utf-8");

function toJson(raw) {
    if (typeof raw === "string") {
        return raw;
    }
    if (raw instanceof Buffer) {
        return raw.toString("utf8");
    }
    if (raw instanceof ArrayBuffer) {
        return Buffer.from(raw).toString("utf8");
    }
    if (ArrayBuffer.isView(raw)) {
        return Buffer.from(raw.buffer, raw.byteOffset, raw.byteLength).toString("utf8");
    }
    return "";
}

function toUint8Array(raw) {
    if (raw instanceof Uint8Array) {
        return raw;
    }
    if (raw instanceof Buffer) {
        return new Uint8Array(raw.buffer, raw.byteOffset, raw.byteLength);
    }
    if (raw instanceof ArrayBuffer) {
        return new Uint8Array(raw);
    }
    if (ArrayBuffer.isView(raw)) {
        return new Uint8Array(raw.buffer, raw.byteOffset, raw.byteLength);
    }
    return new Uint8Array(0);
}

function createUint32Packet(opcode, value) {
    const buffer = new ArrayBuffer(5);
    const view = new DataView(buffer);
    view.setUint8(0, opcode);
    view.setUint32(1, value >>> 0, true);
    return new Uint8Array(buffer);
}

function createSpawnPacket(name) {
    const encodedName = textEncoder.encode(String(name || ""));
    const packet = new Uint8Array(encodedName.length + 2);
    packet[0] = 0x00;
    packet.set(encodedName, 1);
    packet[packet.length - 1] = 0x00;
    return packet;
}

function rotateBufferBytes(raw, key) {
    const source = toUint8Array(raw);
    const payload = new Uint8Array(source.length);
    payload.set(source);
    const xorKey = key >>> 0;
    for (let index = 0; index < payload.length; index += 1) {
        payload[index] ^= (xorKey >>> ((index % 4) * 8)) & 0xff;
    }
    return payload;
}

function rotateEncryptionKey(key) {
    let nextKey = Math.imul(key | 0, AGAR_KEY_MULTIPLIER);
    nextKey = (Math.imul(((nextKey >>> 24) ^ nextKey) | 0, AGAR_KEY_MULTIPLIER) ^ AGAR_KEY_XOR) | 0;
    nextKey = Math.imul(((nextKey >>> 13) ^ nextKey) | 0, AGAR_KEY_MULTIPLIER);
    return (((nextKey >>> 15) ^ nextKey) >>> 0);
}

function murmur2(source, seed = 0) {
    const bytes = textEncoder.encode(String(source || ""));
    let length = bytes.length;
    let offset = 0;
    let hash = (seed ^ length) >>> 0;

    while (length >= 4) {
        let block =
            (bytes[offset] & 0xff) |
            ((bytes[offset + 1] & 0xff) << 8) |
            ((bytes[offset + 2] & 0xff) << 16) |
            ((bytes[offset + 3] & 0xff) << 24);
        block = Math.imul(block, AGAR_MURMUR_MULTIPLIER) >>> 0;
        block ^= block >>> AGAR_MURMUR_SHIFT;
        block = Math.imul(block, AGAR_MURMUR_MULTIPLIER) >>> 0;
        hash = Math.imul(hash, AGAR_MURMUR_MULTIPLIER) >>> 0;
        hash ^= block;
        offset += 4;
        length -= 4;
    }

    switch (length) {
        case 3:
            hash ^= (bytes[offset + 2] & 0xff) << 16;
        case 2:
            hash ^= (bytes[offset + 1] & 0xff) << 8;
        case 1:
            hash ^= bytes[offset] & 0xff;
            hash = Math.imul(hash, AGAR_MURMUR_MULTIPLIER) >>> 0;
            break;
        default:
            break;
    }

    hash ^= hash >>> 13;
    hash = Math.imul(hash, AGAR_MURMUR_MULTIPLIER) >>> 0;
    hash ^= hash >>> 15;
    return hash >>> 0;
}

class BufferReader {
    constructor(raw, littleEndian = true) {
        const bytes = toUint8Array(raw);
        this.bytes = new Uint8Array(bytes.length);
        this.bytes.set(bytes);
        this.view = new DataView(this.bytes.buffer);
        this.offset = 0;
        this.littleEndian = littleEndian;
    }

    readUint8() {
        const value = this.view.getUint8(this.offset);
        this.offset += 1;
        return value;
    }

    readUint32() {
        const value = this.view.getUint32(this.offset, this.littleEndian);
        this.offset += 4;
        return value >>> 0;
    }

    readString() {
        const start = this.offset;
        while (this.offset < this.bytes.length && this.bytes[this.offset] !== 0) {
            this.offset += 1;
        }
        const value = textDecoder.decode(this.bytes.subarray(start, this.offset));
        if (this.offset < this.bytes.length && this.bytes[this.offset] === 0) {
            this.offset += 1;
        }
        return value;
    }
}

function buildHandshakeSeed(serverUrl) {
    const { hostname, pathname } = new URL(serverUrl);
    return hostname + pathname.replace(/\/$/g, "");
}

function isValidArenaTargetConfig(config) {
    if (!config || typeof config !== "object") {
        return false;
    }
    if (typeof config.ip !== "string" || !/^wss?:\/\//i.test(config.ip)) {
        return false;
    }
    return Number.isFinite(config.protocolVersion) &&
        config.protocolVersion > 0 &&
        Number.isFinite(config.clientVersion) &&
        config.clientVersion > 0;
}

function isValidStopAfterMs(value) {
    return Number.isFinite(value) && value > 0;
}

function normalizeArenaTargets(message) {
    if (message?.type === "startMulti" || message?.type === "startSequence") {
        const targets = Array.isArray(message.config?.targets)
            ? message.config.targets.filter(isValidArenaTargetConfig)
            : [];
        return targets.map((target) => ({
            ip: target.ip,
            protocolVersion: target.protocolVersion,
            clientVersion: target.clientVersion,
        }));
    }

    if (message?.type === "start" && isValidArenaTargetConfig(message.config)) {
        return [{
            ip: message.config.ip,
            protocolVersion: message.config.protocolVersion,
            clientVersion: message.config.clientVersion,
        }];
    }

    return [];
}

class AuroraBotConnection {
    constructor(service, targetConfig) {
        this.service = service;
        this.playerName = service.sharedState.partyName;
        this.serverUrl = targetConfig.ip;
        this.protocolVersion = targetConfig.protocolVersion;
        this.clientVersion = targetConfig.clientVersion;
        this.handshakeSeed = buildHandshakeSeed(this.serverUrl);
        this.encryptionKey = 0;
        this.decryptionKey = 0;
        this.isAlive = false;
        this.isDisposed = false;
        this.hasSpawned = false;
        this.shouldReconnect = true;
        this.spawnDisconnectTimeout = null;
        this.connectTimeout = null;
        this.socket = null;
        this.connect();
    }

    connect() {
        const socketOptions = this.service.getBotConnectionOptions();
        this.socket = new WebSocket(this.serverUrl, {
            agent: socketOptions.agent,
            headers: this.service.gameHeaders,
        });
        this.socket.binaryType = "arraybuffer";
        this.socket.onopen = this.handleOpen.bind(this);
        this.socket.onmessage = this.handleMessage.bind(this);
        this.socket.onclose = this.handleClose.bind(this);
        this.socket.onerror = this.handleError.bind(this);
        if (socketOptions.proxyUrl && Number(socketOptions.connectTimeoutMs) > 0) {
            this.connectTimeout = setTimeout(() => {
                if (
                    this.socket?.readyState === WebSocket.CONNECTING ||
                    this.socket?.readyState === WebSocket.OPEN
                ) {
                    this.socket.terminate();
                }
            }, Number(socketOptions.connectTimeoutMs));
            if (typeof this.connectTimeout?.unref === "function") {
                this.connectTimeout.unref();
            }
        }
    }

    handleOpen() {
        this.clearConnectTimeout();
        this.send(createUint32Packet(0xfe, this.protocolVersion));
        this.send(createUint32Packet(0xff, this.clientVersion));
    }

    handleMessage(packet) {
        try {
            if (this.decryptionKey) {
                const reader = new BufferReader(
                    rotateBufferBytes(packet.data, this.decryptionKey ^ this.clientVersion),
                    true,
                );
                if (reader.readUint8() === 0xf2 && !this.hasSpawned) {
                    this.hasSpawned = true;
                    this.send(createSpawnPacket(this.playerName));
                    this.isAlive = true;
                    this.scheduleSpawnDisconnect();
                }
                return;
            }

            const reader = new BufferReader(packet.data, true);
            if (reader.readUint8() === 0xf1) {
                this.decryptionKey = reader.readUint32();
                this.encryptionKey = murmur2(this.handshakeSeed + reader.readString(), 0xff);
            }
        } catch (_error) {
            if (this.socket) {
                this.socket.close();
                return;
            }
            this.reconnect();
        }
    }

    reconnect() {
        if (this.isDisposed || !this.shouldReconnect) {
            return;
        }
        this.clearConnectTimeout();
        this.clearSpawnDisconnectTimeout();
        this.encryptionKey = 0;
        this.decryptionKey = 0;
        this.isAlive = false;
        this.socket = null;
        setTimeout(() => {
            if (!this.isDisposed) {
                this.connect();
            }
        }, 250);
    }

    send(payload) {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
            return;
        }
        let message = payload;
        if (this.encryptionKey) {
            message = rotateBufferBytes(payload.buffer, this.encryptionKey);
            this.encryptionKey = rotateEncryptionKey(this.encryptionKey);
        }
        this.socket.send(message);
    }

    clearSpawnDisconnectTimeout() {
        if (this.spawnDisconnectTimeout) {
            clearTimeout(this.spawnDisconnectTimeout);
            this.spawnDisconnectTimeout = null;
        }
    }

    clearConnectTimeout() {
        if (this.connectTimeout) {
            clearTimeout(this.connectTimeout);
            this.connectTimeout = null;
        }
    }

    scheduleSpawnDisconnect() {
        if (this.spawnDisconnectTimeout || !this.socket) {
            return;
        }
        const activeSocket = this.socket;
        this.spawnDisconnectTimeout = setTimeout(() => {
            this.spawnDisconnectTimeout = null;
            this.shouldReconnect = false;
            if (activeSocket.readyState === WebSocket.OPEN || activeSocket.readyState === WebSocket.CONNECTING) {
                activeSocket.close();
            }
        }, SPAWN_DISCONNECT_DELAY_MS);
    }

    handleClose() {
        this.isAlive = false;
        this.clearConnectTimeout();
        this.clearSpawnDisconnectTimeout();
        this.socket = null;
        if (!this.isDisposed && this.shouldReconnect) {
            this.reconnect();
            return;
        }
        this.service.removeBotConnection(this);
    }

    handleError() {
        this.clearConnectTimeout();
        if (this.socket) {
            this.socket.close();
        }
    }

    close() {
        this.isDisposed = true;
        this.shouldReconnect = false;
        this.isAlive = false;
        this.clearConnectTimeout();
        this.clearSpawnDisconnectTimeout();
        if (this.socket) {
            try {
                this.socket.close();
            } catch (_error) { }
        }
        this.socket = null;
    }
}

export class AuroraControlService {
    constructor({ runtimeRoot, host = "127.0.0.1", port = 19281, logger = console } = {}) {
        this.runtimeRoot = runtimeRoot;
        this.host = host;
        this.port = port;
        this.logger = logger;
        this.clients = new Set();
        this.clientAuth = new WeakMap();
        this.clientAuthTimeouts = new WeakMap();
        this.server = null;
        this.controllerClient = null;
        this.bots = [];
        this.statusInterval = null;
        this.spawnTimeouts = [];
        this.burstLoopTimers = [];
        this.sessionStopTimer = null;
        this.sequenceStepTimer = null;
        this.activeSequenceSession = null;
        this.activeMaxBots = 0;
        this.running = false;
        this.proxySession = proxyManager.beginSession(false);
        this.sharedState = {
            x: 0,
            y: 0,
            serverUrl: null,
            protocolVersion: 0,
            clientVersion: 0,
            followMouse: true,
            partyName: "Noobless",
        };
        this.gameHeaders = {
            "Accept-Encoding": "gzip, deflate, br",
            Pragma: "no-cache",
            Origin: "https://agar.io",
            "Accept-Language": "en-US,en;q=0.9",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            Upgrade: "websocket",
            "Cache-Control": "no-cache",
            Connection: "Upgrade",
            "Sec-WebSocket-Version": "13",
        };
    }

    prepareProxySession(useProxy = false) {
        this.proxySession = proxyManager.beginSession(!!useProxy);
        this.logger.info?.(proxyManager.describeSession(this.proxySession));
        return this.proxySession;
    }

    getBotConnectionOptions() {
        const agent = this.proxySession?.enabled ? this.proxySession?.agent || undefined : undefined;
        return {
            agent,
            proxyUrl: agent ? this.proxySession?.proxyUrl || null : null,
            connectTimeoutMs: proxyManager.connectTimeoutMs,
        };
    }

    async listen() {
        if (this.server) {
            return;
        }

        const server = new WebSocketServer({ host: this.host, port: this.port });
        await new Promise((resolve, reject) => {
            const handleListening = () => {
                server.off("error", handleError);
                resolve();
            };
            const handleError = (error) => {
                server.off("listening", handleListening);
                reject(error);
            };
            server.once("listening", handleListening);
            server.once("error", handleError);
        });

        this.server = server;
        this.server.on("connection", (socket, request) => this.handleConnection(socket, request));
        this.server.on("error", (error) => {
            this.logger.warn?.(`Aurora bridge error: ${error?.message || error}`);
        });
        this.logger.info?.(`Aurora bridge ready on ws://${this.host}:${this.port}.`);
    }

    clearStatusInterval() {
        if (this.statusInterval) {
            clearInterval(this.statusInterval);
            this.statusInterval = null;
        }
    }

    clearSpawnTimeouts() {
        this.spawnTimeouts.forEach((handle) => clearTimeout(handle));
        this.spawnTimeouts = [];
    }

    clearBurstLoopTimers() {
        this.burstLoopTimers.forEach((handle) => clearInterval(handle));
        this.burstLoopTimers = [];
    }

    clearSessionStopTimer() {
        if (this.sessionStopTimer) {
            clearTimeout(this.sessionStopTimer);
            this.sessionStopTimer = null;
        }
    }

    clearSequenceStepTimer() {
        if (this.sequenceStepTimer) {
            clearTimeout(this.sequenceStepTimer);
            this.sequenceStepTimer = null;
        }
    }

    clearSequenceSession() {
        this.clearSequenceStepTimer();
        this.activeSequenceSession = null;
    }

    removeBotConnection(targetBot) {
        this.bots = this.bots.filter((bot) => bot !== targetBot);
    }

    spawnBotWave(targetConfig, startIndex, botCount) {
        const lastBotIndex = Math.min(startIndex + botCount - 1, MAX_BOTS);
        for (let botIndex = startIndex; botIndex <= lastBotIndex; botIndex += 1) {
            this.bots.push(new AuroraBotConnection(this, targetConfig));
        }
    }

    scheduleBotBurstCycle(targetConfig) {
        for (let waveIndex = 0; waveIndex < BURST_WAVE_COUNT; waveIndex += 1) {
            const timeoutHandle = setTimeout(() => {
                this.spawnTimeouts = this.spawnTimeouts.filter((handle) => handle !== timeoutHandle);
                const startIndex = (waveIndex * BURST_BOTS_PER_WAVE) + 1;
                const remainingBots = MAX_BOTS - startIndex + 1;
                if (remainingBots <= 0) {
                    return;
                }
                this.spawnBotWave(targetConfig, startIndex, Math.min(BURST_BOTS_PER_WAVE, remainingBots));
            }, waveIndex * BURST_WAVE_DELAY_MS);
            this.spawnTimeouts.push(timeoutHandle);
        }
    }

    startBurstLoopForTarget(targetConfig) {
        this.scheduleBotBurstCycle(targetConfig);
        const timerHandle = setInterval(() => {
            this.scheduleBotBurstCycle(targetConfig);
        }, Math.max(1, BURST_WAVE_DELAY_MS * BURST_WAVE_COUNT));
        this.burstLoopTimers.push(timerHandle);
    }

    startBurstLoops(targetConfigs) {
        this.clearSpawnTimeouts();
        this.clearBurstLoopTimers();
        targetConfigs.forEach((targetConfig) => {
            this.startBurstLoopForTarget(targetConfig);
        });
    }

    disconnectBots(botList, callback) {
        botList.forEach((bot) => {
            bot.close();
        });
        if (callback) {
            callback();
        }
    }

    resetBots(callback) {
        this.clearStatusInterval();
        this.clearSpawnTimeouts();
        this.clearBurstLoopTimers();
        this.clearSessionStopTimer();
        this.activeMaxBots = 0;

        if (this.bots.length === 0) {
            if (callback) {
                callback();
            }
            return;
        }

        this.disconnectBots(this.bots, () => {
            this.bots = [];
            if (callback) {
                callback();
            }
        });
    }

    configurePrimarySharedState(targetConfig) {
        this.sharedState.clientVersion = targetConfig.clientVersion;
        this.sharedState.protocolVersion = targetConfig.protocolVersion;
        this.sharedState.serverUrl = targetConfig.ip;
    }

    scheduleSessionStop(socket, stopAfterMs) {
        this.clearSessionStopTimer();
        if (!isValidStopAfterMs(stopAfterMs)) {
            return;
        }
        this.sessionStopTimer = setTimeout(() => {
            this.sessionStopTimer = null;
            this.resetBots(() => {
                this.running = false;
                this.proxySession = proxyManager.beginSession(false);
                this.sendJson(socket, { type: "stopped" });
            });
        }, stopAfterMs);
    }

    startArenaSession(socket, targetConfigs, options = {}) {
        const primaryTarget = targetConfigs[0];
        const stopAfterMs = isValidStopAfterMs(options.stopAfterMs) ? options.stopAfterMs : 0;
        this.prepareProxySession(options.useProxy);
        this.configurePrimarySharedState(primaryTarget);
        this.activeMaxBots = MAX_BOTS * targetConfigs.length;
        this.running = true;
        this.startBurstLoops(targetConfigs);
        this.startStatusLoop();
        this.sendBotCount(socket);
        this.sendJson(socket, {
            type: "started",
            mode: stopAfterMs ? "multi" : "single",
            targetCount: targetConfigs.length,
        });
        if (stopAfterMs) {
            this.scheduleSessionStop(socket, stopAfterMs);
        }
    }

    finishSequenceSession() {
        if (!this.activeSequenceSession) {
            return;
        }
        const sessionSocket = this.activeSequenceSession.socket;
        this.clearSequenceSession();
        this.resetBots(() => {
            this.running = false;
            this.proxySession = proxyManager.beginSession(false);
            this.sendJson(sessionSocket, { type: "stopped" });
        });
    }

    runNextSequenceTarget() {
        if (!this.activeSequenceSession) {
            return;
        }
        if (this.activeSequenceSession.index >= this.activeSequenceSession.targets.length) {
            this.finishSequenceSession();
            return;
        }

        const targetConfig = this.activeSequenceSession.targets[this.activeSequenceSession.index];
        this.activeSequenceSession.index += 1;
        this.configurePrimarySharedState(targetConfig);
        this.activeMaxBots = MAX_BOTS;
        this.running = true;
        this.startBurstLoops([targetConfig]);
        this.startStatusLoop();
        this.sendBotCount(this.activeSequenceSession.socket);
        this.clearSequenceStepTimer();
        this.sequenceStepTimer = setTimeout(() => {
            this.sequenceStepTimer = null;
            if (!this.activeSequenceSession) {
                return;
            }
            this.resetBots(() => {
                if (!this.activeSequenceSession) {
                    return;
                }
                this.runNextSequenceTarget();
            });
        }, this.activeSequenceSession.perTargetMs);
    }

    startSequentialArenaSession(socket, targetConfigs, options = {}) {
        const perTargetMs = isValidStopAfterMs(options.perTargetMs) ? Math.round(options.perTargetMs) : 3000;
        this.prepareProxySession(options.useProxy);
        this.clearSequenceSession();
        this.activeSequenceSession = {
            socket,
            targets: targetConfigs,
            perTargetMs,
            index: 0,
        };
        this.activeMaxBots = MAX_BOTS;
        this.running = true;
        this.sendJson(socket, {
            type: "started",
            mode: "sequence",
            targetCount: targetConfigs.length,
        });
        this.runNextSequenceTarget();
    }

    getConnectedCount() {
        return this.bots.filter((bot) => bot.socket && bot.socket.readyState === WebSocket.OPEN).length;
    }

    getAliveCount() {
        return this.bots.filter((bot) => bot.socket && bot.socket.readyState === WebSocket.OPEN && bot.isAlive).length;
    }

    startStatusLoop() {
        this.clearStatusInterval();
        this.statusInterval = setInterval(() => {
            if (!this.controllerClient || this.controllerClient.readyState !== WebSocket.OPEN) {
                return;
            }
            this.sendBotCount(this.controllerClient);
        }, STATUS_BROADCAST_INTERVAL_MS);
    }

    clearSocketAuthTimeout(socket) {
        const handle = this.clientAuthTimeouts.get(socket);
        if (!handle) {
            return;
        }
        clearTimeout(handle);
        this.clientAuthTimeouts.delete(socket);
    }

    rejectSocketAuth(socket, message = "Aurora bridge auth failed.") {
        this.clearSocketAuthTimeout(socket);
        try {
            socket.send(buildBridgeAuthErrorPayload(message));
        } catch (_error) { }
        try {
            socket.close();
        } catch (_error) { }
    }

    authenticateSocket(socket, request) {
        if (!socket || this.clientAuth.get(socket) === true) {
            return;
        }
        if (this.controllerClient && this.controllerClient !== socket) {
            this.sendJson(socket, { type: "error", message: "Only one user is allowed to connect at a time." });
            try {
                socket.close();
            } catch (_error) { }
            return;
        }
        this.clientAuth.set(socket, true);
        this.clearSocketAuthTimeout(socket);
        this.clients.add(socket);
        this.controllerClient = socket;
        this.logger.info?.(`Aurora panel authenticated from ${request?.socket?.remoteAddress || "unknown"}.`);
        this.sendJson(socket, JSON.parse(buildBridgeAuthOkPayload("aurora")));
        this.pushSocketState(socket);
    }

    handlePendingSocketAuth(socket, rawMessage, request) {
        const payload = normalizeAuthPayload(rawMessage);
        if (!isValidBridgeAuthPayload(payload, "aurora")) {
            this.rejectSocketAuth(socket, "Aurora bridge auth failed.");
            return false;
        }
        this.authenticateSocket(socket, request);
        return true;
    }

    handleConnection(socket, request) {
        this.clientAuth.set(socket, false);
        this.clientAuthTimeouts.set(
            socket,
            setTimeout(() => {
                this.rejectSocketAuth(socket, "Aurora bridge auth timeout.");
            }, BRIDGE_AUTH_TIMEOUT_MS),
        );
        this.logger.info?.(`Aurora panel pending auth from ${request?.socket?.remoteAddress || "unknown"}.`);
        socket.on("message", (raw) => {
            if (this.clientAuth.get(socket) !== true) {
                this.handlePendingSocketAuth(socket, raw, request);
                return;
            }
            this.handleSocketMessage(socket, raw);
        });
        const handleClose = () => {
            this.clearSocketAuthTimeout(socket);
            this.clientAuth.delete(socket);
            this.clients.delete(socket);
            if (this.controllerClient === socket) {
                this.controllerClient = null;
            }
            this.clearSequenceSession();
            this.stopSession(false);
        };
        socket.on("close", handleClose);
        socket.on("error", handleClose);
    }

    sendJson(socket, payload) {
        if (!socket || socket.readyState !== WebSocket.OPEN) {
            return false;
        }
        socket.send(JSON.stringify(payload));
        return true;
    }

    pushSocketState(socket) {
        this.sendJson(socket, this.running ? { type: "started" } : { type: "stopped" });
        this.sendBotCount(socket);
    }

    sendBotCount(socket = this.controllerClient) {
        this.sendJson(socket, {
            type: "botCount",
            connected: this.getConnectedCount(),
            alive: this.getAliveCount(),
            maxBots: this.activeMaxBots || MAX_BOTS,
        });
    }

    stopSession(notify = true, socket = this.controllerClient) {
        this.clearSequenceSession();
        this.resetBots(() => {
            this.running = false;
            this.proxySession = proxyManager.beginSession(false);
            if (notify) {
                this.sendJson(socket, { type: "stopped" });
                this.sendBotCount(socket);
            }
        });
    }

    handleSocketMessage(socket, rawMessage) {
        let message = null;
        try {
            message = JSON.parse(toJson(rawMessage));
        } catch (_error) {
            this.sendJson(socket, { type: "error", message: "Invalid JSON payload." });
            return;
        }

        switch (message?.type) {
            case "start":
            case "startMulti": {
                if (
                    !message.config ||
                    message.config.scriptKey !== EXPECTED_SCRIPT_KEY ||
                    message.config.scriptVersion !== EXPECTED_SCRIPT_VERSION
                ) {
                    this.sendJson(socket, { type: "error", message: "Invalid script key or script version." });
                    return;
                }
                const targetConfigs = normalizeArenaTargets(message);
                if (!targetConfigs.length) {
                    this.sendJson(socket, { type: "error", message: "Invalid start configuration." });
                    return;
                }
                this.clearSequenceSession();
                this.resetBots(() => {
                    this.startArenaSession(socket, targetConfigs, {
                        stopAfterMs: message.type === "startMulti" ? Number(message.config.stopAfterMs) || 0 : 0,
                        useProxy: !!message.config.useProxy,
                    });
                });
                return;
            }
            case "startSequence": {
                if (
                    !message.config ||
                    message.config.scriptKey !== EXPECTED_SCRIPT_KEY ||
                    message.config.scriptVersion !== EXPECTED_SCRIPT_VERSION
                ) {
                    this.sendJson(socket, { type: "error", message: "Invalid script key or script version." });
                    return;
                }
                const targetConfigs = normalizeArenaTargets(message);
                if (!targetConfigs.length) {
                    this.sendJson(socket, { type: "error", message: "Invalid sequence configuration." });
                    return;
                }
                this.clearSequenceSession();
                this.resetBots(() => {
                    this.startSequentialArenaSession(socket, targetConfigs, {
                        perTargetMs: Number(message.config.perTargetMs) || 3000,
                        useProxy: !!message.config.useProxy,
                    });
                });
                return;
            }
            case "stop":
                this.stopSession(true, socket);
                return;
            case "move":
                if (typeof message.x === "number") {
                    this.sharedState.x = message.x;
                }
                if (typeof message.y === "number") {
                    this.sharedState.y = message.y;
                }
                return;
            default:
                return;
        }
    }

    dispose() {
        this.stopSession(false);
        this.clearStatusInterval();
        this.clearSpawnTimeouts();
        this.clearBurstLoopTimers();
        this.clearSessionStopTimer();
        this.clearSequenceSession();
        for (const socket of this.clients) {
            try {
                socket.close();
            } catch (_error) { }
        }
        this.clients.clear();
        this.controllerClient = null;
        if (this.server) {
            try {
                this.server.close();
            } catch (_error) { }
            this.server = null;
        }
    }
}
