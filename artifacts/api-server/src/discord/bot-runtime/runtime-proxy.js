// ── Runtime Proxy (stub — no proxy support) ───────────────────────────────

export const proxyManager = {
    beginSession:          (_useProxy) => ({ enabled: false, agent: null, proxyUrl: null }),
    getFeatureStatusLabel: ()          => "disabled",
    describeSession:       (_session)  => "No proxy",
    connectTimeoutMs:      0,
    startAutoRefreshLoop:  ()          => {},
    stopAutoRefreshLoop:   ()          => {},
};
