import Layer, { IMetricReadResult } from "./Layer";
import { StorageTypes } from "./LayerStorage/LayerStorage";
/**
 * Describes the layer settings for storage and sorting
*/
export interface ILayerSettings {
    layer: Layer;
    interval: number;
    period: number;
    retention: string;
    vStorage: StorageTypes | null;
    tStorage: StorageTypes | null;
}
/**
 * Metrics layer storage object
*/
export interface IMetricCollector {
    [index: string]: Array<ILayerSettings>;
}
/**
 * Local interface to get a layer and its boundaries
*/
export interface ILayerCollected {
    start: number;
    end: number;
    layer: ILayerSettings | null;
}
/**
 * Metrics initialization class
 * @see /docs/Collector.md
*/
export default class Collector {
    #private;
    /**
     * Initializes the metric store with `name` and the precision parameter `retentions`
     *
     * - `name` - Describes the path to the metric in the simplified graphite format (path.to.metric)
     * - `retentions` - Describes the layers of the collection, description like graphite carbon
     * of type 10s:1m where 10s is 10 seconds interval and 1m is 1 minute total period of the layer
     *
     * All types of intervals:
     *
     * - s - seconds
     * - m - minutes
     * - h - hours
     * - d - days
     * - w - weeks
     * - mon - months
     * - y - years
     *
     * @see Interval.retentions
     *
     * You can specify several layers at once with different precision using commas
     * for example `Interval.retentions` '10s:1m, 1m:6h, 1h:1w'.
     *
     * @example Collector.initMetric('test.metric', '10s:1h')
     *
     * @param {string} name Metric name
     * @param {string} retentions Interval retentions
     * @param {StorageTypes} vStorage Value storage type
     * @param {StorageTypes} tStorage Time storage type
    */
    init(name: string, retentions: string, vStorage?: StorageTypes | null, tStorage?: StorageTypes | null): void;
    /**
     * Clears all metric data
     *
     *
    */
    clear(name: string): void;
    /**
     * Returns layer settings for the specified metric
     *
     * Modifying the layer settings doesn't make any sense,
     * but modifying the layer buffer may cause it not to work.
     *
     * @param {string} name Metric name
    */
    layers(name: string): Array<ILayerSettings>;
    /**
     * Returns the total size of the occupied memory in bytes Sums the sizes of all layers and returns the result
     *
     * @param {string} name Metric name
     * @return {number} Metric size in bytes
    */
    size(name: string): number;
    /**
     * Checks if the metric exists in the collection
     *
     * @param {string} name Metric name
     * @returns {boolean}
    */
    has(name: string): boolean;
    /**
     * Deletes links to the metric in an attempt to free up memory
     * should be aware that in this case no one should be referring to the
     * metric layers, so it is strongly discouraged to use layers outside of
     * `Collector` or `Database`.
     *
     * @param {string} name Metric name
    */
    destroy(name: string): void;
    /**
     * Writing the value to the database
     *
     * When recording, you can't specify a specific recording time-stamp,
     * it's for a specific purpose, to put it in simple terms, this *
     * approach is needed to do less checking within the base layer
     *
     * @param {string} name The name of the metric in graphite style
     * @param {number} value Value, written as a floating point number of size Double
    */
    write(name: string, value: number, time?: number, func?: string): void;
    /**
     * Reads data from the database from start to end  with precision
     *
     * @param {string} name The name of the metric in graphite style
     * @param {number} start Timestamp of the beginning
     * @param {number} end End Timestamp
     * @param {string} precision The accuracy with which the response should be generated
    */
    read(name: string, start: number, end: number, precision: number, func?: string): IMetricReadResult;
}
