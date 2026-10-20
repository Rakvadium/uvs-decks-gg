/**
 * Minimal ZIP reader/writer for Convex snapshot exports, so the seed tooling needs no new
 * dependency. The writer is deterministic: entries are written in the order given, stored
 * (uncompressed), with a fixed 1980-01-01 timestamp, so identical inputs give identical bytes on
 * any machine. The reader handles what `convex export` produces (deflate, data descriptors, ZIP64).
 */
import { inflateRawSync } from "node:zlib";

export type ZipEntries = Map<string, Buffer>;

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

export function crc32(data: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < data.length; i++) c = CRC_TABLE[(c ^ data[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

const DOS_TIME = 0;
const DOS_DATE = (0 << 9) | (1 << 5) | 1; // 1980-01-01
const UTF8_FLAG = 0x0800;

export function writeZip(entries: Iterable<[string, Buffer]>): Buffer {
  const locals: Buffer[] = [];
  const centrals: Buffer[] = [];
  let offset = 0;
  let count = 0;
  for (const [name, data] of entries) {
    const nameBuf = Buffer.from(name, "utf8");
    const crc = crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(UTF8_FLAG, 6);
    local.writeUInt16LE(0, 8); // stored
    local.writeUInt16LE(DOS_TIME, 10);
    local.writeUInt16LE(DOS_DATE, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28);
    locals.push(local, nameBuf, data);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(UTF8_FLAG, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt16LE(DOS_TIME, 12);
    central.writeUInt16LE(DOS_DATE, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(nameBuf.length, 28);
    central.writeUInt32LE(offset, 42);
    centrals.push(central, nameBuf);

    offset += 30 + nameBuf.length + data.length;
    count++;
  }
  if (offset > 0xffffffff || count > 0xffff) throw new Error("writeZip: archive too large for a non-ZIP64 zip");
  const centralSize = centrals.reduce((n, b) => n + b.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(count, 8);
  end.writeUInt16LE(count, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, ...centrals, end]);
}

function readUInt64LE(buf: Buffer, at: number): number {
  const value = buf.readBigUInt64LE(at);
  if (value > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error("readZip: ZIP64 value too large");
  return Number(value);
}

export function readZip(buf: Buffer): ZipEntries {
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 22 - 0xffff); i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd === -1) throw new Error("readZip: end of central directory not found");
  let count = buf.readUInt16LE(eocd + 10);
  let cdOffset = buf.readUInt32LE(eocd + 16);
  const locator = eocd - 20;
  if (locator >= 0 && buf.readUInt32LE(locator) === 0x07064b50) {
    const zip64End = readUInt64LE(buf, locator + 8);
    if (buf.readUInt32LE(zip64End) !== 0x06064b50) throw new Error("readZip: bad ZIP64 end record");
    count = readUInt64LE(buf, zip64End + 32);
    cdOffset = readUInt64LE(buf, zip64End + 48);
  }

  const entries: ZipEntries = new Map();
  let p = cdOffset;
  for (let n = 0; n < count; n++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error("readZip: bad central directory entry");
    const method = buf.readUInt16LE(p + 10);
    let compSize = buf.readUInt32LE(p + 20);
    let size = buf.readUInt32LE(p + 24);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    let localOffset = buf.readUInt32LE(p + 42);
    const name = buf.toString("utf8", p + 46, p + 46 + nameLen);
    // ZIP64 extended info: only the fields that are 0xFFFFFFFF in the header are present, in order.
    let e = p + 46 + nameLen;
    const extraEnd = e + extraLen;
    while (e + 4 <= extraEnd) {
      const id = buf.readUInt16LE(e);
      const len = buf.readUInt16LE(e + 2);
      if (id === 0x0001) {
        let q = e + 4;
        if (size === 0xffffffff) {
          size = readUInt64LE(buf, q);
          q += 8;
        }
        if (compSize === 0xffffffff) {
          compSize = readUInt64LE(buf, q);
          q += 8;
        }
        if (localOffset === 0xffffffff) localOffset = readUInt64LE(buf, q);
      }
      e += 4 + len;
    }
    p = extraEnd + commentLen;

    if (name.endsWith("/")) continue;
    if (buf.readUInt32LE(localOffset) !== 0x04034b50) throw new Error(`readZip: bad local header for ${name}`);
    const dataStart = localOffset + 30 + buf.readUInt16LE(localOffset + 26) + buf.readUInt16LE(localOffset + 28);
    const raw = buf.subarray(dataStart, dataStart + compSize);
    let data: Buffer;
    if (method === 0) data = Buffer.from(raw);
    else if (method === 8) data = inflateRawSync(raw);
    else throw new Error(`readZip: unsupported compression method ${method} for ${name}`);
    if (data.length !== size) throw new Error(`readZip: size mismatch for ${name}`);
    entries.set(name, data);
  }
  return entries;
}
