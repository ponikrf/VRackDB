export default class Bin {
    /**
     * Returns the index byte
     *
     * In this case, it refers to the byte index where the required data is stored.
     * @param {number} index Cell index
     * @return {number} The index bit
    */
    static getIndexByte(index: number): number;
    /**
     * Returns the index bit
     *
     * The function is used with getIndexByte. First you need to get
     * index byte, then the bit position in the byte of this index
     *
     * @see getIndexByte
     *
     * @param {number} index Cell index
     * @return {number} The index bit
    */
    static getIndexBit(index: number): number;
    /**
     * Returns the value of the bit in the byte at the bit position
     *
     * The bits are counted from 0. For example, if the byte value is 0b1001, the zero bit will be 1
     *
     * @param {number} byte Byte value
     * @param {number} bit The right bit
     * @return {number} Bit value
    */
    static getBit(byte: number, bit?: number): number;
    /**
     * Sets a bit in the byte to 1 The bits are counted from 0
     *
     * @param {number} byte Byte to set a bit in it
     * @param {number} bit Bit to set to 1
    */
    static setBit(byte: number, bit?: number): number;
    /**
     * Sets a bit in a byte to 0. The bits are counted from 0
     *
     * @param {number} byte Byte to set a bit in it
     * @param {number} bit Bit to set to 0
    */
    static clearBit(byte: number, bit?: number): number;
}
