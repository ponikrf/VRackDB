/*
* Copyright © 2023 Boris Bobylev. All rights reserved.
* Licensed under the Apache License, Version 2.0
*/

import IStorage from "./IStorage";
import { Buffer } from "buffer";

const POINT_SIZE = 2

export default class Uint16Storage implements IStorage  {
    buffer: Buffer;
    constructor (points: number){ this.buffer = Buffer.alloc(points * POINT_SIZE) }
    readBuffer(index: number){ return this.buffer.readUint16LE(index * POINT_SIZE) }
    writeBuffer(index: number, value: number){ this.buffer.writeUint16LE(value & 0xFFFF, index * POINT_SIZE) }
}