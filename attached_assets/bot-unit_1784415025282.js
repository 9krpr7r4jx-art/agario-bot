import _0x4d3db3 from "ws";
import _0x5efc8c from "./entity.js";
import { PacketReader } from "./packet-buffer.js";
import { buffers } from "./protocol-buffers.js";
import { helper } from "./runtime-helpers.js";
import { logger } from "./runtime-logger.js";
export class BotUnit {
  t;
  ws;
  rX;
  rY;
  client;
  assignedName;
  isAlive;
  offsetX;
  offsetY;
  borderX;
  borderY;
  isClosed;
  ownCells;
  gameModeInt;
  playerCells;
  followMouse;
  isConnected;
  isNearMouse;
  encryptionKey;
  decryptionKey;
  mapOffsetFixed;
  moveInt;
  moveTickMs;
  orbitSlot;
  errorTimeout;
  connectTimeout;
  myCellIds;
  followMouseTimeout;
  spawnTimeout;
  lastMoveX;
  lastMoveY;
  lastMoveAt;
  orientationReady;
  orientationCandidateKey;
  orientationCandidateHits;
  followMassUnlocked;
  spawnedAt;
  lastMassValue;
  lastMassGainAt;
  lastDeltaSplitAt;
  deltaSplitLockUntil;
  preStartFollowBypass;
  arenaStarted;
  lastCenterX;
  lastCenterY;
  lastEntityPruneAt;
  constructor(_0xa3427f) {
    ((this.ws = null),
      (this.rX = 0x1),
      (this.rY = 0x1),
      (this.offsetX = 0x0),
      (this.offsetY = 0x0),
      (this.borderX = 0x0),
      (this.borderY = 0x0),
      (this.myCellIds = {}),
      (this.ownCells = []),
      (this.moveInt = null),
      (this.moveTickMs = 0x32),
      (this.orbitSlot =
        typeof _0xa3427f.allocateOrbitSlot === "function"
          ? _0xa3427f.allocateOrbitSlot()
          : 0x0),
      (this.t = Math.random() * Math.PI * 0x2),
      (this.client = _0xa3427f),
      (this.assignedName =
        typeof _0xa3427f.allocateBotName === "function"
          ? _0xa3427f.allocateBotName()
          : _0xa3427f.botName),
      (this.isAlive = ![]),
      (this.isClosed = ![]),
      (this.gameModeInt = -0x1),
      (this.playerCells = []),
      (this.encryptionKey = 0x0),
      (this.decryptionKey = 0x0),
      (this.followMouse = ![]),
      (this.errorTimeout = null),
      (this.connectTimeout = null),
      (this.spawnTimeout = null),
      (this.lastMoveX = null),
      (this.lastMoveY = null),
      (this.lastMoveAt = 0x0),
      (this.orientationReady = ![]),
      (this.orientationCandidateKey = ""),
      (this.orientationCandidateHits = 0x0),
      (this.followMassUnlocked = ![]),
      (this.spawnedAt = 0x0),
      (this.lastMassValue = 0x0),
      (this.lastMassGainAt = 0x0),
      (this.lastDeltaSplitAt = 0x0),
      (this.deltaSplitLockUntil = 0x0),
      (this.preStartFollowBypass = ![]),
      (this.arenaStarted = ![]),
      (this.lastCenterX = Number.NaN),
      (this.lastCenterY = Number.NaN),
      (this.lastEntityPruneAt = 0x0),
      (this.isConnected = ![]),
      (this.isNearMouse = ![]),
      (this.mapOffsetFixed = ![]),
      (this.followMouseTimeout = null),
      this.connect());
  }
  connect() {
    const _0x5ab1cb = this.client.getBotConnectionOptions();
    ((this.ws = new _0x4d3db3(this.client.server, {
      agent: _0x5ab1cb.agent,
      headers: helper.generateHeaders(),
      rejectUnauthorized: ![],
    })),
      (this.ws.binaryType = "nodebuffer"),
      (this.ws.onopen = this.onopen.bind(this)),
      (this.ws.onclose = this.onclose.bind(this)),
      (this.ws.onerror = this.onerror.bind(this)),
      (this.ws.onmessage = this.onmessage.bind(this)));
    if (_0x5ab1cb.proxyUrl && Number(_0x5ab1cb.connectTimeoutMs) > 0) {
      this.connectTimeout = setTimeout(() => {
        if (
          this.ws?.readyState === _0x4d3db3.CONNECTING ||
          this.ws?.readyState === _0x4d3db3.OPEN
        ) {
          this.ws.terminate();
        }
      }, Number(_0x5ab1cb.connectTimeoutMs));
      if (typeof this.connectTimeout?.unref === "function") {
        this.connectTimeout.unref();
      }
    }
  }
  send(_0x17b543, _0x379740 = ![]) {
    if (!this.ws) return;
    _0x379740 && (_0x17b543 = helper.xorBuffer(_0x17b543, this.encryptionKey));
    this.encryptionKey &&
      (this.encryptionKey = helper.rotateKey(this.encryptionKey));
    if (this.ws.readyState === 0x1) this.ws.send(_0x17b543);
  }
  onopen() {
    this.clearConnectTimeout();
    (this.send(buffers.protocolVersion(this.client.protocolVersion)),
      this.send(buffers.protocolKey(this.client.clientVersion)));
  }
  onclose() {
    this.clearConnectTimeout();
    this.clearTimeouts();
    this.clearIntervals();
    this.isClosed = !![];
    if (this.isConnected && this.client.connectedBots > 0x0)
      this.client.connectedBots--;
    this.resetOrientation();
    ((this.isConnected = ![]),
      (this.isAlive = ![]),
      (this.followMouse = ![]),
      (this.isNearMouse = ![]),
      (this.followMassUnlocked = ![]),
      (this.spawnedAt = 0x0),
      (this.lastMassValue = 0x0),
      (this.lastMassGainAt = 0x0),
      (this.lastDeltaSplitAt = 0x0),
      (this.deltaSplitLockUntil = 0x0),
       (this.preStartFollowBypass = ![]),
       (this.arenaStarted = ![]),
       (this.lastCenterX = Number.NaN),
       (this.lastCenterY = Number.NaN),
       (this.lastEntityPruneAt = 0x0),
       (this.ownCells = []),
      (this.playerCells = []),
      (this.myCellIds = {}),
      (this.lastMoveX = null),
      (this.lastMoveY = null),
      (this.lastMoveAt = 0x0));
  }
  onerror() {
    this.clearConnectTimeout();
    ((this.isClosed = !![]),
      this.clearTimeouts(),
      this.clearIntervals(),
      (this.errorTimeout = setTimeout(() => {
        if (
          this.ws?.readyState === _0x4d3db3.CONNECTING ||
          this.ws?.readyState === _0x4d3db3.OPEN
        )
          this.ws.close();
      }, 0x3e8)));
  }
  onmessage({ data: _0x273acc }) {
    let _0x4b56f8 = _0x273acc;
    if (this.decryptionKey)
      _0x4b56f8 = helper.xorBuffer(_0x4b56f8, this.decryptionKey ^ this.client.clientVersion);
    this.handleBuffer(_0x4b56f8);
  }
  handleBuffer(_0xd4cd58) {
    const _0x50012a = PacketReader.fromBuffer(_0xd4cd58),
      _0x5e0e2d = _0x50012a.readUInt8();
    switch (_0x5e0e2d) {
      case 0x12:
        ((this.myCellIds = {}),
        (this.ownCells = []),
        (this.playerCells = []),
        (this.followMassUnlocked = ![]),
        (this.spawnedAt = 0x0),
        (this.lastMassValue = 0x0),
        (this.lastMassGainAt = 0x0),
        (this.lastDeltaSplitAt = 0x0),
        (this.deltaSplitLockUntil = 0x0),
        (this.preStartFollowBypass = ![]),
        (this.arenaStarted = ![]),
        (this.lastCenterX = Number.NaN),
        (this.lastCenterY = Number.NaN),
        (this.lastMoveX = null),
        (this.lastMoveY = null),
        (this.lastMoveAt = 0x0));
        break;
      case 0x20:
        const _0x3b86a2 = _0x50012a.readUInt32LE();
        this.myCellIds[_0x3b86a2] = _0x3b86a2;
        !this.isAlive &&
          ((this.isAlive = !![]),
          (this.spawnedAt = Date.now()),
          (this.lastMassValue = 0x0),
          (this.lastMassGainAt = Date.now()),
          (this.lastDeltaSplitAt = 0x0),
          (this.deltaSplitLockUntil = 0x0),
        (this.preStartFollowBypass = ![]),
        (this.arenaStarted = ![]),
        (this.lastCenterX = Number.NaN),
        (this.lastCenterY = Number.NaN),
        this.refreshMoveInterval(0x0),
          !this.client.startedBots &&
            !this.client.stoppedBots &&
            ((this.client.startedBots = !![]), logger.info("Core Activated.")),
          (this.followMouse = !![]),
          this.move());
        break;
      case 0x45:
        this.ghostCells(_0x50012a);
        break;
      case 0x55:
        logger.warn("Upstream connection unusable");
        break;
      case 0x67:
      case 0x68:
        break;
      case 0xf1:
        ((this.isConnected = !![]), this.client.connectedBots++);
        if (!this.client.server) break;
        this.decryptionKey = _0x50012a.readUInt32LE();
        const _0x57bc34 = this.client.server.match(
          /wss:\/\/(web-arenas-live-[\w-]+\.agario\.miniclippt\.com\/[\w-]+\/[\d-]+)/,
        );
        if (_0x57bc34 && _0x57bc34[0x1])
          this.encryptionKey = helper.murmur2(
            "" + _0x57bc34[0x1] + _0x50012a.readStringNT("utf-8"),
            0xff,
          );
        break;
      case 0xf2:
        this.send(buffers.spawn(this.assignedName || this.client.botName), !![]);
        break;
      case 0xff:
        this.handleMessage(
          helper.uncompressBuffer(
            _0x50012a.toBuffer().subarray(0x5),
            Buffer.alloc(_0x50012a.readUInt32LE()),
          ),
        );
        break;
    }
  }
  useMassBoost() {
    return;
  }
  handleMessage(_0xd45e85) {
    const _0x58d2d8 = PacketReader.fromBuffer(_0xd45e85),
      _0x55d81b = _0x58d2d8.readUInt8();
    switch (_0x55d81b) {
      case 0x10:
        this.updateNodes(_0x58d2d8);
        break;
      case 0x40:
        this.updateOffset(_0x58d2d8);
        break;
    }
  }
  ghostCells(_0x3a0e1a) {
    _0x3a0e1a.readOffset += 0x2;
    const _0x30b01b = _0x3a0e1a.readInt32LE() - this.offsetX,
      _0x3e2d03 = _0x3a0e1a.readInt32LE() - this.offsetY;
    let _0x454c70;
    if (_0x30b01b < 0x0 && _0x3e2d03 < 0x0) _0x454c70 = 0x1;
    else {
      if (_0x30b01b > 0x0 && _0x3e2d03 < 0x0) _0x454c70 = 0x2;
      else
        _0x30b01b > 0x0 && _0x3e2d03 > 0x0
          ? (_0x454c70 = 0x3)
          : (_0x454c70 = 0x4);
    }
    const _0x32f0c1 = [
      [
        [0x1, 0x1],
        [-0x1, 0x1],
        [-0x1, -0x1],
        [0x1, -0x1],
      ],
      [
        [-0x1, 0x1],
        [0x1, 0x1],
        [0x1, -0x1],
        [-0x1, -0x1],
      ],
      [
        [-0x1, -0x1],
        [0x1, -0x1],
        [0x1, 0x1],
        [-0x1, 0x1],
      ],
      [
        [0x1, -0x1],
        [-0x1, -0x1],
        [-0x1, 0x1],
        [0x1, 0x1],
      ],
    ];
    if (
      this.client.rQuadrant < 0x1 ||
      this.client.rQuadrant > 0x4 ||
      this.usesDirectOwnerCoords()
    )
      return;
    const _0x52daa4 = _0x32f0c1[this.client.rQuadrant - 0x1];
    const [_0x3c1e2e, _0x3ef4d0] = _0x52daa4[_0x454c70 - 0x1];
    ((this.rX = _0x3c1e2e),
      (this.rY = _0x3ef4d0),
      (this.orientationReady = !![]),
      (this.orientationCandidateKey = _0x3c1e2e + ":" + _0x3ef4d0),
      (this.orientationCandidateHits = 0x0));
  }
  updateNodes(_0x30e211) {
    const _0x57b1cb = Date.now();
    const _0x3f1108 = _0x30e211.readUInt16LE();
    for (let _0x5ccb22 = 0x0; _0x5ccb22 < _0x3f1108; _0x5ccb22++) {
      _0x30e211.readUInt32LE();
      const _0x33c3f6 = this.playerCells[_0x30e211.readUInt32LE()];
      if (_0x33c3f6) _0x33c3f6.destroy(this);
    }
    while (!![]) {
      const _0x514426 = _0x30e211.readUInt32LE();
      if (_0x514426 === 0x0) break;
      const _0x51ddad = _0x30e211.readInt32LE(),
        _0x415aa8 = _0x30e211.readInt32LE(),
        _0x4a7f87 = _0x30e211.readUInt16LE(),
        _0x32b001 = _0x30e211.readUInt8(),
        _0x2dd835 = !!(_0x32b001 & 0x1);
      let _0x30e340 = null,
        _0x4c827b = null,
        _0x280560 = null,
        _0x492bb6 = 0x0;
      if (_0x32b001 & 0x80) _0x492bb6 = _0x30e211.readUInt8();
      if (_0x32b001 & 0x2)
        _0x4c827b = helper.intToHex(
          (_0x30e211.readUInt8() << 0x10) |
            (_0x30e211.readUInt8() << 0x8) |
            _0x30e211.readUInt8(),
        );
      if (_0x32b001 & 0x4) _0x280560 = _0x30e211.readStringNT("utf8");
      if (_0x32b001 & 0x8) _0x30e340 = _0x30e211.readStringNT("utf8");
      const _0x4d9121 = !!(_0x32b001 & 0x10),
        _0xf1cdd2 = !!(_0x492bb6 & 0x1),
        _0x13d97d = !!(_0x492bb6 & 0x2),
        _0x3e746b =
          _0x492bb6 & 0x4
            ? ((_0x30e211.readOffset += 0x4),
              _0x30e211.readUInt32LE(_0x30e211.readOffset - 0x4))
            : 0x0;
      let _0x59d587 = this.playerCells[_0x514426];
      const _0x4e5584 = !_0x59d587 || _0x59d587.lastSeenAt === 0x0;
      if (
        _0x59d587 &&
        !_0x4e5584 &&
        Number.isFinite(_0x59d587.x) &&
        Number.isFinite(_0x59d587.y)
      ) {
        ((_0x59d587.prevX = _0x59d587.x),
          (_0x59d587.prevY = _0x59d587.y));
      }
      (!_0x59d587 &&
        ((_0x59d587 = new _0x5efc8c(_0x514426, _0x3e746b)),
        (this.playerCells[_0x514426] = _0x59d587)),
        _0x4c827b !== null && (_0x59d587.color = _0x4c827b),
        _0x30e340 !== null &&
          (_0x59d587.name = _0x30e340),
        _0x280560 !== null && (_0x59d587.skinName = _0x280560),
        this.myCellIds[_0x514426] &&
          this.ownCells.indexOf(_0x59d587) === -0x1 &&
          ((_0x59d587.isMine = !![]), this.ownCells.push(_0x59d587)),
        (_0x59d587.x = _0x51ddad),
        (_0x59d587.y = _0x415aa8),
        (_0x59d587.size = _0x4a7f87),
        (_0x59d587.isFood = _0xf1cdd2),
        (_0x59d587.isVirus = _0x2dd835),
        (_0x59d587.agitated = _0x4d9121),
        (_0x59d587.isFriend = _0x13d97d),
        (_0x59d587.accountID = _0x3e746b),
        _0x4e5584 &&
          ((_0x59d587.prevX = _0x59d587.x), (_0x59d587.prevY = _0x59d587.y)),
        (_0x59d587.lastSeenAt = _0x57b1cb));
    }
    const _0x43e48e = _0x30e211.readUInt16LE();
    for (let _0x449df1 = 0x0; _0x449df1 < _0x43e48e; _0x449df1++) {
      const _0x4ee227 = _0x30e211.readUInt32LE();
      if (this.playerCells[_0x4ee227])
        this.playerCells[_0x4ee227].destroy(this);
    }
    this.pruneStaleCells(_0x57b1cb);
    if (this.isAlive && this.ownCells.length === 0x0) {
      this.moveInt && (clearTimeout(this.moveInt), (this.moveInt = null));
      this.followMouseTimeout &&
        (clearTimeout(this.followMouseTimeout),
        (this.followMouse = ![]),
        (this.followMouseTimeout = null));
      ((this.isAlive = ![]),
        (this.isNearMouse = ![]),
        (this.followMassUnlocked = ![]),
        (this.spawnedAt = 0x0),
        (this.lastMassValue = 0x0),
        (this.lastMassGainAt = 0x0),
        (this.lastDeltaSplitAt = 0x0),
        (this.deltaSplitLockUntil = 0x0),
        (this.preStartFollowBypass = ![]),
        (this.arenaStarted = ![]),
        (this.lastCenterX = Number.NaN),
        (this.lastCenterY = Number.NaN),
        (this.lastMoveX = null),
        (this.lastMoveY = null),
        (this.lastMoveAt = 0x0));
      this.spawnTimeout = setTimeout(
        () => this.send(buffers.spawn(this.assignedName || this.client.botName), !![]),
        0x3e8,
      );
    }
  }
  updateOffset(_0xee713e) {
    const _0x4f5abb = _0xee713e.readDoubleLE(),
      _0x232cdd = _0xee713e.readDoubleLE(),
      _0x28e5cd = _0xee713e.readDoubleLE(),
      _0x4ede69 = _0xee713e.readDoubleLE();
    if (!this.mapOffsetFixed) {
      ((this.borderX = _0x28e5cd - _0x4f5abb),
        (this.borderY = _0x4ede69 - _0x232cdd));
      if (_0x28e5cd - _0x4f5abb > 0x36b0)
        this.offsetX = (_0x4f5abb + _0x28e5cd) / 0x2;
      if (_0x4ede69 - _0x232cdd > 0x36b0)
        this.offsetY = (_0x232cdd + _0x4ede69) / 0x2;
      this.gameModeInt = _0xee713e.readUInt8();
      this.mapOffsetFixed = !![];
      if (this.usesDirectOwnerCoords())
        ((this.rX = 0x1),
          (this.rY = 0x1),
          (this.orientationReady = !![]),
          (this.orientationCandidateKey = "1:1"),
          (this.orientationCandidateHits = 0x0));
    }
  }
  clearIntervals() {
    (this.moveInt && (clearTimeout(this.moveInt), (this.moveInt = null)),
      (this.moveTickMs = 0x32));
  }
  clearConnectTimeout() {
    this.connectTimeout &&
      (clearTimeout(this.connectTimeout), (this.connectTimeout = null));
  }
  clearTimeouts() {
    (this.clearConnectTimeout(),
      this.spawnTimeout &&
      (clearTimeout(this.spawnTimeout), (this.spawnTimeout = null)),
      this.errorTimeout &&
        (clearTimeout(this.errorTimeout), (this.errorTimeout = null)),
      this.followMouseTimeout &&
        (clearTimeout(this.followMouseTimeout),
        (this.followMouseTimeout = null)));
  }
  resetOrientation() {
    ((this.rX = 0x1),
      (this.rY = 0x1),
      (this.orientationReady = ![]),
      (this.orientationCandidateKey = ""),
      (this.orientationCandidateHits = 0x0));
  }
  usesDirectOwnerCoords() {
    return this.gameModeInt === 0x3;
  }
  pruneStaleCells(_0x42ee2e = Date.now()) {
    if (_0x42ee2e - this.lastEntityPruneAt < 0x1388) return;
    this.lastEntityPruneAt = _0x42ee2e;
    const _0x5554b7 = _0x42ee2e - 0x3a98;
    for (const _0x23dc45 in this.playerCells) {
      const _0x37d754 = this.playerCells[_0x23dc45];
      if (!_0x37d754) {
        delete this.playerCells[_0x23dc45];
        continue;
      }
      if (_0x37d754.isMine) continue;
      if (_0x37d754.lastSeenAt && _0x37d754.lastSeenAt < _0x5554b7) {
        _0x37d754.destroy(this);
      }
    }
  }
  hasVisibleFood(_0x1a5a85 = Number.NaN, _0x474fe4 = Number.NaN, _0x393963 = Infinity) {
    const _0x3cf4cd =
      Number.isFinite(_0x1a5a85) &&
      Number.isFinite(_0x474fe4) &&
      Number.isFinite(_0x393963)
        ? _0x393963 * _0x393963
        : Infinity;
    for (const _0x2d67c6 in this.playerCells) {
      const _0x2aa309 = this.playerCells[_0x2d67c6];
      if (
        !_0x2aa309 ||
        _0x2aa309.isMine ||
        _0x2aa309.isFriend ||
        _0x2aa309.isVirus ||
        !_0x2aa309.isFood
      )
        continue;
      if (_0x3cf4cd !== Infinity) {
        const _0x5285ef = _0x2aa309.x - _0x1a5a85,
          _0x1ab4b8 = _0x2aa309.y - _0x474fe4;
        if (_0x5285ef * _0x5285ef + _0x1ab4b8 * _0x1ab4b8 > _0x3cf4cd)
          continue;
      }
      return !![];
    }
    return ![];
  }
  shouldSkipFollowMassGate(_0x22d477, _0x4a8d43, _0x15b1fc) {
    if (
      this.followMassUnlocked ||
      this.arenaStarted ||
      this.usesDirectOwnerCoords() ||
      !this.followMouse ||
      this.client.botAi ||
      this.client.botDeltaAi ||
      this.client.botVShield
    )
      return ![];
    const _0x16e64f = Date.now();
    if (!this.spawnedAt || _0x16e64f - this.spawnedAt > 0x3a98) return ![];
    if (_0x22d477 > 0xf) return ![];
    if (!this.hasVisibleFood(_0x4a8d43, _0x15b1fc, 0xfa)) return ![];
    return !!this.lastMassGainAt && _0x16e64f - this.lastMassGainAt > 0x9c4;
  }
  isFastMoveMode(_0x2c9499 = this.lastMassValue) {
    const _0x1c3513 = Number(this.client.followMassGoal),
      _0x4f0937 = Number.isFinite(_0x1c3513) ? _0x1c3513 : 0x32;
    return !!(
      this.followMouse &&
      !this.client.botVShield &&
      (this.client.botAi ||
        this.client.botLock ||
        this.client.botDeltaAi ||
        this.client.botOrbit ||
        (!this.followMassUnlocked &&
          !this.preStartFollowBypass &&
          Number.isFinite(_0x2c9499) &&
          _0x2c9499 < _0x4f0937))
    );
  }
  getDesiredMoveInterval(_0x40e7a0 = this.lastMassValue) {
    if (this.client.botLock) return 0x1c;
    return this.isFastMoveMode(_0x40e7a0) ? 0x23 : 0x32;
  }
  getMoveTickJitter() {
    return (this.orbitSlot % 0x7) * 0x3;
  }
  scheduleMoveTimer(_0x208865 = this.moveTickMs) {
    if (!this.isAlive || this.isClosed) return;
    const _0x1ee5fc = Math.max(0x10, Math.floor(_0x208865 + this.getMoveTickJitter()));
    this.moveInt = setTimeout(() => {
      this.moveInt = null;
      if (!this.isAlive || this.isClosed) return;
      this.move();
      if (!this.moveInt && this.isAlive && !this.isClosed) {
        this.scheduleMoveTimer(this.moveTickMs);
      }
    }, _0x1ee5fc);
    if (typeof this.moveInt?.unref === "function") {
      this.moveInt.unref();
    }
  }
  refreshMoveInterval(_0x3e36ae = this.lastMassValue) {
    if (!this.isAlive) return;
    const _0x1a1d5c = this.getDesiredMoveInterval(_0x3e36ae);
    if (this.moveInt && this.moveTickMs === _0x1a1d5c) return;
    this.moveInt && clearTimeout(this.moveInt);
    ((this.moveTickMs = _0x1a1d5c),
      this.scheduleMoveTimer(_0x1a1d5c));
  }
  getActionContext() {
    const _0x1cb75c = this.ownCells,
      _0x5d99de = _0x1cb75c.length;
    if (!this.isAlive || _0x5d99de === 0x0) return null;
    let _0x188552 = 0x0,
      _0x3fc062 = 0x0,
      _0x3a7a36 = 0x0,
      _0x4f50fc = 0x0;
    for (const { x: _0x414e78, y: _0x23b81b, size: _0x4d54a0 } of _0x1cb75c) {
      ((_0x188552 += _0x414e78),
        (_0x3fc062 += _0x23b81b),
        (_0x3a7a36 += _0x4d54a0),
        (_0x4f50fc = Math.max(_0x4f50fc, _0x4d54a0)));
    }
    const _0x363a3d = _0x188552 / _0x5d99de,
      _0x2b4838 = _0x3fc062 / _0x5d99de,
      _0x2c0057 = _0x3a7a36 / _0x5d99de,
      _0x5a7f09 = this.usesDirectOwnerCoords(),
      _0x3dcb91 = _0x5a7f09 ? 0x1 : this.rX || 0x1,
      _0x570ba0 = _0x5a7f09 ? 0x1 : this.rY || 0x1,
      _0x5567d2 =
        Number.isFinite(this.client.userX) && Number.isFinite(this.client.userY)
          ? {
              x: this.client.userX / _0x3dcb91 + this.offsetX,
              y: this.client.userY / _0x570ba0 + this.offsetY,
            }
          : null,
      _0x3de61f =
        Number.isFinite(this.client.ownerX) && Number.isFinite(this.client.ownerY)
          ? {
              x: this.client.ownerX / _0x3dcb91 + this.offsetX,
              y: this.client.ownerY / _0x570ba0 + this.offsetY,
              radius: Number.isFinite(this.client.ownerRadius)
                ? Math.max(0x0, this.client.ownerRadius)
                : 0x0,
            }
          : null;
    return {
      centerX: _0x363a3d,
      centerY: _0x2b4838,
      avgSize: _0x2c0057,
      maxSize: _0x4f50fc,
      cursor: _0x5567d2,
      owner: _0x3de61f,
    };
  }
  isWithinOwnerActionRadius() {
    const _0x12ba96 = this.getActionContext();
    if (!_0x12ba96) return ![];
    const {
      centerX: _0x119621,
      centerY: _0x46025b,
      avgSize: _0x19750f,
      maxSize: _0x4d1190,
      cursor: _0x4bb316,
      owner: _0x3e1738,
    } = _0x12ba96;
    if (!_0x4bb316 && !_0x3e1738) return this.isNearMouse;
    const _0x31aa70 = Math.max(
        0x4b0,
        (_0x3e1738?.radius || 0x0) * 1.85 + _0x4d1190 * 0x4 + _0x19750f * 0x2,
      ),
      _0x4837bd = _0x31aa70 * _0x31aa70,
      _0x4c0b79 = (_0x3dab65) =>
        !!_0x3dab65 &&
        (_0x3dab65.x - _0x119621) * (_0x3dab65.x - _0x119621) +
          (_0x3dab65.y - _0x46025b) * (_0x3dab65.y - _0x46025b) <=
          _0x4837bd;
    return _0x4c0b79(_0x4bb316) || _0x4c0b79(_0x3e1738);
  }
  getSearchTarget(_0x20ee83, _0x1e519e) {
    const _0x2cf885 =
        this.borderX > 0x0 || this.borderY > 0x0
          ? Math.max(0x1c2, Math.min(Math.max(this.borderX, this.borderY) / 0x8, 0x4b0))
          : 0x384,
      _0x11cc72 = this.t + Date.now() / 0x28a;
    return {
      x: _0x20ee83 + Math.cos(_0x11cc72) * _0x2cf885,
      y: _0x1e519e + Math.sin(_0x11cc72) * _0x2cf885,
    };
  }
  isLockMassReady(_0x34a6b2, _0x4ce428 = 0x19a) {
    return Number.isFinite(_0x34a6b2) && _0x34a6b2 >= _0x4ce428;
  }
  getLockTerritoryTarget(_0x49a81b, _0x2c5412, _0x50a4f5, _0x500af7 = ![], _0x5ddcd9 = 0x0) {
    const _0x5e08cb = 0x8,
      _0x34fcd8 = Math.floor(this.orbitSlot / _0x5e08cb),
      _0x5a22ae = this.orbitSlot % _0x5e08cb,
      _0x111b7b =
        (_0x5a22ae / _0x5e08cb) * Math.PI * 0x2 +
        _0x50a4f5 / (_0x500af7 ? 0x960 : 0xb54) +
        (_0x34fcd8 % 0x2 === 0x0 ? 0x0 : Math.PI / _0x5e08cb),
      _0x1553f1 =
        (_0x500af7 ? 0x190 : 0xe6) +
        _0x34fcd8 * 0x34 +
        Math.max(0x0, Math.min(0x170, _0x5ddcd9 * 0.8));
    return {
      x: _0x49a81b + Math.cos(_0x111b7b) * _0x1553f1,
      y: _0x2c5412 + Math.sin(_0x111b7b) * _0x1553f1,
    };
  }
  getLockDanceTarget(_0x57b8e7, _0x4a9330, _0x5f223a, _0x4b205b, _0x184bd9, _0x45cc78 = ![], _0x2d1d15 = 0x0) {
    const _0x5eb575 = _0x184bd9 + this.orbitSlot * 0x97 + Math.floor(this.t * 0x320),
      _0x102049 = Math.floor(_0x5eb575 / (_0x45cc78 ? 0x48 : 0x5c)),
      _0x239372 = _0x102049 % 0x2 === 0x0 ? -0x1 : 0x1,
      _0x2b45c9 = _0x102049 % 0x4 < 0x2 ? 0x1 : -0x1,
      _0x2dfe87 =
        (_0x45cc78 ? 0x280 : 0x1b8) +
        Math.max(0x0, Math.min(0x280, _0x2d1d15 * (_0x45cc78 ? 1.08 : 0.9))),
      _0x1d10a3 = _0x5eb575 / (_0x45cc78 ? 0x3c : 0x50),
      _0x3bb169 =
        _0x239372 * _0x2dfe87 +
        Math.sin(_0x1d10a3 * 1.67) * (_0x45cc78 ? 0xa4 : 0x58),
      _0x576fc8 =
        _0x2b45c9 * (_0x2dfe87 * 0.46) +
        Math.cos(_0x1d10a3 * 1.21) * (_0x45cc78 ? 0xbc : 0x64) +
        (_0x102049 % 0x6 >= 0x4 ? _0x239372 * (_0x2dfe87 * 0.3) : 0x0),
      _0x58938f = _0x45cc78 ? 0.04 : 0.12;
    return {
      x: _0x57b8e7 * (1 - _0x58938f) + _0x5f223a * _0x58938f + _0x3bb169,
      y: _0x4a9330 * (1 - _0x58938f) + _0x4b205b * _0x58938f + _0x576fc8,
    };
  }
  getOrbitTarget(
    _0x1fbfab,
    _0x36f2cc,
    _0x35755e,
    _0x218d1b,
    _0x136aa7,
  ) {
    if (!Number.isFinite(_0x1fbfab) || !Number.isFinite(_0x36f2cc))
      return { x: _0x218d1b, y: _0x136aa7 };
    const _0x26ed74 = 0xa,
      _0x207b3c = Math.max(0x1e, Math.min(0x58, Math.round(_0x35755e * 0.82))),
      _0x12191d = Math.max(
        Math.round(_0x35755e * 2.35),
        Math.round(_0x218d1b + _0x35755e * 1.7 + 0x20),
      ),
      _0x32da0f = Math.floor(this.orbitSlot / _0x26ed74),
      _0x3f8e9f = this.orbitSlot % _0x26ed74,
      _0x14652e = _0x12191d + _0x32da0f * _0x207b3c,
      _0x4c1c0c = Date.now() / (0x7d0 + _0x32da0f * 0x96),
      _0x42284b =
        (_0x3f8e9f / _0x26ed74) * Math.PI * 0x2 +
        _0x4c1c0c +
        (_0x32da0f % 0x2 === 0x0 ? 0x0 : Math.PI / _0x26ed74),
      _0x27f504 = _0x218d1b - _0x1fbfab,
      _0x33870c = _0x136aa7 - _0x36f2cc,
      _0x3f8249 = Math.hypot(_0x27f504, _0x33870c),
      _0x1a9bf8 =
        _0x3f8249 > 0x1
          ? Math.atan2(_0x33870c, _0x27f504)
          : _0x42284b,
      _0x49408c = Math.atan2(
        Math.sin(_0x42284b - _0x1a9bf8),
        Math.cos(_0x42284b - _0x1a9bf8),
      ),
      _0x2fba13 =
        _0x3f8249 > _0x14652e * 1.35
          ? _0x42284b
          : _0x1a9bf8 + _0x49408c * 0.26,
      _0x16b202 =
        _0x3f8249 < _0x14652e * 0.88
          ? _0x14652e + (_0x14652e - _0x3f8249) * 0.75
          : _0x14652e,
      _0x234738 = _0x1fbfab + Math.cos(_0x2fba13) * _0x16b202,
      _0x544633 = _0x36f2cc + Math.sin(_0x2fba13) * _0x16b202;
    return {
      x: _0x234738,
      y: _0x544633,
    };
  }
  findDeltaSplitTarget(_0x4434a4, _0x13518b, _0x3f722f) {
    if (
      !Number.isFinite(_0x4434a4) ||
      !Number.isFinite(_0x13518b) ||
      !Number.isFinite(_0x3f722f) ||
      _0x3f722f <= 0x0
    )
      return null;
    let _0x375d1c = null,
      _0x2c687e = Infinity;
    const _0x5a1d33 = Date.now();
    for (const _0x41bc57 in this.playerCells) {
      const _0x33ff76 = this.playerCells[_0x41bc57];
      if (
        !_0x33ff76 ||
        _0x33ff76.isMine ||
        _0x33ff76.isFriend ||
        _0x33ff76.isVirus ||
        _0x33ff76.isFood ||
        _0x33ff76.agitated
      )
        continue;
      if (this.client.isPlayerName(_0x33ff76.name) && this.client.isAlive)
        continue;
      if (this.client.isKnownBotName(_0x33ff76.name)) continue;
      const _0x2b6aaf = Number(_0x33ff76.size);
      if (!Number.isFinite(_0x2b6aaf) || _0x2b6aaf <= 0x0) continue;
      const _0x3c1f0d = helper.size2mass(_0x2b6aaf);
      if (_0x3c1f0d <= 0x12) continue;
      if (_0x2b6aaf >= _0x3f722f * 0.95) continue;
      const _0x2f81e0 = this.getDeltaTargetPoint(_0x33ff76, _0x5a1d33),
        _0x30be5b = _0x2f81e0.x - _0x4434a4,
        _0x517893 = _0x2f81e0.y - _0x13518b,
        _0x27f9ac = _0x30be5b * _0x30be5b + _0x517893 * _0x517893;
      if (_0x27f9ac < _0x2c687e)
        ((_0x375d1c = {
          cell: _0x33ff76,
          aimX: _0x2f81e0.x,
          aimY: _0x2f81e0.y,
          distance: Math.sqrt(_0x27f9ac),
          mass: _0x3c1f0d,
        }),
        (_0x2c687e = _0x27f9ac));
    }
    if (!_0x375d1c) return null;
    return _0x375d1c;
  }
  performDeltaSplit(_0x212b29, _0x4c0e63, _0x226642) {
    ((this.lastMoveX = _0x212b29),
      (this.lastMoveY = _0x4c0e63),
      (this.lastMoveAt = _0x226642),
      this.send(buffers.moveTo(_0x212b29, _0x4c0e63, this.decryptionKey), !![]),
      this.send(buffers.split(), !![]),
      (this.lastDeltaSplitAt = _0x226642),
      (this.deltaSplitLockUntil = _0x226642 + 0x3e8));
  }
  canDeltaSplitAttack(_0x1fb7be, _0x1d6a32, _0x1b7f3c, _0x1e1b3d, _0x56ec33 = null) {
    if (
      !_0x1fb7be ||
      !_0x1fb7be.cell ||
      !Number.isFinite(_0x1d6a32) ||
      !Number.isFinite(_0x1b7f3c) ||
      !Number.isFinite(_0x1e1b3d) ||
      _0x1d6a32 >= 0x10 ||
      _0x1b7f3c <= 0x0 ||
      !Number.isFinite(_0x1fb7be.distance)
    )
      return ![];
    if (_0x1e1b3d < this.deltaSplitLockUntil) return ![];
    if (_0x56ec33 && Array.isArray(_0x56ec33.threats) && _0x56ec33.threats.length > 0x0)
      return ![];
    if (
      _0x56ec33 &&
      _0x56ec33.virus &&
      Number.isFinite(_0x56ec33.virusDistance) &&
      _0x56ec33.virusDistance < Math.max(0x258, _0x1b7f3c * 0x10)
    )
      return ![];
    const _0x41f1fe = Number(_0x1fb7be.cell.size),
      _0x1d7f2a = Number(_0x1fb7be.mass);
    if (!Number.isFinite(_0x41f1fe) || _0x41f1fe <= 0x0) return ![];
    if (!Number.isFinite(_0x1d7f2a) || _0x1d7f2a <= 0x12) return ![];
    if (_0x1b7f3c < _0x41f1fe * 1.45) return ![];
    const _0x4699d4 = _0x1e1b3d - this.lastDeltaSplitAt;
    const _0x42fe75 = Math.max(0x140, Math.min(0x280, 0x120 + _0x1d6a32 * 0x14));
    if (_0x4699d4 < _0x42fe75) return ![];
    const _0x3f8af0 = Math.max(0x130, _0x1b7f3c * 2.4, _0x41f1fe * 4.5);
    return _0x1fb7be.distance <= _0x3f8af0;
  }
  getDeltaTargetPoint(_0x11aaf2, _0x13f2c0 = Date.now()) {
    if (!_0x11aaf2) return { x: Number.NaN, y: Number.NaN };
    const _0x2b4d20 = Number(_0x11aaf2.x),
      _0x3e7450 = Number(_0x11aaf2.y);
    if (!Number.isFinite(_0x2b4d20) || !Number.isFinite(_0x3e7450))
      return { x: Number.NaN, y: Number.NaN };
    const _0x4db5fd = Number(_0x11aaf2.prevX),
      _0x27b4e4 = Number(_0x11aaf2.prevY),
      _0x1ca6c1 = Number(_0x11aaf2.lastSeenAt);
    if (
      !Number.isFinite(_0x4db5fd) ||
      !Number.isFinite(_0x27b4e4) ||
      !Number.isFinite(_0x1ca6c1) ||
      _0x1ca6c1 <= 0x0
    )
      return { x: _0x2b4d20, y: _0x3e7450 };
    const _0x1c1f59 = Math.max(0x10, _0x13f2c0 - _0x1ca6c1),
      _0x31d0a5 = _0x2b4d20 - _0x4db5fd,
      _0x3e4c61 = _0x3e7450 - _0x27b4e4,
      _0x408d83 = Math.hypot(_0x31d0a5, _0x3e4c61);
    if (_0x408d83 < 0x1) return { x: _0x2b4d20, y: _0x3e7450 };
    const _0x12d0d2 = Math.max(
        1.1,
        Math.min(3, _0x1c1f59 / 0x2d + _0x408d83 / 0x78),
      );
    return {
      x: _0x2b4d20 + _0x31d0a5 * _0x12d0d2,
      y: _0x3e7450 + _0x3e4c61 * _0x12d0d2,
    };
  }
  getDeltaChasePoint(_0x2fcbf5, _0x3b9d7a, _0x3f6a63, _0x56ec33) {
    if (!Number.isFinite(_0x2fcbf5) || !Number.isFinite(_0x3b9d7a))
      return { x: _0x2fcbf5, y: _0x3b9d7a };
    const _0x4b0d1d =
        _0x3f6a63 &&
        Array.isArray(_0x3f6a63.threats) &&
        _0x3f6a63.threats.length > 0x0,
      _0x4ab7f2 =
        _0x3f6a63 &&
        _0x3f6a63.virus &&
        Number.isFinite(_0x3f6a63.virusDistance) &&
        _0x3f6a63.virusDistance < Math.max(0x258, _0x56ec33 * 0x10);
    if (!_0x4b0d1d && !_0x4ab7f2) return { x: _0x2fcbf5, y: _0x3b9d7a };
    const _0x1c0d1a = Number(_0x3f6a63?.followX),
      _0x31f7b2 = Number(_0x3f6a63?.followY);
    if (!Number.isFinite(_0x1c0d1a) || !Number.isFinite(_0x31f7b2))
      return { x: _0x2fcbf5, y: _0x3b9d7a };
    const _0x21b2a8 = _0x4ab7f2 ? 0.7 : 0.45;
    return {
      x: _0x2fcbf5 + (_0x1c0d1a - _0x2fcbf5) * _0x21b2a8,
      y: _0x3b9d7a + (_0x31f7b2 - _0x3b9d7a) * _0x21b2a8,
    };
  }
  applyOrientationCandidate(_0x4f2f29, _0x3f8854) {
    const _0x4f93ab = _0x4f2f29 + ":" + _0x3f8854;
    if (this.orientationReady && this.rX === _0x4f2f29 && this.rY === _0x3f8854) {
      this.orientationCandidateKey = _0x4f93ab;
      this.orientationCandidateHits = 0x0;
      return;
    }
    if (this.orientationCandidateKey !== _0x4f93ab) {
      this.orientationCandidateKey = _0x4f93ab;
      this.orientationCandidateHits = 0x1;
    } else this.orientationCandidateHits += 0x1;
    const _0x218bfe = this.orientationReady ? 0x3 : 0x2;
    if (this.orientationCandidateHits < _0x218bfe) return;
    ((this.rX = _0x4f2f29),
      (this.rY = _0x3f8854),
      (this.orientationReady = !![]),
      (this.orientationCandidateKey = _0x4f93ab),
      (this.orientationCandidateHits = 0x0));
  }
  scanEnvironment(_0x4434a4, _0x13518b, _0x3f722f, _0x5b9961 = !![], _0x4ce0d0 = ![]) {
    const _0x34a777 = 0x7d0,
      _0x4d1f3a = this.usesDirectOwnerCoords(),
      _0x2e8ef7 =
        Number.isFinite(this.client.userX) &&
        Number.isFinite(this.client.userY),
      _0x5d3c22 = _0x5b9961 && _0x2e8ef7,
      _0x2fcd87 = _0x4d1f3a ? 0x1 : this.rX || 0x1,
      _0x4d4f3e = _0x4d1f3a ? 0x1 : this.rY || 0x1,
      _0x55ca12 = _0x5d3c22 ? this.client.userX / _0x2fcd87 - _0x4434a4 : 0x0,
      _0x526867 = _0x5d3c22 ? this.client.userY / _0x4d4f3e - _0x13518b : 0x0,
      _0x290290 = _0x5d3c22
        ? 0x1 + (_0x55ca12 * _0x55ca12 + _0x526867 * _0x526867) ** 0.5
        : 0x1;
    let _0x22ab6d = _0x5d3c22 ? _0x55ca12 / _0x290290 : 0x0,
      _0x48890e = _0x5d3c22 ? _0x526867 / _0x290290 : 0x0;
    const _0x2dd0dc = helper.size2mass(_0x3f722f),
      _0x3de9e6 = _0x2dd0dc <= 0x7d0,
      _0x1dfafd = [],
      _0x1dd1f1 = [];
    const _0x1b3c6f = this.client.botDeltaAi || _0x3de9e6 || _0x4ce0d0;
    let _0x369c8d = ![];
    let _0x3918a1 = null,
      _0x443b73 = Infinity;
    for (const _0x27efc0 in this.playerCells) {
      const _0x33ff76 = this.playerCells[_0x27efc0];
      if (!_0x33ff76 || _0x33ff76.isMine) continue;
      if (
        !_0x33ff76.isFriend &&
        !_0x33ff76.isVirus &&
        _0x33ff76.isFood &&
        !_0x33ff76.agitated
      ) {
        const _0x28eed0 = _0x33ff76.x - _0x4434a4,
          _0x41f51e = _0x33ff76.y - _0x13518b,
          _0x2c687e = _0x28eed0 * _0x28eed0 + _0x41f51e * _0x41f51e;
        _0x1dd1f1.push({
          entity: _0x33ff76,
          distanceSq: _0x2c687e,
        });
        continue;
      }
      if (
        !_0x33ff76.isFriend &&
        _0x33ff76.isVirus &&
        !_0x33ff76.isFood &&
        !_0x33ff76.agitated
      ) {
        const _0x39f78c = _0x33ff76.x - _0x4434a4,
          _0x4fd747 = _0x33ff76.y - _0x13518b,
          _0x20f646 = _0x39f78c * _0x39f78c + _0x4fd747 * _0x4fd747;
        _0x20f646 < _0x443b73 &&
          ((_0x3918a1 = _0x33ff76), (_0x443b73 = _0x20f646));
        if (_0x4ce0d0) {
          const _0x3cdc71 = Math.max(0x1, Math.hypot(_0x39f78c, _0x4fd747)),
            _0x344707 = Math.max(0x8c, Math.min(0x168, _0x3f722f * 3.4 + _0x33ff76.size * 0.45));
          if (_0x3cdc71 < _0x344707) {
            const _0x5de6c9 = ((_0x344707 - _0x3cdc71) / _0x344707) * 0x9;
            ((_0x22ab6d -= (_0x39f78c / _0x3cdc71) * _0x5de6c9),
              (_0x48890e -= (_0x4fd747 / _0x3cdc71) * _0x5de6c9),
              (_0x369c8d = !![]));
          }
        }
        continue;
      }
      if (!_0x1b3c6f) continue;
      if (_0x33ff76.isFood) continue;
      if (_0x33ff76.isVirus) continue;
      if (_0x33ff76.isFriend) continue;
      if (this.client.isPlayerName(_0x33ff76.name) && this.client.isAlive)
        continue;
      if (this.client.isKnownBotName(_0x33ff76.name)) continue;
      const _0x30be5b = _0x33ff76.x - _0x4434a4,
        _0x517893 = _0x33ff76.y - _0x13518b;
      if (_0x33ff76.size <= _0x3f722f * 0.85) continue;
      const _0x3fbf8c =
          Math.hypot(_0x30be5b, _0x517893) - _0x3f722f - _0x33ff76.size,
        _0x2007d4 = helper.size2mass(_0x33ff76.size) / _0x2dd0dc;
      if (_0x3fbf8c >= 0x96) continue;
      _0x1dfafd.push({
        x: _0x33ff76.x,
        y: _0x33ff76.y,
        dx: _0x30be5b,
        dy: _0x517893,
        distance: Math.max(_0x3fbf8c, 0x1),
        sizeRatio: _0x2007d4,
      });
    }
    let _0x3c0d55 = _0x5d3c22
        ? this.client.userX / _0x2fcd87 + this.offsetX
        : _0x4434a4,
      _0x1db60b = _0x5d3c22
        ? this.client.userY / _0x4d4f3e + this.offsetY
        : _0x13518b;
    if (_0x1dfafd.length !== 0x0 || _0x369c8d) {
      for (const {
        dx: _0x5d9501,
        dy: _0x2b1ef8,
        distance: _0x242904,
        sizeRatio: _0xf593ca,
      } of _0x1dfafd) {
        const _0xdb1050 = -0xa * _0xf593ca;
        ((_0x22ab6d += ((_0x5d9501 / _0x242904) * _0xdb1050) / _0x242904),
          (_0x48890e += ((_0x2b1ef8 / _0x242904) * _0xdb1050) / _0x242904));
      }
      const _0x4101fc = 0x1 + Math.hypot(_0x22ab6d, _0x48890e);
      ((_0x3c0d55 = _0x4434a4 + (_0x22ab6d / _0x4101fc) * _0x34a777),
        (_0x1db60b = _0x13518b + (_0x48890e / _0x4101fc) * _0x34a777));
    }
    let _0x375d1c = null,
      _0x2c687e = Infinity;
    for (const _0x4bfd31 of _0x1dd1f1) {
      let _0x290966 = ![];
      for (const _0x49351f of _0x1dfafd) {
        const _0x1d6796 = _0x49351f.x - _0x4bfd31.entity.x,
          _0x1b7a7c = _0x49351f.y - _0x4bfd31.entity.y;
        if (_0x1d6796 * _0x1d6796 + _0x1b7a7c * _0x1b7a7c < 0xf4240) {
          _0x290966 = !![];
          break;
        }
      }
      if (_0x290966) continue;
      if (
        _0x4ce0d0 &&
        _0x3918a1 &&
        (_0x3918a1.x - _0x4bfd31.entity.x) * (_0x3918a1.x - _0x4bfd31.entity.x) +
          (_0x3918a1.y - _0x4bfd31.entity.y) * (_0x3918a1.y - _0x4bfd31.entity.y) <
          0x11170
      )
        continue;
      _0x4bfd31.distanceSq < _0x2c687e &&
        ((_0x375d1c = _0x4bfd31.entity), (_0x2c687e = _0x4bfd31.distanceSq));
    }
    return {
      ownerX: _0x2e8ef7
        ? this.client.ownerX / _0x2fcd87 + this.offsetX
        : Number.NaN,
      ownerY: _0x2e8ef7
        ? this.client.ownerY / _0x4d4f3e + this.offsetY
        : Number.NaN,
      ownerRadius: Number.isFinite(this.client.ownerRadius) ? this.client.ownerRadius : 0,
      followX: _0x3c0d55,
      followY: _0x1db60b,
      threats: _0x1dfafd,
      threatCount: _0x1dfafd.length,
      food: _0x375d1c,
      virus: _0x3918a1,
      virusDistance: Math.sqrt(_0x443b73),
    };
  }
  move(_0x2e6a4f = ![]) {
    const _0x2fb0d6 = Number(this.client.followMassGoal),
      _0x1374b0 = Number.isFinite(_0x2fb0d6) ? _0x2fb0d6 : 0x32,
      _0x5ee2d7 = Number(this.client.lockTargetMass),
      _0x1b8eb6 = Number.isFinite(_0x5ee2d7) ? Math.max(0x32, Math.round(_0x5ee2d7)) : 0x19a,
      _0x36a9c6 = {
        x: 0x0,
        y: 0x0,
        size: 0x0,
        maxSize: 0x0,
        mass: 0x0,
      },
      _0x574a10 = this.ownCells,
      _0x2cda3a = _0x574a10.length;
    if (!this.isAlive || _0x2cda3a === 0x0) return;
    for (const { x: _0x30d437, y: _0x26e4ca, size: _0x13a859 } of _0x574a10) {
      ((_0x36a9c6.x += _0x30d437),
        (_0x36a9c6.y += _0x26e4ca),
        (_0x36a9c6.size += _0x13a859),
        (_0x36a9c6.maxSize = Math.max(_0x36a9c6.maxSize, _0x13a859)),
        (_0x36a9c6.mass += helper.size2mass(_0x13a859)));
    }
    ((_0x36a9c6.x /= _0x2cda3a), (_0x36a9c6.y /= _0x2cda3a));
    const _0x31dbec = Date.now(),
      _0x226642 = _0x31dbec;
    if (Number.isFinite(this.lastCenterX) && Number.isFinite(this.lastCenterY)) {
      const _0x3245d4 = _0x36a9c6.x - this.lastCenterX,
        _0x5ad855 = _0x36a9c6.y - this.lastCenterY,
        _0x3db306 =
          this.borderX > 0x0 || this.borderY > 0x0
            ? Math.max(0x5dc, Math.min(Math.max(this.borderX, this.borderY) / 0x6, 0x1770))
            : 0x5dc;
      if (
        this.preStartFollowBypass &&
        !this.followMassUnlocked &&
        _0x3245d4 * _0x3245d4 + _0x5ad855 * _0x5ad855 >
          _0x3db306 * _0x3db306
      ) {
        ((this.preStartFollowBypass = ![]),
          (this.arenaStarted = !![]),
          (this.lastMassGainAt = _0x31dbec),
          (this.spawnedAt = 0x0));
      }
    }
    ((this.lastCenterX = _0x36a9c6.x), (this.lastCenterY = _0x36a9c6.y));
    (!this.lastMassGainAt ||
      _0x36a9c6.mass > this.lastMassValue + 0.5) &&
      (this.lastMassGainAt = _0x31dbec);
    this.lastMassValue = _0x36a9c6.mass;
    _0x36a9c6.mass >= _0x1374b0 && (this.followMassUnlocked = !![]);
    this.preStartFollowBypass =
      !this.followMassUnlocked &&
      this.shouldSkipFollowMassGate(_0x36a9c6.mass, _0x36a9c6.x, _0x36a9c6.y);
    const _0x459f66 = this.isFastMoveMode(_0x36a9c6.mass);
    const _0x33d727 = !!this.client.botLock;
    const _0x4d7c7f = !!this.client.botDeltaAi;
    const _0x58c1f8 = this.isLockMassReady(_0x36a9c6.mass, _0x1b8eb6);
    this.refreshMoveInterval(_0x36a9c6.mass);
    const _0x5b5e9c =
        !this.followMouse ||
        this.client.botAi ||
        this.client.botVShield ||
        _0x4d7c7f ||
        this.followMassUnlocked ||
        this.preStartFollowBypass,
      _0x1db065 = this.scanEnvironment(
        _0x36a9c6.x,
        _0x36a9c6.y,
        _0x36a9c6.size,
        _0x33d727 ? ![] : !_0x4d7c7f && _0x5b5e9c,
        _0x33d727,
      ),
      _0x27dfe4 =
        _0x4d7c7f && _0x2cda3a < 0x10
          ? this.findDeltaSplitTarget(
              _0x36a9c6.x,
              _0x36a9c6.y,
              _0x36a9c6.maxSize || _0x36a9c6.size,
            )
          : null,
      _0x2a1c57 = _0x27dfe4
        ? this.getDeltaChasePoint(
            _0x27dfe4.aimX,
            _0x27dfe4.aimY,
            _0x1db065,
            _0x36a9c6.size,
          )
        : null,
      _0x30530f = helper.calculateDistance(
        _0x36a9c6.x,
        _0x36a9c6.y,
        this.client.userX / this.rX,
        this.client.userY / this.rY,
      );
    let _0x3acbaf = _0x1db065.followX,
      _0x117a9e = _0x1db065.followY;
    this.isNearMouse =
      _0x30530f < 0xfa0 + helper.size2mass(_0x36a9c6.size) * 0.5;
    !this.client.isAlive &&
      ((_0x3acbaf = _0x1db065.followX), (_0x117a9e = _0x1db065.followY));
    if (_0x4d7c7f) {
      if (
        _0x27dfe4 &&
        this.canDeltaSplitAttack(
          _0x27dfe4,
          _0x2cda3a,
          _0x36a9c6.maxSize || _0x36a9c6.size,
          _0x226642,
          _0x1db065,
        )
      ) {
        this.performDeltaSplit(_0x2a1c57?.x ?? _0x27dfe4.aimX, _0x2a1c57?.y ?? _0x27dfe4.aimY, _0x226642);
        return;
      } else if (_0x27dfe4) {
        (_0x3acbaf = _0x2a1c57?.x ?? _0x27dfe4.aimX), (_0x117a9e = _0x2a1c57?.y ?? _0x27dfe4.aimY);
      } else if (_0x2cda3a >= 0x10 && _0x1db065.virus) {
        (_0x3acbaf = _0x1db065.virus.x), (_0x117a9e = _0x1db065.virus.y);
      } else if (this.client.botVShield && _0x1db065.virus) {
        (_0x3acbaf = _0x1db065.virus.x), (_0x117a9e = _0x1db065.virus.y);
      } else {
        if (_0x1db065.food)
          ((_0x3acbaf = _0x1db065.food.x), (_0x117a9e = _0x1db065.food.y));
        else if (_0x1db065.virus)
          ((_0x3acbaf = _0x1db065.virus.x), (_0x117a9e = _0x1db065.virus.y));
        else {
          const _0x443f09 = this.getSearchTarget(_0x36a9c6.x, _0x36a9c6.y);
          ((_0x3acbaf = _0x443f09.x), (_0x117a9e = _0x443f09.y));
        }
      }
    } else if (_0x33d727 && this.followMouse) {
      const _0x559ebe = _0x36a9c6.maxSize || _0x36a9c6.size,
        _0x40ad55 =
          _0x1db065.threatCount > 0x0 || _0x1db065.virusDistance < 0x15e ? 0.88 : 0.58,
        _0x4d223f = this.getSearchTarget(_0x36a9c6.x, _0x36a9c6.y),
        _0x4b4253 =
          (Number.isFinite(_0x1db065.followX) &&
            Number.isFinite(_0x1db065.followY) &&
            (_0x1db065.threatCount > 0x0 || _0x1db065.virusDistance < 0x15e))
            ? {
                x: _0x36a9c6.x + (_0x1db065.followX - _0x36a9c6.x) * _0x40ad55,
                y: _0x36a9c6.y + (_0x1db065.followY - _0x36a9c6.y) * _0x40ad55,
              }
            : _0x4d223f;
      if (_0x58c1f8) {
        const _0x3bcb88 = this.getLockTerritoryTarget(
            _0x4b4253.x,
            _0x4b4253.y,
            _0x226642,
            !![],
            _0x559ebe,
          ),
          _0x24ab13 = this.getLockDanceTarget(
            _0x3bcb88.x,
            _0x3bcb88.y,
            _0x36a9c6.x,
            _0x36a9c6.y,
            _0x226642,
            !![],
            _0x559ebe,
          );
        ((_0x3acbaf = _0x24ab13.x), (_0x117a9e = _0x24ab13.y));
      } else if (_0x1db065.food) {
        const _0x1d512a =
          _0x1db065.threatCount > 0x0 || _0x1db065.virusDistance < Math.max(0x118, _0x559ebe * 4.6)
            ? 0.94
            : 0.985;
        ((_0x3acbaf = _0x1db065.food.x * _0x1d512a + _0x4b4253.x * (1 - _0x1d512a)),
          (_0x117a9e = _0x1db065.food.y * _0x1d512a + _0x4b4253.y * (1 - _0x1d512a)));
      } else {
        ((_0x3acbaf = _0x4b4253.x), (_0x117a9e = _0x4b4253.y));
      }
    } else if (this.followMouse) {
      const _0x9a7ee3 = this.client.botAi,
        _0x1b4f90 = this.client.botVShield,
        _0x13bec0 =
          this.client.botOrbit &&
          !_0x9a7ee3 &&
          !_0x1b4f90 &&
          Number.isFinite(_0x1db065.ownerX) &&
          Number.isFinite(_0x1db065.ownerY) &&
          _0x1db065.ownerRadius > 0;
      if (_0x9a7ee3 && _0x1b4f90) {
        if (_0x1db065.virus)
          ((_0x3acbaf = _0x1db065.virus.x), (_0x117a9e = _0x1db065.virus.y));
        else
          _0x1db065.food &&
            ((_0x3acbaf = _0x1db065.food.x), (_0x117a9e = _0x1db065.food.y));
      } else {
        if (!_0x9a7ee3 && _0x1b4f90)
          _0x1db065.virus &&
            _0x1db065.virusDistance < 0x2710 &&
            ((_0x3acbaf = _0x1db065.virus.x),
            (_0x117a9e = _0x1db065.virus.y));
        else
          if (_0x9a7ee3 && !_0x1b4f90)
            _0x1db065.food &&
              ((_0x3acbaf = _0x1db065.food.x), (_0x117a9e = _0x1db065.food.y));
          else if (_0x13bec0) {
            const _0x3fe37f = this.getOrbitTarget(
              _0x1db065.ownerX,
              _0x1db065.ownerY,
              _0x36a9c6.size,
              _0x1db065.ownerRadius,
              _0x36a9c6.x,
              _0x36a9c6.y,
            );
            ((_0x3acbaf = _0x3fe37f.x), (_0x117a9e = _0x3fe37f.y));
          }
          else if (!_0x5b5e9c)
            if (_0x1db065.food)
              ((_0x3acbaf = _0x1db065.food.x), (_0x117a9e = _0x1db065.food.y));
            else {
              const _0x443f09 = this.getSearchTarget(_0x36a9c6.x, _0x36a9c6.y);
              ((_0x3acbaf = _0x443f09.x), (_0x117a9e = _0x443f09.y));
            }
      }
    } else
      _0x1db065.food &&
        ((_0x3acbaf = _0x1db065.food.x), (_0x117a9e = _0x1db065.food.y));
    const _0x212b29 = Math.round(_0x3acbaf),
      _0x4c0e63 = Math.round(_0x117a9e);
    if (!_0x2e6a4f && this.lastMoveX !== null && this.lastMoveY !== null) {
      const _0x1d5ee5 = _0x212b29 - this.lastMoveX,
        _0x307f84 = _0x4c0e63 - this.lastMoveY;
      if (
        _0x1d5ee5 * _0x1d5ee5 + _0x307f84 * _0x307f84 <
          (_0x459f66 ? 0x1 : 0x4) &&
        _0x226642 - this.lastMoveAt < (_0x459f66 ? 0x20 : 0x3c)
      )
        return;
    }
    ((this.lastMoveX = _0x212b29),
      (this.lastMoveY = _0x4c0e63),
      (this.lastMoveAt = _0x226642),
      this.send(buffers.moveTo(_0x212b29, _0x4c0e63, this.decryptionKey), !![]));
  }
  stop() {
    ((this.lastMoveX = null),
      (this.lastMoveY = null),
      (this.lastMoveAt = 0x0),
      (this.lastDeltaSplitAt = 0x0),
      (this.deltaSplitLockUntil = 0x0),
      (this.followMassUnlocked = ![]),
      (this.spawnedAt = 0x0),
      (this.lastMassValue = 0x0),
      (this.lastMassGainAt = 0x0),
      (this.preStartFollowBypass = ![]),
      (this.arenaStarted = ![]),
      (this.lastCenterX = Number.NaN),
      (this.lastCenterY = Number.NaN),
      this.clearIntervals(),
      this.clearTimeouts(),
      this.ws?.terminate());
  }
}
