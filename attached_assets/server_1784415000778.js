import fs from 'fs';
import path from 'path';
import { config } from './runtime/runtime-config.js';
import Client from './runtime/bridge-client.js';
import { RuntimeManager } from './runtime/runtime-manager.js';
import { AuroraControlService } from './runtime/aurora-control-service.js';
import { helper } from "./runtime/runtime-helpers.js";
import { logger } from "./runtime/runtime-logger.js";
import { proxyManager } from "./runtime/runtime-proxy.js";
import { printStartupBanner } from "./runtime/runtime-banner.js";
import {
    BRIDGE_AUTH_TIMEOUT_MS,
    buildBridgeAuthErrorPayload,
    buildBridgeAuthOkPayload,
    isValidBridgeAuthPayload,
    normalizeAuthPayload,
} from "./runtime/runtime-auth.js";
import { fileURLToPath } from 'url';
import { WebSocketServer } from 'ws';

const runtimeRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const runtimePidFile = path.join(runtimeRoot, 'runtime.pid');
const { host, port } = config.serverSettings;
const server = helper.createServer();
const wss = new WebSocketServer({ server });
const runtimeManager = new RuntimeManager();
const auroraControlService = new AuroraControlService({ runtimeRoot, logger });
const clients = new Map();
let nextClientId = 0;
let shuttingDown = false;
let portConflictHandled = false;
const ANSI_RESET = '\x1b[0m';
const ANSI_BOLD = '\x1b[1m';

function supportsAnsi() {
    return !!process.stdout.isTTY && !process.env.NO_COLOR;
}

function colorizePrefix(text, rgb) {
    if (!supportsAnsi()) {
        return text;
    }
    return `${ANSI_BOLD}\x1b[38;2;${rgb[0]};${rgb[1]};${rgb[2]}m${text}${ANSI_RESET}`;
}

function writeRuntimePidFile() {
    try {
        fs.writeFileSync(runtimePidFile, `${process.pid}\n`, 'utf8');
    }
    catch (_error) { }
}

function removeRuntimePidFile() {
    try {
        if (!fs.existsSync(runtimePidFile)) {
            return;
        }
        const filePid = fs.readFileSync(runtimePidFile, 'utf8').trim();
        if (!filePid || Number(filePid) === process.pid) {
            fs.rmSync(runtimePidFile, { force: true });
        }
    }
    catch (_error) { }
}

printStartupBanner();
console.log(`${colorizePrefix("> [DATA]", [104, 225, 255])} Runtime initialized. EXYEZED-BOT + AURORA are active.`);
logger.initialize({
    runtimeMode: "Direct local connection",
    bridgeUrl: `ws://${host}:${port}`,
    runtimeProfile: runtimeManager.getRuntimeProfile().name,
    bridgeStatus: "Awaiting Control Panel",
    proxyStatus: proxyManager.getFeatureStatusLabel(),
    nodeVersion: process.version,
    platform: `${process.platform} ${process.arch}`,
});
proxyManager.startAutoRefreshLoop(true);

function formatSocketSource(request) {
    return request?.socket?.remoteAddress || 'unknown';
}

function rejectClientAuth(entry, message = 'Unauthorized bridge request.') {
    if (!entry || entry.disconnected) {
        return;
    }
    try {
        entry.ws.send(buildBridgeAuthErrorPayload(message));
    }
    catch (_error) { }
    try {
        entry.ws.close();
    }
    catch (_error) { }
}

function authenticateClient(entry, request) {
    if (!entry || entry.disconnected || entry.authenticated) {
        return;
    }
    entry.authenticated = true;
    if (entry.authTimeout) {
        clearTimeout(entry.authTimeout);
        entry.authTimeout = null;
    }
    try {
        entry.ws.send(buildBridgeAuthOkPayload("runtime"));
    }
    catch (_error) { }
    entry.client.attach();
    logger.info(`Bridge Status: Control Panel Authenticated (#${entry.clientId}) from ${formatSocketSource(request)}.`);
}

