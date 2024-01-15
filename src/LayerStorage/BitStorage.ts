/*
* Copyright © 2023 Boris Bobylev. All rights reserved.
* Licensed under the Apache License, Version 2.0
*/

import Bin from "../Bin";
import IStorage from "./IStorage";
import { Buffer } from "buffer";


export default class BitStorage implements IStorage  {
    buffer: Buffer;
    
    constructor (points: number){ 
        this.buffer = Buffer.alloc(Math.floor(points/8) + 1) 
    }

    readBuffer(index: number){ 
        const byteIndex = Bin.getIndexByte(index)
        const bitIndex = Bin.getIndexBit(index)
        const int = this.buffer.readUInt8(byteIndex) 
        return Bin.getBit(int, bitIndex)
    }

    writeBuffer(index: number, value: number){ 
        value = value & 1
        const byteIndex = Bin.getIndexByte(index)
        const bitIndex = Bin.getIndexBit(index)
        let toSet = this.buffer.readUInt8(byteIndex) 
        if (value) toSet = Bin.setBit(toSet & 0xFF, bitIndex)
        else toSet = Bin.clearBit(toSet & 0xFF,bitIndex)
        this.buffer.writeUInt8(toSet, byteIndex) 
    }
}