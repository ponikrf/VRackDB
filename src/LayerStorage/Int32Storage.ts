/*
* Copyright © 2023 Boris Bobylev. All rights reserved.
* Licensed under the Apache License, Version 2.0
*/

import IStorage from "./IStorage";
import { Buffer } from "buffer";

const POINT_SIZE = 4

export default class Int32Storage implements IStorage  {
    buffer: Buffer;
    constructor (points: number){ this.buffer = Buffer.alloc(points * POINT_SIZE) }
    readBuffer(index: number){ return this.buffer.readInt32LE(index * POINT_SIZE) }
    writeBuffer(index: number, value: number) { this.buffer.writeInt32LE(value & 0xFFFFFFFF, index * POINT_SIZE) }
}