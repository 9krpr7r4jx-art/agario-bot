// ── Protocol Buffers ──────────────────────────────────────────────────────
// Builds binary packets for the Agario Mobile WebSocket protocol.

function uint32Packet(opcode, value) {
    const buf = Buffer.alloc(5);
    buf.writeUInt8(opcode, 0);
    buf.writeUInt32LE(value >>> 0, 1);
    return buf;
}

function spawnPacket(name) {
    const encoded = Buffer.from(String(name || ""), "utf8");
    const packet  = Buffer.alloc(encoded.length + 2);
    packet[0] = 0x00;
    encoded.copy(packet, 1);
    packet[packet.length - 1] = 0x00;
    return packet;
}

function movePacket(x, y, decryptionKey) {
    // opcode 0x10 | int32 x LE | int32 y LE | uint32 decryptionKey LE  → 13 bytes
    const buf = Buffer.alloc(13);
    buf.writeUInt8(0x10, 0);
    buf.writeInt32LE(x | 0, 1);
    buf.writeInt32LE(y | 0, 5);
    buf.writeUInt32LE(decryptionKey >>> 0, 9);
    return buf;
}

function splitPacket() {
    return Buffer.from([0x11]);
}

function ejectPacket() {
    return Buffer.from([0x15]);
}

export const buffers = {
    /** Send protocol version (0xFE opcode) */
    protocolVersion: (v) => uint32Packet(0xfe, v),
    /** Send client version / key (0xFF opcode) */
    protocolKey:     (v) => uint32Packet(0xff, v),
    /** Spawn packet (0x00 opcode) */
    spawn:           (name) => spawnPacket(name),
    /** Move-to packet (0x10 opcode) */
    moveTo:          (x, y, decryptionKey) => movePacket(x, y, decryptionKey),
    /** Split packet (0x11 opcode) */
    split:           () => splitPacket(),
    /** Eject/feed packet (0x15 opcode) */
    eject:           () => ejectPacket(),
};
