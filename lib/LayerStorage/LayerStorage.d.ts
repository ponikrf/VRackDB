import IStorage from './IStorage';
export declare enum StorageTypes {
    Bit = "BitStorage",
    Double = "DoubleStorage",
    Float = "FloatStorage",
    Int8 = "Int8Storage",
    Int16 = "Int16Storage",
    Int32 = "Int32Storage",
    Int64 = "Int64Storage",
    Uint8 = "Uint8Storage",
    Uint16 = "Uint16Storage",
    Uint32 = "Uint32Storage",
    Uint64 = "Uint64Storage"
}
export default class LayerStorage {
    /**
     * Allows you to get the class of the storage itself using StorageTypes
     *
     * @param {StorageTypes | null} type Storage type
     * @param {StorageTypes} def In case type is equal to null this type will be used
     *
     * @return
    */
    static make(type: StorageTypes | null, def: StorageTypes, points: number): IStorage;
}
