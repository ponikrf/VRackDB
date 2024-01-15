"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ErrorManager_1 = __importDefault(require("./Errors/ErrorManager"));
/*
 * Copyright © 2023 Boris Bobylev. All rights reserved.
 * Licensed under the Apache License, Version 2.0
*/
ErrorManager_1.default.register('f0aInXAQsqNs', 'VDB_METRIC_MODIFY_TYPE', 'Unknown modify type');
/**
 * Helper for writing data to the database
*/
class MetricWrite {
    /**
     * Modifies the data before writing it to the database
     *
     * By default, the `last' function is used in the database *
     *
     * List of all modifiers:
     * - **last** - Permanently overwrites the metric index value
     * - **first** - Leaves the first metric value to be overwritten
     * - **max** - Overwrites the value if the new value is greater than the old one.
     * - **min** - Overwrites the value if the new value is less than the old value
     * - **avg** - Calculates the average value between the current value and the previous value.
     * - **sum** - Adds the current value to the past value
     *
     * @param {number} a Current index value
     * @param {number} b New index value
     * @param {string} func Modification function
     * @return {number} New index value
    */
    static modify(a, b, func) {
        switch (func) {
            case 'last':
                return b;
            case 'first':
                return a;
            case 'max':
                if (b > a)
                    return b;
                else
                    return a;
            case 'min':
                if (b < a)
                    return b;
                else
                    return a;
            case 'avg':
                return a + b / 2;
            case 'sum':
                return a + b;
            default:
                throw ErrorManager_1.default.make('VDB_METRIC_MODIFY_TYPE', { func });
        }
    }
}
exports.default = MetricWrite;
