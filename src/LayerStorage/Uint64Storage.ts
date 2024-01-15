/*
* Copyright © 2023 Boris Bobylev. All rights reserved.
* Licensed under the Apache License, Version 2.0
*/

import IStorage from "./IStorage";
import { Buffer } from "buffer";

const POINT_SIZE = 8

export default class Uint64Storage implements IStorage  {
    buffer: Buffer;
    constructor (points: number){ this.buffer = Buffer.alloc(points * POINT_SIZE) }
    readBuffer(index: number): number{ return Number(this.buffer.readBigUInt64LE(index * POINT_SIZE)) }
    writeBuffer(index: number, value: number | bigint) { this.buffer.writeBigUInt64LE(BigInt(value), index * POINT_SIZE) }
}