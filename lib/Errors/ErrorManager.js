"use strict";
/*
 * Copyright © 2023 Boris Bobylev. All rights reserved.
 * Licensed under the Apache License, Version 2.0
*/
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const CoreError_1 = __importDefault(require("./CoreError"));
/**
 * The class is the entry point for initializing exceptions
 *
 * It was decided to make one class instead of a bunch of small files of the same type *
 * with standard functionality
 */
class RegisteredErrorManager {
    constructor() {
        this.registeredList = [];
    }
    /**
     * Registers the error type of the component
     * Before the error manager can create errors, the error type must be registered.
     *
     * @param {string} name Название компонента
     * @param {string} code Код ошибки
     * @param {string} short Короткий код ошибки
     * @param {string} description Описание ошибки
     *
    */
    register(code, short, description) {
        const reg1 = this.getRegistered(code);
        const reg2 = this.getRegistered(short);
        if (reg1 !== null || reg2 !== null)
            throw this.make('EM_CODE_EXISTS', { code, short });
        const nr = { name: 'VRackDB', code, short, description };
        this.registeredList.push(nr);
    }
    /**
     * Error creation
     *
     * @param {string} short
    */
    make(short, additional = {}) {
        const reg = this.getRegistered(short);
        if (reg === null)
            throw this.make('EM_CODE_NOT_FOUND');
        const ne = new CoreError_1.default(reg.name, reg.description, reg.code, reg.short);
        ne.vAdd = Object.keys(additional);
        return Object.assign(ne, additional);
    }
    /**
     * Преобразует обычную ошибку в ошибку VRack
     *
     * @param {Error} error Ошибка для преобразования
    */
    convert(error) {
        if (error.vError)
            return error;
        const ne = this.make('EM_ERROR_CONVERT');
        ne.import(error);
        return ne;
    }
    test(func, result) {
        try {
            func();
            return false;
        }
        catch (error) {
            if (error instanceof CoreError_1.default) {
                if (error.vShort === result)
                    return true;
            }
            return false;
        }
    }
    /**
     * Возвращает тип ошибки или null
     *
     * @param {string} short Короткий код ошибки или код ошибки поиска
    */
    getRegistered(short) {
        for (const registered of this.registeredList) {
            if (registered.code === short || registered.short === short)
                return registered;
        }
        return null;
    }
}
const ErrorManager = new RegisteredErrorManager();
ErrorManager.register('NcZIb9QvQRcq', 'EM_CODE_EXISTS', 'This code already exists');
ErrorManager.register('uLYv4mE1Yo50', 'EM_CODE_NOT_FOUND', 'No such error found');
ErrorManager.register('RIl3BUrxWOzP', 'EM_ERROR_CONVERT', 'Converted error');
exports.default = ErrorManager;
