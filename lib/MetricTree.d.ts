export interface ITreeResultElement {
    leaf: boolean;
    name: string;
    path: string;
}
export default class MetricTree {
    #private;
    /**
     * Removes the metric from the tree.
     * If the metric does not exist, it will simply ignore it
     *
     * @param {string} name Metric name
    */
    destroy(name: string): void;
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
    find(pattern: string): ITreeResultElement[];
    /**
     * Updating the tree when creating a metric
     *
     * @param {string} name Metric name
    */
    update(name: string): void;
}
