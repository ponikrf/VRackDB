"use strict";
/*
 * Copyright © 2023 Boris Bobylev. All rights reserved.
 * Licensed under the Apache License, Version 2.0
*/
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ErrorManager_1 = __importDefault(require("./Errors/ErrorManager"));
const Interval_1 = __importDefault(require("./Interval"));
const LayerStorage_1 = __importStar(require("./LayerStorage/LayerStorage"));
const SingleDB_1 = __importDefault(require("./SingleDB"));
const Typing_1 = __importDefault(require("./Typing"));
ErrorManager_1.default.register('Xz9N2yZUqBPE', 'VDB_SCHEMETREE_NAME', 'Incorrect scheme name, please use simple names ([a-zA-Z0-9._])');
ErrorManager_1.default.register('m0d1bCLsROTL', 'VDB_SCHEMETREE_SCHEME_PATTERN', 'Incorrect scheme pattern, please use simple names ([a-zA-Z0-9._])');
ErrorManager_1.default.register('ca4pisi99FGm', 'VDB_SCHEMETREE_SCHEME_SAFE', 'Can`t delete default schema');
ErrorManager_1.default.register('DLLHsBKBTSlm', 'VDB_SCHEMETREE_NOT_FOUND', 'Scheme not found');
ErrorManager_1.default.register('hnnBP04agbxO', 'VDB_SCHEMETREE_SCHEME_DUBLICATE', 'Such a scheme already exists in the base');
ErrorManager_1.default.register('zsLgFUqK93EB', 'VDB_SCHEMETREE_DESTROY_BAN', 'You cant destroy the metric, you can only destroy the schema.');
class SchemeDB extends SingleDB_1.default {
    constructor() {
        super(...arguments);
        this.schemes = [];
        this.metricScheme = {};
        this.defaultScheme = {
            name: 'default',
            pattern: '*',
            retentions: '5s:10m, 1m:2h, 15m:1d, 1h:1w, 6h:1mon, 1d:1y',
            patternActs: ['*'],
            size: 0,
            metrics: [],
            vStorage: null,
            tStorage: null,
            CInterval: Interval_1.default
        };
    }
    /**
     * The metric will be created based on the schema and added to the corresponding schema.
     *
     * @param name
    */
    metric({ name }) {
        this.beforeWrite(name);
    }
    /**
     * You can't destroy the metric, you can only destroy the schema.
     * @param name metric name
    */
    destroy(name) {
        throw ErrorManager_1.default.make(new Error, 'VDB_SCHEMETREE_DESTROY_BAN', { name });
    }
    /**
     * Adding a new scheme
     *
     * Example:
     * ```ts
     * // Creates a schema with the name `test` and the pattern 'test.name'
     * // Then the parameters are specified in the line separated by commas
     * // accuracy and storage time of metrics for a given scheme
     * // (with an accuracy of 5 seconds storage period of 10 minutes)
     * // (with an accuracy of 1 minute storage period of 2 hours)
     * DB.scheme('test', 'test.name', '5s:10m, 1m:2h')
     * ```
     *
     * Schemes are needed to assign different storage layer sizes to a single metric.
     * The combination of the different layers determines how accurately
     * and how long the data of a given metric will be stored.
     *
     * Schemas are assigned via a pattern if the metric fits the pattern of the schema,
     * it will be assigned to the layers specified in the pattern.
     *
     * Read More: @see /docs/Database
     *
     * @param {string} name Schema name, allocates metrics to a named group
     * @param {string} pattern Pattern scheme for metrics
     * @param {string} retentions Specifying the accuracy and size of the metric retention period.
     * @param {StorageTypes | null} vStorage Type of value storage
     * @param {StorageTypes | null} tStorage Type of time storage
    */
    scheme({ name, pattern, retentions = this.defaultScheme.retentions, tStorage = null, vStorage = null, CInterval = Interval_1.default }) {
        if (!Typing_1.default.isName(name))
            throw ErrorManager_1.default.make(new Error, 'VDB_SCHEMETREE_NAME', { name });
        if (!Typing_1.default.isName(pattern))
            throw ErrorManager_1.default.make(new Error, 'VDB_SCHEMETREE_SCHEME_PATTERN', { pattern });
        Interval_1.default.retentions(retentions); // Validation scheme create retentions
        LayerStorage_1.default.make(vStorage, LayerStorage_1.StorageTypes.Bit, 8);
        LayerStorage_1.default.make(tStorage, LayerStorage_1.StorageTypes.Bit, 8);
        if (this.getScheme(name))
            throw ErrorManager_1.default.make(new Error, 'VDB_SCHEMETREE_SCHEME_DUBLICATE', { name });
        const nScheme = {
            name,
            pattern,
            retentions,
            patternActs: pattern.split('.'),
            size: 0,
            metrics: [],
            vStorage,
            tStorage,
            CInterval
        };
        this.schemes.push(nScheme);
    }
    /**
     * Deletes the schema with all its metrics
     *
     * @param {string} name Scheme name
    */
    schemeDestroy(name) {
        if (name === 'default')
            throw ErrorManager_1.default.make(new Error, 'VDB_SCHEMETREE_SCHEME_SAFE', { name });
        for (let i = 0; i < this.schemes.length; i++) {
            if (this.schemes[i].name !== name)
                continue;
            for (const mn of this.schemes[i].metrics) {
                this.Collector.destroy(mn);
            }
            this.schemes.splice(i, 1);
        }
        throw ErrorManager_1.default.make(new Error, 'VDB_SCHEMETREE_NOT_FOUND', { name });
    }
    /**
     * Return metric list of scheme
     *
     * @param name Scheme name
    */
    schemeMetrics(name) {
        const o = this.getScheme(name);
        if (!o)
            throw ErrorManager_1.default.make(new Error, 'VDB_SCHEMETREE_NOT_FOUND', { name });
        return o.metrics.slice();
    }
    /**
     * Checks the existence of a schema
     *
     * @param name Scheme name
    */
    schemeHas(name) {
        if (this.getScheme(name))
            return true;
        return false;
    }
    /**
     * Returns a list of available scheme names
     *
     * @returns {Array<string>} List of circuit names
    */
    schemeList() {
        const r = ['default'];
        for (const o of this.schemes)
            r.push(o.name);
        return r;
    }
    /**
     * Returns the size of the schema. If the scheme was not found, returns null
     *
     * @param {string} name Scheme name
     * @returns {number} Size in bytes or null if no schema found
    */
    schemeSize(name) {
        if (name === 'default')
            return this.defaultScheme.size;
        const o = this.getScheme(name);
        if (!o)
            throw ErrorManager_1.default.make(new Error, 'VDB_SCHEMETREE_NOT_FOUND', { name });
        return o.size;
    }
    /**
     * Looking for the right scheme for the metric.
     *
     * @param {string} metricName Metric name
    */
    findScheme(metricName) {
        const nActs = metricName.split('.');
        for (const scheme of this.schemes) {
            for (let i = 0; i <= scheme.patternActs.length; i++) {
                if (i === scheme.patternActs.length)
                    return scheme;
                if (scheme.patternActs[i] === nActs[i] ||
                    scheme.patternActs[i] === '*')
                    continue;
                else
                    break;
            }
        }
        return this.defaultScheme;
    }
    /**
     * Return scheme by name
     *
     * @param scheme Scheme name
    */
    getScheme(scheme) {
        for (const o of this.schemes)
            if (o.name === scheme)
                return o;
        return false;
    }
    /**
     * Init collector metric
     *
     * @param name Metric name
    */
    beforeWrite(name) {
        if (this.Collector.has(name))
            return;
        const scheme = this.findScheme(name);
        this.Collector.init({ name, retentions: scheme.retentions, vStorage: scheme.vStorage, tStorage: scheme.tStorage, CInterval: scheme.CInterval });
        const sz = this.Collector.size(name);
        scheme.size += sz;
        scheme.metrics.push(name);
        this.metricScheme[name] = scheme;
    }
}
exports.default = SchemeDB;
