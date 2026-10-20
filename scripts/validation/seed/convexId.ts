/**
 * Convex document ID codec (the v6 format the backend uses): base32 of
 * `vint(tableNumber) ++ 16-byte internal id ++ footer`, where the footer is a byte-wise Fletcher
 * checksum (sums mod 256) of the preceding bytes, little endian. The seed uses it to read the
 * table number of production card IDs and to mint deterministic IDs for fixture documents.
 */
import { createHash } from "node:crypto";

const ALPHABET = "0123456789abcdefghjkmnpqrstvwxyz";

function base32Encode(bytes: Uint8Array): string {
  let out = "";
  let value = 0;
  let bits = 0;
  for (const byte of bytes) {
    value = ((value << 8) | byte) & 0xffff;
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      out += ALPHABET[(value >> bits) & 31];
    }
  }
  if (bits > 0) out += ALPHABET[(value << (5 - bits)) & 31];
  return out;
}

function base32Decode(text: string): Uint8Array {
  const out: number[] = [];
  let value = 0;
  let bits = 0;
  for (const ch of text) {
    const digit = ALPHABET.indexOf(ch);
    if (digit === -1) throw new Error(`Invalid Convex ID character ${JSON.stringify(ch)}`);
    value = ((value << 5) | digit) & 0xffff;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      out.push((value >> bits) & 0xff);
    }
  }
  return Uint8Array.from(out);
}

function footer(bytes: Uint8Array): [number, number] {
  let s1 = 0;
  let s2 = 0;
  for (const b of bytes) {
    s1 = (s1 + b) & 0xff;
    s2 = (s2 + s1) & 0xff;
  }
  return [s1, s2];
}

function encodeVint(n: number): number[] {
  const out: number[] = [];
  let rest = n;
  do {
    let byte = rest & 0x7f;
    rest >>>= 7;
    if (rest > 0) byte |= 0x80;
    out.push(byte);
  } while (rest > 0);
  return out;
}

export function encodeConvexId(tableNumber: number, internalId: Uint8Array): string {
  if (!Number.isInteger(tableNumber) || tableNumber <= 0 || tableNumber > 0xffffffff) {
    throw new Error(`Invalid table number ${tableNumber}`);
  }
  if (internalId.length !== 16) throw new Error("A Convex internal id is 16 bytes");
  const body = Uint8Array.from([...encodeVint(tableNumber), ...internalId]);
  return base32Encode(Uint8Array.from([...body, ...footer(body)]));
}

export function decodeConvexId(id: string): { tableNumber: number; internalId: Uint8Array } {
  const bytes = base32Decode(id);
  if (bytes.length < 19) throw new Error(`Invalid Convex ID ${id}: too short`);
  const body = bytes.subarray(0, bytes.length - 2);
  const [s1, s2] = footer(body);
  if (bytes[bytes.length - 2] !== s1 || bytes[bytes.length - 1] !== s2) {
    throw new Error(`Invalid Convex ID ${id}: bad checksum`);
  }
  let tableNumber = 0;
  let shift = 0;
  let i = 0;
  for (; ; i++) {
    if (i >= body.length || shift > 28) throw new Error(`Invalid Convex ID ${id}: bad table number`);
    tableNumber += (body[i] & 0x7f) * 2 ** shift;
    shift += 7;
    if ((body[i] & 0x80) === 0) {
      i++;
      break;
    }
  }
  const internalId = body.subarray(i);
  if (internalId.length !== 16) throw new Error(`Invalid Convex ID ${id}: bad length`);
  return { tableNumber, internalId: Uint8Array.from(internalId) };
}

export function isConvexId(value: string): boolean {
  if (value.length < 31 || value.length > 37) return false;
  try {
    decodeConvexId(value);
    return true;
  } catch {
    return false;
  }
}

/** A deterministic ID: the internal id is the first 16 bytes of sha256(`${namespace}:${key}`). */
export function deterministicConvexId(tableNumber: number, namespace: string, key: string): string {
  const digest = createHash("sha256").update(`${namespace}:${key}`).digest();
  return encodeConvexId(tableNumber, digest.subarray(0, 16));
}
