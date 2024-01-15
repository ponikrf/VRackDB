/*
* Copyright © 2023 Boris Bobylev. All rights reserved.
* Licensed under the Apache License, Version 2.0
*/

import IStorage from "./IStorage";
import { Buffer } from "buffer";

export default class Int8Storage implements IStorage  {
    buffer: Buffer;
    constructor (points: number){ this.buffer = Buffer.alloc(points) }
    readBuffer(index: number){ return this.buffer.readInt8(index) }
    writeBuffer(index: number, value: number){ this.buffer.writeInt8(value & 0xFF, index) }
}