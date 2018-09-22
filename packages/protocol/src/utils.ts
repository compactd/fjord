import { equal } from 'assert';

export function uint8(...val: number[]) {
  return {
    length: val.length,
    write: (buff: Buffer, offset: number) =>
      val.reduce((acc, value) => buff.writeUInt8(value, acc), offset),
  };
}

export function uint16(...val: number[]): BufferPart {
  return {
    length: val.length * 2,
    write: (buff: Buffer, offset: number) =>
      val.reduce((acc, value) => buff.writeUInt16BE(value, acc), offset),
  };
}

export function uint32(...val: number[]) {
  return {
    length: 4 * val.length,
    write: (buff: Buffer, offset: number) =>
      val.reduce((acc, value) => buff.writeUInt32BE(value, acc), offset),
  };
}

export function bufferLength() {
  return {
    length: 4,
    write: (buff: Buffer, offset: number, length: number) =>
      buff.writeUInt32BE(length, offset),
  };
}

export function utf8String(val: string) {
  return {
    length: Buffer.byteLength(val),
    write: (buff: Buffer, offset: number) => buff.write(val, offset) + offset,
  };
}

export function rawBuffer(buff: Buffer) {
  return {
    length: buff.length,
    write: (target: Buffer, offset: number) =>
      buff.copy(target, offset) + offset,
  };
}

export const hexString = (val: string) => rawBuffer(Buffer.from(val, 'hex'));

export interface BufferPart {
  length: number;
  write: (buffer: Buffer, offset: number, length: number) => number;
}

export function build(...values: BufferPart[]) {
  const totalLength = values.reduce((sum, { length }) => sum + length, 0);
  const buffer = Buffer.alloc(totalLength);

  const written = values.reduce((offset, { write }) => {
    const i = write(buffer, offset, totalLength);

    return i;
  }, 0);

  equal(written, totalLength);

  return buffer;
}