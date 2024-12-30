/// <reference types="node" />
/// <reference types="node" />
import { Buffer } from "buffer";
export default interface IStorage {
    buffer: Buffer;
    readBuffer(index: number): number;
    writeBuffer(index: number, value: number): void;
}
