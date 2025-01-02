/*
* Copyright © 2023 Boris Bobylev. All rights reserved.
* Licensed under the Apache License, Version 2.0
*/

import BitStorage from "./BitStorage";
import DoubleStorage from "./DoubleStorage";
import FloatStorage from "./FloatStorage";
import Int8Storage from "./Int8Storage";
import Int16Storage from "./Int16Storage";
import Int32Storage from "./Int32Storage";
import Int64Storage from "./Int64Storage";
import Uint8Storage from "./Uint8Storage";
import Uint16Storage from "./Uint16Storage";
import Uint32Storage from "./Uint32Storage";
import Uint64Storage from "./Uint64Storage";
import IStorage from './IStorage';
import ErrorManager from "../Errors/ErrorManager";

export enum StorageTypes {
    Bit = 'BitStorage',
    Double = 'DoubleStorage',
    Float = 'FloatStorage',
    Int8 = 'Int8Storage',
    Int16 = 'Int16Storage',
    Int32 = 'Int32Storage',
    Int64 = 'Int64Storage',
    Uint8 = 'Uint8Storage',
    Uint16 = 'Uint16Storage',
    Uint32 = 'Uint32Storage',
    Uint64 = 'Uint64Storage',
}

ErrorManager.register('fr7ur4knKy4a', 'VDB_LAYER_STORAGE_TYPE', 'Incorrect storage type, select a supported storage type')

export default class LayerStorage {

    /**
     * Checks if a value is a storage type
     * 
     * @param val The value being tested
    */
    static isStorageType(val: any) {
        if (val in StorageTypes) return true
        return false
    }

    /**
     * Allows you to get the class of the storage itself using StorageTypes
     * 
     * @param {StorageTypes | null} type Storage type
     * @param {StorageTypes} def In case type is equal to null this type will be used
     * 
     * @return
    */
    static make (type: StorageTypes | null, def: StorageTypes, points: number): IStorage {
        if (type === null) type = def
        switch(type){
            case StorageTypes.Bit: return new BitStorage(points)
            case StorageTypes.Double: return new DoubleStorage(points)
            case StorageTypes.Float: return new FloatStorage(points)
            case StorageTypes.Int8: return new Int8Storage(points)
            case StorageTypes.Int16: return new Int16Storage(points)
            case StorageTypes.Int32: return new Int32Storage(points)
            case StorageTypes.Int64: return new Int64Storage(points)
            case StorageTypes.Uint8: return new Uint8Storage(points)
            case StorageTypes.Uint16: return new Uint16Storage(points)
            case StorageTypes.Uint32: return new Uint32Storage(points)
            case StorageTypes.Uint64: return new Uint64Storage(points)
        }
        throw ErrorManager.make(new Error, 'VDB_LAYER_STORAGE_TYPE', { type })
    }
}