function handlePendingClientAuth(entry, rawMessage, request) {
    const payload = normalizeAuthPayload(rawMessage);
    if (!isValidBridgeAuthPayload(payload, "runtime")) {
        rejectClientAuth(entry, 'Runtime bridge auth failed.');
        return false;
    }
    authenticateClient(entry, request);
    return true;
}

function disconnectClient(clientId, reason, error = null) {
    const entry = clients.get(clientId);
    if (!entry || entry.disconnected) {
        return;
    }
    entry.disconnected = true;
    if (entry.authTimeout) {
        clearTimeout(entry.authTimeout);
        entry.authTimeout = null;
    }
    try {
        entry.client.dispose();
    }
    catch (disposeError) {
        logger.warn(`Client #${clientId} dispose failed: ${disposeError?.message || disposeError}`);
    }
    clients.delete(clientId);
    if (!shuttingDown && clients.size === 0 && !runtimeManager.stoppedBots) {
        runtimeManager.stopBots();
    }
    const suffix = error?.message ? ` (${error.message})` : '';
    logger.warn(`Bridge Status: Control Panel Detached (#${clientId}) via ${reason}${suffix}.`);
}

function shutdown(signal) {
    if (shuttingDown) {
        return;
    }
    shuttingDown = true;
    logger.warn(`Runtime shutdown requested by ${signal}.`);
    for (const [clientId, entry] of clients.entries()) {
        try {
            entry.client.dispose();
        }
        catch (_error) { }
        try {
            entry.ws.close();
        }
        catch (_error) { }
        entry.disconnected = true;
        clients.delete(clientId);
    }
    runtimeManager.dispose();
    auroraControlService.dispose();
    proxyManager.stopAutoRefreshLoop();
    wss.close(() => {
        server.close(() => process.exit(0));
    });
    setTimeout(() => process.exit(0), 1000).unref?.();
}

function handleServerStartupError(error, source) {
    if (error?.code === 'EADDRINUSE') {
        if (!portConflictHandled) {
            portConflictHandled = true;
            logger.warn(`Bridge port ws://${host}:${port} is already in use. An existing runtime may already be online.`);
        }
        setTimeout(() => process.exit(0), 120).unref?.();
        return true;
    }
    logger.warn(`${source} error: ${error?.message || error}`);
    return false;
}

auroraControlService.listen().catch((error) => {
    logger.warn(`Aurora bridge startup failed: ${error?.message || error}`);
});

server.listen(port, host, () => {
    writeRuntimePidFile();
    logger.info(`Bridge Ready on ws://${host}:${port} [session ${logger.getSessionId()}].`);
});

server.on('error', (error) => {
    handleServerStartupError(error, 'HTTP server');
});

wss.on('error', (error) => {
    handleServerStartupError(error, 'WebSocket server');
});

wss.on('connection', (ws, request) => {
    const clientId = ++nextClientId;
    const client = new Client(ws, runtimeManager);
    const entry = {
        clientId,
        client,
        ws,
        disconnected: false,
        authenticated: false,
        authTimeout: null,
    };
    clients.set(clientId, entry);
    entry.authTimeout = setTimeout(() => {
        rejectClientAuth(entry, 'Runtime bridge auth timeout.');
    }, BRIDGE_AUTH_TIMEOUT_MS);
    logger.info(`Bridge Status: Pending Control Panel Auth (#${clientId}) from ${formatSocketSource(request)}.`);
    const handleDisconnect = (reason, error = null) => {
        disconnectClient(clientId, reason, error);
    };
    ws.on('message', async (buffer) => {
        if (!entry.authenticated) {
            handlePendingClientAuth(entry, buffer, request);
            return;
        }
        try {
            await client.handleMessage(buffer);
        }
        catch (error) {
            logger.warn(`Client #${clientId} message handling failed: ${error?.message || error}`);
        }
    });
    ws.on('close', () => handleDisconnect('close'));
    ws.on('error', (error) => handleDisconnect('error', error));
});

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('exit', () => removeRuntimePidFile());
