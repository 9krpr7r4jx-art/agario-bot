export const BRIDGE_AUTH_TOKEN = "EXYEZED_RUNTIME_BRIDGE_V1_7F2D91B4A6E8C3F5";
export const BRIDGE_AUTH_TIMEOUT_MS = 2200;

export function normalizeAuthPayload(raw) {
    if (!raw) {
        return null;
    }
    if (typeof raw === "string") {
        try {
            return JSON.parse(raw);
        } catch (_error) {
            return null;
        }
    }
    if (raw instanceof Buffer) {
        return normalizeAuthPayload(raw.toString("utf8"));
    }
    if (raw instanceof ArrayBuffer) {
        return normalizeAuthPayload(Buffer.from(raw).toString("utf8"));
    }
    if (ArrayBuffer.isView(raw)) {
        return normalizeAuthPayload(Buffer.from(raw.buffer, raw.byteOffset, raw.byteLength).toString("utf8"));
    }
    return null;
}

export function isValidBridgeAuthPayload(payload, channel) {
    return Boolean(
        payload &&
        payload.type === "auth" &&
        payload.channel === channel &&
        payload.token === BRIDGE_AUTH_TOKEN,
    );
}

export function buildBridgeAuthOkPayload(channel) {
    return JSON.stringify({ type: "auth-ok", channel });
}

export function buildBridgeAuthErrorPayload(message = "Unauthorized bridge request.") {
    return JSON.stringify({ type: "auth-error", message });
}
