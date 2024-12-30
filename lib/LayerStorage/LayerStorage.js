"use strict";
/*
* Copyright © 2023 Boris Bobylev. All rights reserved.
* Licensed under the Apache License, Version 2.0
*/
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageTypes = void 0;
const BitStorage_1 = __importDefault(require("./BitStorage"));
const DoubleStorage_1 = __importDefault(require("./DoubleStorage"));
const FloatStorage_1 = __importDefault(require("./FloatStorage"));
const Int8Storage_1 = __importDefault(require("./Int8Storage"));
const Int16Storage_1 = __importDefault(require("./Int16Storage"));
const Int32Storage_1 = __importDefault(require("./Int32Storage"));
const Int64Storage_1 = __importDefault(require("./Int64Storage"));
const Uint8Storage_1 = __importDefault(require("./Uint8Storage"));
const Uint16Storage_1 = __importDefault(require("./Uint16Storage"));
const Uint32Storage_1 = __importDefault(require("./Uint32Storage"));
const Uint64Storage_1 = __importDefault(require("./Uint64Storage"));
const ErrorManager_1 = __importDefault(require("../Errors/ErrorManager"));
var StorageTypes;
(function (StorageTypes) {
    StorageTypes["Bit"] = "BitStorage";
    StorageTypes["Double"] = "DoubleStorage";
    StorageTypes["Float"] = "FloatStorage";
    StorageTypes["Int8"] = "Int8Storage";
    StorageTypes["Int16"] = "Int16Storage";
    StorageTypes["Int32"] = "Int32Storage";
    StorageTypes["Int64"] = "Int64Storage";
    StorageTypes["Uint8"] = "Uint8Storage";
    StorageTypes["Uint16"] = "Uint16Storage";
    StorageTypes["Uint32"] = "Uint32Storage";
    StorageTypes["Uint64"] = "Uint64Storage";
})(StorageTypes = exports.StorageTypes || (exports.StorageTypes = {}));
ErrorManager_1.default.register('fr7ur4knKy4a', 'VDB_LAYER_STORAGE_TYPE', 'Incorrect storage type, select a supported storage type');
class LayerStorage {
    /**
     * Allows you to get the class of the storage itself using StorageTypes
     *
     * @param {StorageTypes | null} type Storage type
     * @param {StorageTypes} def In case type is equal to null this type will be used
     *
     * @return
    */
    static make(type, def, points) {
        if (type === null)
            type = def;
        switch (type) {
            case StorageTypes.Bit: return new BitStorage_1.default(points);
            case StorageTypes.Double: return new DoubleStorage_1.default(points);
            case StorageTypes.Float: return new FloatStorage_1.default(points);
            case StorageTypes.Int8: return new Int8Storage_1.default(points);
            case StorageTypes.Int16: return new Int16Storage_1.default(points);
            case StorageTypes.Int32: return new Int32Storage_1.default(points);
            case StorageTypes.Int64: return new Int64Storage_1.default(points);
            case StorageTypes.Uint8: return new Uint8Storage_1.default(points);
            case StorageTypes.Uint16: return new Uint16Storage_1.default(points);
            case StorageTypes.Uint32: return new Uint32Storage_1.default(points);
            case StorageTypes.Uint64: return new Uint64Storage_1.default(points);
        }
        throw ErrorManager_1.default.make(new Error, 'VDB_LAYER_STORAGE_TYPE', { type });
    }
}
exports.default = LayerStorage;
