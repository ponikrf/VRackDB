"use strict";
/*
* Copyright © 2023 Boris Bobylev. All rights reserved.
* Licensed under the Apache License, Version 2.0
*/
Object.defineProperty(exports, "__esModule", { value: true });
const buffer_1 = require("buffer");
class Uint8Storage {
    constructor(points) { this.buffer = buffer_1.Buffer.alloc(points); }
    readBuffer(index) { return this.buffer.readUint8(index); }
    writeBuffer(index, value) { this.buffer.writeUint8(value & 0xFF, index); }
}
exports.default = Uint8Storage;
