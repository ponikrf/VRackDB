"use strict";
/*
* Copyright © 2023 Boris Bobylev. All rights reserved.
* Licensed under the Apache License, Version 2.0
*/
Object.defineProperty(exports, "__esModule", { value: true });
const buffer_1 = require("buffer");
const POINT_SIZE = 4;
class FloatStorage {
    constructor(points) { this.buffer = buffer_1.Buffer.alloc(points * POINT_SIZE); }
    readBuffer(index) { return this.buffer.readFloatLE(index * POINT_SIZE); }
    writeBuffer(index, value) { this.buffer.writeFloatLE(value, index * POINT_SIZE); }
}
exports.default = FloatStorage;
