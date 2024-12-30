"use strict";
/*
 * Copyright © 2024 Boris Bobylev. All rights reserved.
 * Licensed under the Apache License, Version 2.0
*/
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const Interval_1 = __importDefault(require("./Interval"));
/**
 * Extends the interval class to use milliseconds as the MTU
 *
 * @see Interval
*/
class IntervalMs extends Interval_1.default {
}
exports.default = IntervalMs;
_a = IntervalMs;
/**
 * Multiplier for easy calculation of the number of MTUs for a period
*/
IntervalMs.mint = 1000;
IntervalMs.map = {
    mcs: 0.001,
    ms: 1,
    s: 1 * _a.mint,
    m: 60 * _a.mint,
    h: 60 * 60 * _a.mint,
    d: 60 * 60 * 24 * _a.mint,
    w: 60 * 60 * 24 * 7 * _a.mint,
    mon: 60 * 60 * 24 * 30 * _a.mint,
    y: 60 * 60 * 24 * 365 * _a.mint
};
IntervalMs.nowFactor = 1;
