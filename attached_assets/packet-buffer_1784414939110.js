function normalizeEncoding(encoding = "utf8") {
    if (!encoding) {
        return "utf8";
    }
    return String(encoding).toLowerCase();
}

export class PacketReader {
    static fromBuffer(buffer) {
        return new PacketReader(buffer);
    }
    buffer;
    readOffset;
    constructor(buffer) {
        this.buffer = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer || []);
        this.readOffset = 0;
    }
    toBuffer() {
        return this.buffer;
    }
    readUInt8(offset) {
        const index = Number.isInteger(offset) ? offset : this.readOffset++;
        return this.buffer.readUInt8(index);
    }
    readUInt16LE(offset) {
        if (Number.isInteger(offset)) {
            return this.buffer.readUInt16LE(offset);
        }
        const value = this.buffer.readUInt16LE(this.readOffset);
        this.readOffset += 2;
        return value;
    }
    readUInt32LE(offset) {
        if (Number.isInteger(offset)) {
            return this.buffer.readUInt32LE(offset);
        }
        const value = this.buffer.readUInt32LE(this.readOffset);
        this.readOffset += 4;
        return value;
    }
    readInt32LE(offset) {
        if (Number.isInteger(offset)) {
            return this.buffer.readInt32LE(offset);
        }
        const value = this.buffer.readInt32LE(this.readOffset);
        this.readOffset += 4;
        return value;
    }
    readDoubleLE(offset) {
        if (Number.isInteger(offset)) {
            return this.buffer.readDoubleLE(offset);
        }
        const value = this.buffer.readDoubleLE(this.readOffset);
        this.readOffset += 8;
        return value;
    }
    readStringNT(encoding = "utf8") {
        const start = this.readOffset;
        let end = start;
        while (end < this.buffer.length && this.buffer[end] !== 0) {
            end += 1;
        }
        this.readOffset = Math.min(end + 1, this.buffer.length);
        return this.buffer.toString(normalizeEncoding(encoding), start, end);
    }
}

export class PacketWriter {
    static fromSize(size = 64) {
        return new PacketWriter(size);
    }
    buffer;
    writeOffset;
    constructor(size = 64) {
        this.buffer = Buffer.alloc(Math.max(16, size));
        this.writeOffset = 0;
    }
    ensureCapacity(extraBytes) {
        const required = this.writeOffset + extraBytes;
        if (required <= this.buffer.length) {
            return;
        }
        let nextLength = this.buffer.length;
        while (nextLength < required) {
            nextLength *= 2;
        }
        const nextBuffer = Buffer.alloc(nextLength);
        this.buffer.copy(nextBuffer, 0, 0, this.writeOffset);
        this.buffer = nextBuffer;
    }
    writeUInt8(value) {
        this.ensureCapacity(1);
        this.buffer.writeUInt8(value, this.writeOffset);
        this.writeOffset += 1;
        return this;
    }
    writeUInt16LE(value) {
        this.ensureCapacity(2);
        this.buffer.writeUInt16LE(value, this.writeOffset);
        this.writeOffset += 2;
        return this;
    }
    writeUInt32LE(value) {
        this.ensureCapacity(4);
        this.buffer.writeUInt32LE(value, this.writeOffset);
        this.writeOffset += 4;
        return this;
    }
    writeInt32LE(value) {
        this.ensureCapacity(4);
        this.buffer.writeInt32LE(value, this.writeOffset);
        this.writeOffset += 4;
        return this;
    }
    writeStringNT(value, encoding = "utf8") {
        const normalized = Buffer.from(String(value ?? ""), normalizeEncoding(encoding));
        this.ensureCapacity(normalized.length + 1);
        normalized.copy(this.buffer, this.writeOffset);
        this.writeOffset += normalized.length;
        this.buffer.writeUInt8(0, this.writeOffset);
        this.writeOffset += 1;
        return this;
    }
    toBuffer() {
        return this.buffer.subarray(0, this.writeOffset);
    }
}
