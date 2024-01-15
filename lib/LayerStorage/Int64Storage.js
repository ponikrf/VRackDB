"use strict";
/*
* Copyright © 2023 Boris Bobylev. All rights reserved.
* Licensed under the Apache License, Version 2.0
*/
Object.defineProperty(exports, "__esModule", { value: true });
const buffer_1 = require("buffer");
const POINT_SIZE = 8;
class Int64Storage {
    constructor(points) { this.buffer = buffer_1.Buffer.alloc(points * POINT_SIZE); }
    readBuffer(index) { return Number(this.buffer.readBigInt64LE(index * POINT_SIZE)); }
    writeBuffer(index, value) { this.buffer.writeBigInt64LE(BigInt(value), index * POINT_SIZE); }
}
exports.default = Int64Storage;
