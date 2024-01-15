/// <reference types="node" />
import IStorage from "./IStorage";
import { Buffer } from "buffer";
export default class Uint16Storage implements IStorage {
    buffer: Buffer;
    constructor(points: number);
    readBuffer(index: number): number;
    writeBuffer(index: number, value: number): void;
}
