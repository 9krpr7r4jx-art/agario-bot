export const DEFAULT_CONFIG = Object.freeze({
    botCount: 110,
    botName: "EXYEZED",
    protocolVersion: 23,
    clientVersion: 31128,
    followMassGoal: 50,
    lockTargetMass: 410,
    autoNick: false,
    useProxy: false,
    botAi: false,
    botLock: false,
    botDeltaAi: false,
    botOrbit: false,
    botVShield: false
});

export const LIMITS = Object.freeze({
    maxBots: 500,
    maxBotNameLength: 25
});

export const TIMING = Object.freeze({
    fallbackSpawnInterval: 150,
    fallbackCountBroadcastInterval: 1000,
    fallbackSnapshotInterval: 1000,
    fallbackFastMovementFlushInterval: 26,
    fallbackNormalMovementFlushInterval: 32
});

export const RUNTIME_PROFILES = Object.freeze([
    Object.freeze({
        name: "precision",
        maxBots: 40,
        spawnInterval: 120,
        spawnBatch: 2,
        countBroadcastInterval: 750,
        snapshotInterval: 900,
        fastMovementFlushInterval: 24,
        normalMovementFlushInterval: 30
    }),
    Object.freeze({
        name: "balanced",
        maxBots: 80,
        spawnInterval: 140,
        spawnBatch: 2,
        countBroadcastInterval: 900,
        snapshotInterval: 1000,
        fastMovementFlushInterval: 26,
        normalMovementFlushInterval: 32
    }),
    Object.freeze({
        name: "swarm",
        maxBots: 140,
        spawnInterval: 160,
        spawnBatch: 1,
        countBroadcastInterval: 1050,
        snapshotInterval: 1100,
        fastMovementFlushInterval: 28,
        normalMovementFlushInterval: 34
    }),
    Object.freeze({
        name: "horde",
        maxBots: Number.POSITIVE_INFINITY,
        spawnInterval: 185,
        spawnBatch: 1,
        countBroadcastInterval: 1250,
        snapshotInterval: 1300,
        fastMovementFlushInterval: 30,
        normalMovementFlushInterval: 36
    })
]);

export function clampBotCount(value) {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed) || parsed < 1) {
        return DEFAULT_CONFIG.botCount;
    }
    return Math.min(parsed, LIMITS.maxBots);
}

export function truncateBotName(value, maxLength = LIMITS.maxBotNameLength) {
    return Array.from(
        String(value ?? "")
            .replace(/[\r\n]+/g, "")
            .replace(/\u0000/g, ""),
    )
        .slice(0, maxLength)
        .join("");
}

export function normalizeComparableName(value, maxLength = LIMITS.maxBotNameLength) {
    const normalized = truncateBotName(value, maxLength).trim();
    return normalized ? normalized.normalize("NFC") : "";
}

export function sanitizeBotName(value, fallback = DEFAULT_CONFIG.botName) {
    const normalized = normalizeComparableName(value);
    return normalized || fallback;
}

export function getRuntimeProfile(botCount = DEFAULT_CONFIG.botCount) {
    for (const profile of RUNTIME_PROFILES) {
        if (botCount <= profile.maxBots) {
            return profile;
        }
    }
    return RUNTIME_PROFILES[RUNTIME_PROFILES.length - 1];
}
