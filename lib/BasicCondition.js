"use strict";
/*
 * Copyright © 2023 Boris Bobylev. All rights reserved.
 * Licensed under the Apache License, Version 2.0
*/
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EConditionType = void 0;
const AlertCondtition_1 = __importDefault(require("./AlertCondtition"));
const ErrorManager_1 = __importDefault(require("./Errors/ErrorManager"));
const Utility_1 = __importDefault(require("./Utility"));
var EConditionType;
(function (EConditionType) {
    EConditionType["isAbove"] = "isAbove";
    EConditionType["isBelow"] = "isBelow";
    EConditionType["isEqual"] = "isEqual";
    EConditionType["outRange"] = "outRange";
    EConditionType["inRange"] = "inRange";
    EConditionType["noValue"] = "noValue";
})(EConditionType = exports.EConditionType || (exports.EConditionType = {}));
const CTypeParamsCount = {
    isAbove: 1,
    isBelow: 1,
    isEqual: 1,
    outRange: 2,
    inRange: 2,
    noValue: 0,
};
ErrorManager_1.default.register('WLzlG5xV8FxE', 'VDB_BASIC_CONDITION_TYPE', 'Invalid condition type');
ErrorManager_1.default.register('bLbncRI79a9g', 'VDB_BASIC_CONDITION_PARAMS', 'Invalid parameter type or number');
class BasicCondition extends AlertCondtition_1.default {
    /**
     * Add new condition
     *
     * The first time the condition is added, the operator is disregarded.
     * The operator defines how several conditions will be processed.
     * Each new condition will be processed in separate brackets and added
     * to the previous one via the specified operator.
     *
     * For example `(condition1) OR (condition2) AND (condition3)`.
     *
     * The type of condition determines not only the processing method, but also how many parameters will be required
     *
     * List of condition types:
     *
     * **isAbove** requiered 1 param
     * **isBelow** requiered 1 param,
     * **isEqual** requiered 1 param,
     * **outRange** requiered 2 params,
     * **inRange** requiered 2 params,
     * **noValue** requiered 0 param,
     *
     * @example condition('level','outRange', [1,2])
     *
     * @param level string level identify
     * @param type isAbove | isBelow | isEqual | outRange | inRange | noValue
     * @param params Array of params for current type
    */
    constructor(level, type, params) {
        super();
        if (EConditionType[type] === undefined)
            throw ErrorManager_1.default.make(new Error, 'VDB_BASIC_CONDITION_TYPE', { type });
        if (params.length !== CTypeParamsCount[type])
            throw ErrorManager_1.default.make(new Error, 'VDB_BASIC_CONDITION_PARAMS', { count: params.length });
        for (let i = 0; i < params.length; i++) {
            if (typeof params[i] !== "number") {
                throw ErrorManager_1.default.make(new Error, 'VDB_BASIC_CONDITION_PARAMS', { count: params.length, index: i });
            }
        }
        if (type === "inRange" || type === "outRange")
            if (params[0] > params[1])
                params.reverse();
        const id = Utility_1.default.uid();
        this.condition = { level, id, type: EConditionType[type], params };
        return this;
    }
    /**
     * Returns an array of areas whose intersection will trigger an alarm.
     * Each area consists of a beginning and an end (from smaller to larger).
     *
     * Example. [[3,5]] is an area from 3 to 5.
     *
     * Areas can start or end at infinity.
     *
     * For example [[null, 3], [5, null]] would mean - from minus infinity to 3 and from 5 to plus infinity
    */
    areas() {
        switch (this.condition.type) {
            case EConditionType.isAbove:
                return [[null, this.condition.params[0]]];
            case EConditionType.isBelow:
                return [[this.condition.params[0], null]];
            case EConditionType.outRange:
                return [[null, this.condition.params[0]], [this.condition.params[1], null]];
            case EConditionType.inRange:
                return [this.condition.params];
        }
        return [];
    }
    /**
     * Checks whether the data and the internal logic of the condition match.
     *
     * @param value Value of query result
    */
    check(value, id) {
        if (value === null) {
            if (this.condition.type === EConditionType.noValue)
                return true;
            return false;
        }
        switch (this.condition.type) {
            case EConditionType.isAbove:
                return (value > this.condition.params[0]);
            case EConditionType.isBelow:
                return (value < this.condition.params[0]);
            case EConditionType.isEqual:
                return (value == this.condition.params[0]);
            case EConditionType.outRange:
                return (value < this.condition.params[0]) || (value > this.condition.params[1]);
            case EConditionType.inRange:
                return (value > this.condition.params[0]) && (value < this.condition.params[1]);
        }
        return false;
    }
    /**
     * Returns an array containing a list of Y coordinates
    */
    threshholds() {
        return this.condition.params;
    }
    export() { return this.condition; }
    import(condition) {
        this.condition = condition;
    }
}
exports.default = BasicCondition;
