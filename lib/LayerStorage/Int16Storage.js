"use strict";
/*
* Copyright © 2023 Boris Bobylev. All rights reserved.
* Licensed under the Apache License, Version 2.0
*/
Object.defineProperty(exports, "__esModule", { value: true });
const buffer_1 = require("buffer");
const POINT_SIZE = 2;
class Int16Storage {
    constructor(points) { this.buffer = buffer_1.Buffer.alloc(points * POINT_SIZE); }
    readBuffer(index) { return this.buffer.readInt16LE(index * POINT_SIZE); }
    writeBuffer(index, value) { this.buffer.writeInt16LE(value & 0xFFFF, index * POINT_SIZE); }
}
exports.default = Int16Storage;
