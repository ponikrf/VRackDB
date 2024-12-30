import { ICollectorOptions } from "./Collector";
import Interval from "./Interval";
import { StorageTypes } from "./LayerStorage/LayerStorage";
import SingleDB from "./SingleDB";
export interface ISchemeTree {
    name: string;
    pattern: string;
    retentions: string;
    patternActs: Array<string>;
    size: number;
    metrics: Array<string>;
    tStorage: StorageTypes | null;
    vStorage: StorageTypes | null;
    CInterval: typeof Interval;
}
export interface ISchemeTreeOptions {
    name: string;
    pattern: string;
    retentions?: string;
    tStorage?: StorageTypes | null;
    vStorage?: StorageTypes | null;
    CInterval?: typeof Interval;
}
export default class SchemeDB extends SingleDB {
    protected schemes: Array<ISchemeTree>;
    protected metricScheme: {
        [index: string]: ISchemeTree;
    };
    protected defaultScheme: ISchemeTree;
    /**
     * The metric will be created based on the schema and added to the corresponding schema.
     *
     * @param name
    */
    metric({ name }: ICollectorOptions): void;
    /**
     * You can't destroy the metric, you can only destroy the schema.
     * @param name metric name
    */
    destroy(name: string): void;
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
    scheme({ name, pattern, retentions, tStorage, vStorage, CInterval }: ISchemeTreeOptions): void;
    /**
     * Deletes the schema with all its metrics
     *
     * @param {string} name Scheme name
    */
    schemeDestroy(name: string): void;
    /**
     * Return metric list of scheme
     *
     * @param name Scheme name
    */
    schemeMetrics(name: string): Array<string>;
    /**
     * Checks the existence of a schema
     *
     * @param name Scheme name
    */
    schemeHas(name: string): boolean;
    /**
     * Returns a list of available scheme names
     *
     * @returns {Array<string>} List of circuit names
    */
    schemeList(): Array<string>;
    /**
     * Returns the size of the schema. If the scheme was not found, returns null
     *
     * @param {string} name Scheme name
     * @returns {number} Size in bytes or null if no schema found
    */
    schemeSize(name: string): number;
    /**
     * Looking for the right scheme for the metric.
     *
     * @param {string} metricName Metric name
    */
    protected findScheme(metricName: string): ISchemeTree;
    /**
     * Return scheme by name
     *
     * @param scheme Scheme name
    */
    protected getScheme(scheme: string): false | ISchemeTree;
    /**
     * Init collector metric
     *
     * @param name Metric name
    */
    protected beforeWrite(name: string): void;
}
