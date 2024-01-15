/*
* Copyright © 2023 Boris Bobylev. All rights reserved.
* Licensed under the Apache License, Version 2.0
*/

import IStorage from "./IStorage";
import { Buffer } from "buffer";

const POINT_SIZE = 8

export default class DoubleStorage implements IStorage  {
    buffer: Buffer;
    constructor (points: number){ this.buffer = Buffer.alloc(points * POINT_SIZE) }
    readBuffer(index: number){ return this.buffer.readDoubleLE(index * POINT_SIZE) }
    writeBuffer(index: number, value: number){ this.buffer.writeDoubleLE(value, index * POINT_SIZE) }
}