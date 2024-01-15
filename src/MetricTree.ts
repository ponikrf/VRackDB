/*
 * Copyright © 2023 Boris Bobylev. All rights reserved.
 * Licensed under the Apache License, Version 2.0
*/

interface IMetricTreeElement {
    [index: string]: IMetricTreeElement;
}

export interface ITreeResultElement {
    leaf: boolean,
    name: string,
    path: string,
}

export default class MetricTree {
    #tree: IMetricTreeElement = {}

    /**
     * Removes the metric from the tree.
     * If the metric does not exist, it will simply ignore it
     * 
     * @param {string} name Metric name
    */
    destroy(name: string) {
        let oTree: IMetricTreeElement = this.#tree
        const acts = name.split('.')
        for (let i = 1; i <= acts.length; i++){
            const act = acts[i - 1]
            if (oTree[act] === undefined) return
            if (i === acts.length && oTree[act]) delete oTree[act]
            else oTree = oTree[act]
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
    find(pattern: string) {
        const result: Array<ITreeResultElement> = []
        const acts = pattern.split('.')
        const path: Array<string> = []
        let oTree: IMetricTreeElement = this.#tree
        if (acts.length && acts[acts.length - 1] === '') acts.pop()
        for (let i = 1; i <= acts.length; i++) {
            const act = acts[i - 1]
            if (oTree[act] === undefined && act !== '*') return []
            if (i === acts.length) {
                if (act === '*') {
                    const keys = Object.keys(oTree)
                    for (const key of keys) result.push(this.#makeTreeResult(oTree,key, path))
                } else {
                    if (oTree[act]) result.push(this.#makeTreeResult(oTree,act,path))
                }
            }
            path.push(act)
            oTree = oTree[act]
        }
        return result
    }

    /**
     * Updating the tree when creating a metric
     * 
     * @param {string} name Metric name
    */
    update(name: string) {
        const acts = name.split('.')
        let oTree: IMetricTreeElement = this.#tree
        for (let i = 1; i <= acts.length; i++) {
            const act = acts[i - 1]
            if (oTree[act] === undefined) {
                const empty: IMetricTreeElement = {}
                oTree[act] = empty
            }
            oTree = oTree[act]
        }
    }

    /**
     * Returns the Leaf flag for the element
     * 
     * @param {IMetricTreeElement} oT Element
    */
    #isLeaf(oT: IMetricTreeElement): boolean {
        if (Object.keys(oT).length) return false
        return true
    }
    
    #makeTreeResult(object: IMetricTreeElement, key: string, path: Array<string>): ITreeResultElement {
        const pathString = (path.length)?path.join('.') + '.' + key: key; 
        return { name: key, leaf: this.#isLeaf(object[key]), path: pathString }
    }
}


