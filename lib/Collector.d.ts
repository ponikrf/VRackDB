import Interval from "./Interval";
import Layer, { IMetricReadResult } from "./Layer";
import { StorageTypes } from "./LayerStorage/LayerStorage";
/**
 * Specific params for each metric
*/
export interface ICollectorMetricAdditional {
    /** First time marker. Always filled with the earliest time */
    firstTime: number;
    /** Added each time a metric is written. Doesn't necessarily affect the data. */
    writeCount: number;
    /** Metric size in bytes (All layers sum) */
    size: number;
}
/**
 * Describes the layer settings for storage and sorting
*/
interface ILayerSettings {
    layer: Layer;
    retention: string;
}
/**
 * Local interface to get a layer and its boundaries
*/
interface ILayerCollected {
    start: number;
    end: number;
    layer: ILayerSettings | null;
}
export interface ICollectorOptions {
    /**
     * Metric unique ID in format `metric.id`
    */
    name: string;
    /**
     * This is a string specifying which layers will be used for this metric.
     *
     * It specifies layer parameters separated by commas, e.g.  Where the semicolon
     * separates the interval and period settings of each layer of the metric
     * `5s:10m, 1m:2h, 15m:1d, 1h:1w, 6h:1mon, 1d:1y`
     *
     * The layers are usually specified in order, from small and accurate
     * to large and less accurate.
     *
     * Note that this is the approach that is best for layer placement.
     * There is no point in creating a layer with a period longer than
     * the one you already have and with higher accuracy.
     * In this case, layers with smaller period and lower accuracy
     * will store useless information
     *
     * X NOT CORRECTED `5s:10d, 10s:1d`
     * ! CORRECTED `5s:1d, 10s:10d `
    */
    retentions: string;
    /**
     * Storage type for metric value
     *
     * Determines in which type the metric value will be stored,
     * you can see all the types in the LayerStorage class.
     *
     * Keep in mind that if you try to write data not suitable for the specified type,
     * the result may be unpredictable for you
     *
     * The default size is Float.
     * It is suitable for most metrics and uses
     * a floating point to separate the fractional part.
    */
    vStorage?: StorageTypes | null;
    /**
     * Storage type for metric time
     *
     * Determines in which type the metric time will be stored,
     * you can see all the types in the LayerStorage class.
     *
     * It is important that your time fits into the selected type.
     * The default type is Uint64.
     * We recommend that you do not change it unless it is absolutely necessary.
    */
    tStorage?: StorageTypes | null;
    /**
     * The Interval class defines the MTU - minimum time unit
     *
     * Previously, the base always worked with seconds, which was not always convenient
     * when you need to work with time less than a second.
     * Now to fix this problem, you can use another class Interval,
     * in which MTU will be less than a second.
     *
     * Example:
     *
     * Interval - For MTU = second
     * IntervalMs - For MTU = millisecond
     * IntervalUs - For MTU = microsecond
     *
    */
    CInterval?: typeof Interval;
}
/**
 * Metrics initialization class
 *
 * Creates metrics based on retention settings.
 * The whole class works only with metrics and all its methods process only metrics.
 *
 * Metrics can be accessed by their identifier.
 * This identifier is set during initialization.
 * Then all operations are performed using the identifier of the metric.
 *
 * @link https://github.com/ponikrf/VRackDB/wiki/How-It-Works
*/
export default class Collector {
    /**
     * Contains layers of metrics
     */
    protected mectrics: {
        [index: string]: Array<ILayerSettings>;
    };
    /**
     * Additional information for each metric
     *
     * firstTime - First time marker. Always filled with the earliest time
     * writeCount - Added each time a metric is written. Doesn't necessarily affect the data.
     * size - Metric size in bytes
     *
     * @see ICollectorMetricAdditional
    */
    protected additional: {
        [index: string]: ICollectorMetricAdditional;
    };
    /**
     * Initializes the metric store with `name` and the precision parameter `retentions`
     *
     * - `name` - Metric name in the graphite format (path.to.metric)
     * - `retentions` - Describes the layers of the collection, description like graphite carbon
     * of type 10s:1m where 10s is 10 seconds interval and 1m is 1 minute total period of the layer
     *
     * All types of intervals:
     *
     * - us - microsecond
     * - ms - millisecond
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
     * @example
     * ```ts
     * const collection = new Collector()
     * collection.init({ name: 'test.metric', retentions: '10s:1h, 1m:1d' })
     * ```
     * @see ICollectorOptions
    */
    init({ name, retentions, vStorage, tStorage, CInterval }: ICollectorOptions): void;
    /**
     * Clears all metric data
     *
     * @param name metric name
    */
    clear(name: string): void;
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
     * @param name Metric name
     * @param execption Throw exception if metric does not exist?
     * @returns {boolean}
    */
    has(name: string, execption?: boolean): boolean;
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
    /**
     * Returns irrelevant data, used when the requested metric does not exist
     *
     * @param {number} start Beginning of the period
     * @param {number} end End of period
     * @param {number} precision Precision in seconds
    */
    readFake(start: number, end: number, precision: number): IMetricReadResult;
    /**
     * Returns the estimated start of the metric graph
     *
     * @param {string} name The name of the metric
    */
    start(name: string): number;
    /**
     * Returns the estimated end of the metric graph
     *
     * @param {string} name The name of the metric
    */
    end(name: string): number;
    /**
     * Returns the number of writes count in the metric
     *
     * @param {string} name The name of the metric
    */
    writeCount(name: string): number;
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
     * Return metric interval class
     *
     * @param {string} name The name of the metric
    */
    interval(name: string): typeof Interval;
    /**
     * Return additional information
     *
     * @see ICollectorMetricAdditional
    */
    info(name: string): ICollectorMetricAdditional;
    /**
     * The method forms an array of layers and periods from which it is best to will take the necessary information.
     *
     * If, for example, there is a request whose time is not included in any layer, `
     * ILayerCollected` with layer `null` will be returned.
     *
     * Such periods are processed intervals with `null` values.
     *
     * @param {string} name Metric name
     * @param {number} start Beginning of the period
     * @param {number} end End of period
     * @param {number} precision Precision
     * @returns {Array<ILayerCollected>}
    */
    protected findLayers(name: string, start: number, end: number, precision: number): Array<ILayerCollected>;
    /**
     * Searches the appropriate layer for the query, will search by time and accuracy
     *
     * @param {string} name Metric name
     * @param {number} start Beginning of the period
     * @param {number} end End of period
     * @param {number} precision Precision
     * @returns {ILayerCollected}
    */
    protected findLayer(name: string, start: number, end: number, precision: number): ILayerCollected;
    /**
     * Calculates the size of the metric in bytes
     *
     * @param {string} name  metric name
    */
    protected calcSize(name: string): number;
}
export {};
