/*
 * Copyright © 2023 Boris Bobylev. All rights reserved.
 * Licensed under the Apache License, Version 2.0
*/

import { ICollectorOptions } from "./Collector";
import ErrorManager from "./Errors/ErrorManager";
import Interval from "./Interval";

import LayerStorage, { StorageTypes } from "./LayerStorage/LayerStorage";

import SingleDB from "./SingleDB";
import Typing from "./Typing";

export interface ISchemeTree {
    name: string,
    pattern: string,
    retentions: string,
    patternActs: Array<string>,
    size: number,
    metrics: Array<string>,
    tStorage: StorageTypes | null,
    vStorage: StorageTypes | null,
    CInterval: typeof Interval
}

export interface ISchemeTreeOptions {
    name: string,
    pattern: string,
    retentions?: string,
    tStorage?: StorageTypes | null,
    vStorage?: StorageTypes | null,
    CInterval?: typeof Interval
}

ErrorManager.register('Xz9N2yZUqBPE', 'VDB_SCHEMETREE_NAME', 'Incorrect scheme name, please use simple names ([a-zA-Z0-9._])')
ErrorManager.register('m0d1bCLsROTL', 'VDB_SCHEMETREE_SCHEME_PATTERN', 'Incorrect scheme pattern, please use simple names ([a-zA-Z0-9._])')
ErrorManager.register('ca4pisi99FGm', 'VDB_SCHEMETREE_SCHEME_SAFE', 'Can`t delete default schema')
ErrorManager.register('DLLHsBKBTSlm', 'VDB_SCHEMETREE_NOT_FOUND', 'Scheme not found')
ErrorManager.register('hnnBP04agbxO', 'VDB_SCHEMETREE_SCHEME_DUBLICATE', 'Such a scheme already exists in the base')
ErrorManager.register('zsLgFUqK93EB', 'VDB_SCHEMETREE_DESTROY_BAN', 'You cant destroy the metric, you can only destroy the schema.')

export default class SchemeDB extends SingleDB {
    protected schemes: Array<ISchemeTree> = []
    protected metricScheme: { [index: string]: ISchemeTree; } = {}
    
    protected defaultScheme: ISchemeTree = {
        name: 'default',
        pattern: '*',
        retentions: '5s:10m, 1m:2h, 15m:1d, 1h:1w, 6h:1mon, 1d:1y',
        patternActs: ['*'],
        size: 0,
        metrics: [],
        vStorage: null,
        tStorage: null,
        CInterval: Interval
    }

    /**
     * The metric will be created based on the schema and added to the corresponding schema.
     * 
     * @param name 
    */
    metric({ name }: ICollectorOptions): void {
        this.beforeWrite(name)
    }

    /**
     * You can't destroy the metric, you can only destroy the schema.
     * @param name metric name
    */
    destroy(name: string): void {
        throw ErrorManager.make(new Error, 'VDB_SCHEMETREE_DESTROY_BAN', { name })
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
    scheme({ name, pattern, retentions = this.defaultScheme.retentions, tStorage = null, vStorage = null, CInterval = Interval }  :ISchemeTreeOptions ) {
        if (!Typing.isName(name)) throw ErrorManager.make(new Error, 'VDB_SCHEMETREE_NAME', { name })
        if (!Typing.isName(pattern)) throw ErrorManager.make(new Error, 'VDB_SCHEMETREE_SCHEME_PATTERN', { pattern })
        Interval.retentions(retentions) // Validation scheme create retentions
        LayerStorage.make(vStorage, StorageTypes.Bit, 8)
        LayerStorage.make(tStorage, StorageTypes.Bit, 8)
        if (this.getScheme(name)) throw ErrorManager.make(new Error, 'VDB_SCHEMETREE_SCHEME_DUBLICATE', { name })
        const nScheme: ISchemeTree = {
            name,
            pattern,
            retentions,
            patternActs: pattern.split('.'),
            size: 0,
            metrics: [],
            vStorage,
            tStorage,
            CInterval
        }
        this.schemes.push(nScheme)
    }

    /**
     * Deletes the schema with all its metrics
     * 
     * @param {string} name Scheme name
    */
    schemeDestroy(name: string) {
        if (name === 'default') throw ErrorManager.make(new Error, 'VDB_SCHEMETREE_SCHEME_SAFE', { name })
        for (let i = 0; i < this.schemes.length; i++) {
            if (this.schemes[i].name !== name) continue
            for (const mn of this.schemes[i].metrics) {
                this.Collector.destroy(mn)
            }
            this.schemes.splice(i, 1)
        }
        throw ErrorManager.make(new Error, 'VDB_SCHEMETREE_NOT_FOUND', { name })
    }

    /**
     * Return metric list of scheme
     * 
     * @param name Scheme name
    */
    schemeMetrics(name: string): Array<string> {
        const o = this.getScheme(name)
        if (!o) throw ErrorManager.make(new Error, 'VDB_SCHEMETREE_NOT_FOUND', { name })
        return o.metrics.slice()
    }

    /**
     * Checks the existence of a schema
     * 
     * @param name Scheme name
    */
    schemeHas(name: string): boolean {
        if (this.getScheme(name)) return true
        return false
    }

    /**
     * Returns a list of available scheme names
     * 
     * @returns {Array<string>} List of circuit names
    */
    schemeList(): Array<string> {
        const r: Array<string> = ['default']
        for (const o of this.schemes) r.push(o.name);
        return r
    }

    /**
     * Returns the size of the schema. If the scheme was not found, returns null
     * 
     * @param {string} name Scheme name
     * @returns {number} Size in bytes or null if no schema found
    */
    schemeSize(name: string): number {
        if (name === 'default') return this.defaultScheme.size
        const o = this.getScheme(name)
        if (!o) throw ErrorManager.make(new Error, 'VDB_SCHEMETREE_NOT_FOUND', { name })
        return o.size
    }

    /**
     * Looking for the right scheme for the metric.
     * 
     * @param {string} metricName Metric name
    */
    protected findScheme(metricName: string): ISchemeTree {
        const nActs = metricName.split('.')
        for (const scheme of this.schemes) {
            for (let i = 0; i <= scheme.patternActs.length; i++) {
                if (i === scheme.patternActs.length) return scheme
                if (scheme.patternActs[i] === nActs[i] ||
                    scheme.patternActs[i] === '*'
                ) continue; else break;
            }
        }
        return this.defaultScheme
    }

    /**
     * Return scheme by name
     * 
     * @param scheme Scheme name
    */
    protected getScheme(scheme: string) {
        for (const o of this.schemes) if (o.name === scheme) return o
        return false
    }

    /**
     * Init collector metric 
     * 
     * @param name Metric name
    */
    protected beforeWrite(name: string): void {
        if (this.Collector.has(name)) return
        const scheme = this.findScheme(name)
        this.Collector.init({ name, retentions: scheme.retentions, vStorage: scheme.vStorage, tStorage: scheme.tStorage, CInterval: scheme.CInterval })
        const sz = this.Collector.size(name)
        scheme.size += sz
        scheme.metrics.push(name)
        this.metricScheme[name] = scheme
    }
}
