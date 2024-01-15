"use strict";
/*
* Copyright © 2023 Boris Bobylev. All rights reserved.
* Licensed under the Apache License, Version 2.0
*/
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Bin_1 = __importDefault(require("../Bin"));
const buffer_1 = require("buffer");
class BitStorage {
    constructor(points) {
        this.buffer = buffer_1.Buffer.alloc(Math.floor(points / 8) + 1);
    }
    readBuffer(index) {
        const byteIndex = Bin_1.default.getIndexByte(index);
        const bitIndex = Bin_1.default.getIndexBit(index);
        const int = this.buffer.readUInt8(byteIndex);
        return Bin_1.default.getBit(int, bitIndex);
    }
    writeBuffer(index, value) {
        value = value & 1;
        const byteIndex = Bin_1.default.getIndexByte(index);
        const bitIndex = Bin_1.default.getIndexBit(index);
        let toSet = this.buffer.readUInt8(byteIndex);
        if (value)
            toSet = Bin_1.default.setBit(toSet & 0xFF, bitIndex);
        else
            toSet = Bin_1.default.clearBit(toSet & 0xFF, bitIndex);
        this.buffer.writeUInt8(toSet, byteIndex);
    }
}
exports.default = BitStorage;
