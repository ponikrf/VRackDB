"use strict";
/*
* Copyright © 2023 Boris Bobylev. All rights reserved.
* Licensed under the Apache License, Version 2.0
*/
Object.defineProperty(exports, "__esModule", { value: true });
const buffer_1 = require("buffer");
const POINT_SIZE = 4;
class Int32Storage {
    constructor(points) { this.buffer = buffer_1.Buffer.alloc(points * POINT_SIZE); }
    readBuffer(index) { return this.buffer.readInt32LE(index * POINT_SIZE); }
    writeBuffer(index, value) { this.buffer.writeInt32LE(value & 0xFFFFFFFF, index * POINT_SIZE); }
}
exports.default = Int32Storage;
