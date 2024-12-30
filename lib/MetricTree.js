"use strict";
/*
 * Copyright © 2023 Boris Bobylev. All rights reserved.
 * Licensed under the Apache License, Version 2.0
*/
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _MetricTree_instances, _MetricTree_tree, _MetricTree_isLeaf, _MetricTree_makeTreeResult;
Object.defineProperty(exports, "__esModule", { value: true });
class MetricTree {
    constructor() {
        _MetricTree_instances.add(this);
        _MetricTree_tree.set(this, {}
        /**
         * Removes the metric from the tree.
         * If the metric does not exist, it will simply ignore it
         *
         * @param {string} name Metric name
        */
        );
    }
    /**
     * Removes the metric from the tree.
     * If the metric does not exist, it will simply ignore it
     *
     * @param {string} name Metric name
    */
    destroy(name) {
        let oTree = __classPrivateFieldGet(this, _MetricTree_tree, "f");
        const acts = name.split('.');
        for (let i = 1; i <= acts.length; i++) {
            const act = acts[i - 1];
            if (oTree[act] === undefined)
                return;
            if (i === acts.length && oTree[act])
                delete oTree[act];
            else
                oTree = oTree[act];
        }
    }
    /**
     * Updating the tree when creating a metric
     *
     * @param {string} name Metric name
    */
    update(name) {
        const acts = name.split('.');
        let oTree = __classPrivateFieldGet(this, _MetricTree_tree, "f");
        for (let i = 1; i <= acts.length; i++) {
            const act = acts[i - 1];
            if (oTree[act] === undefined) {
                const empty = {};
                oTree[act] = empty;
            }
            oTree = oTree[act];
        }
    }
    /**
     * Searches for metrics in the tree and returns an array of `ITreeResultElement`
     *
     * For searching, you can use the `*` symbol to get all metrics in the list, note `test.list.*`.
     *
     * **It is not recommended to use the `*` character not at the end of a query string**
     *
     * Example:
     *
     * ```ts
     * [{
     *      leaf: true, // Is the path a finite path (false if the path is a list)
     *      name: 'name', // Act name
     *      path: 'test.name', // Full path
     * }]
     * ```
     *
     * @param {string} pattern A search string of type `path.to.metric.*`.
    */
    find(pattern) {
        const result = [];
        const acts = pattern.split('.');
        const path = [];
        let oTree = __classPrivateFieldGet(this, _MetricTree_tree, "f");
        if (acts.length && acts[acts.length - 1] === '')
            acts.pop();
        for (let i = 1; i <= acts.length; i++) {
            const act = acts[i - 1];
            if (oTree[act] === undefined && act !== '*')
                return [];
            if (i === acts.length) {
                if (act === '*') {
                    const keys = Object.keys(oTree);
                    for (const key of keys)
                        result.push(__classPrivateFieldGet(this, _MetricTree_instances, "m", _MetricTree_makeTreeResult).call(this, oTree, key, path));
                }
                else {
                    if (oTree[act])
                        result.push(__classPrivateFieldGet(this, _MetricTree_instances, "m", _MetricTree_makeTreeResult).call(this, oTree, act, path));
                }
            }
            path.push(act);
            oTree = oTree[act];
        }
        return result;
    }
}
exports.default = MetricTree;
_MetricTree_tree = new WeakMap(), _MetricTree_instances = new WeakSet(), _MetricTree_isLeaf = function _MetricTree_isLeaf(oT) {
    if (Object.keys(oT).length)
        return false;
    return true;
}, _MetricTree_makeTreeResult = function _MetricTree_makeTreeResult(object, key, path) {
    const pathString = (path.length) ? path.join('.') + '.' + key : key;
    return { name: key, leaf: __classPrivateFieldGet(this, _MetricTree_instances, "m", _MetricTree_isLeaf).call(this, object[key]), path: pathString };
};
