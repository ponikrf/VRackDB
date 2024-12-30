import Interval from "./Interval";
import IStorage from "./LayerStorage/IStorage";
import { StorageTypes } from "./LayerStorage/LayerStorage";
/**
 * Metric storage object interface
 * It is allowed to use null for a value when
 * no value can be obtained for a given time
*/
export interface IMetric {
    /** Time in MTU */
    time: number;
    value: number | null;
}
/***
 * Intefrace to output the results of the metrics query
 **/
export interface IMetricReadResult {
    /** result relevance flag */
    relevant: boolean;
    /** Beginning of the period */
    start: number;
    /** End of period */
    end: number;
    /** Metrics array */
    rows: Array<IMetric>;
}
export interface ILayerOptions {
    /**
     * Defines the accuracy with which the data will be stored,
     * for example 10 - 10 MTU. After specifying 10 MTU, this layer will not be able to store data for more than 10 MTU.
     * */
    interval: number;
    /**
     * Determines the total data storage period,
     * 100 - 100 MTU , i.e. this layer will not be able to store data for more than 100 MTU.
    */
    period: number;
    /**
     * Value storage type
     * @see StorageTypes
    */
    vStorage?: StorageTypes | null;
    /**
     * Time storage type
     * @see StorageTypes
    */
    tStorage?: StorageTypes | null;
    /**
     * Class interval - Determines the MTU for a new layer.
    */
    CInterval?: typeof Interval;
}
/**
 * A layer is a low level for storing information.
 * The layer works with such a concept as MTU - minimum time unit. MTU is a unit of time represented as an integer.
 * For class Interval MTU = 1 second. For IntervalMs MTU = 1 millisecond. For class IntervalUs = microsecond
 *
 * Example of creating a layer with 10 memory cells
 *
 * ```ts
 * const lay = new Layer({ interval: 1, period: 10})
 * ```
 *
 * For more details, it is recommended to read the official guide
 *
 * @link https://github.com/ponikrf/VRackDB/wiki/How-It-Works
 *
*/
export default class Layer {
    /** Layer accuracy in MTU */
    protected _interval: number;
    /** Period of layer in MTU */
    protected _period: number;
    /** Number of intervals in a layer */
    protected _cells: number;
    /** Initial point of time in the layer */
    protected _startTime: number;
    /** End point of time in the layer */
    protected _endTime: number;
    /**  Value store */
    protected _valueStorage: IStorage;
    /** Time Vault */
    protected _timeStorage: IStorage;
    /** Interval class (see Interval, IntervalMs, IntervalUs) */
    CInterval: typeof Interval;
    /**
     * Creating a new storage with a certain accuracy (interval) and size (period)
     *
     * **The interval cannot be less than the period**
     *
     * @example  new Layer({ interval: 1, period: 10}) // Creates a layer with an interval of 1 MTU and a period of 10 MTU
     *
     * @see ILayerOptions
     * @link https://github.com/ponikrf/VRackDB/wiki/How-It-Works
    */
    constructor({ interval, period, vStorage, tStorage, CInterval }: ILayerOptions);
    /**
     * Clear layer data
    */
    clear(): void;
    /**
     * Returns the size of the layer in bytes
    */
    get length(): number;
    /**
     * Layer accuracy in MTU
     */
    get interval(): number;
    /**
    * Number of intervals in a layer
    *
    * Old method timeSize is deprecated & deleted
    */
    get period(): number;
    /**
    * Number of intervals in a layer
    */
    get cells(): number;
    /**
     * Initial point of time in the layer
    */
    get startTime(): number;
    /**
     * End point of time in the layer
     * */
    get endTime(): number;
    /**
     * Writes the value into the layer
     *
     * Automatically adjusts the layer time (startTime/endTime).
     *
     * **It is necessary to take into account that the layer may not work correctly
     * If you write data from different time intervals larger than the layer size**.
     *
     * Works best when data is written sequentially (in time)
     *
     * @param {number} time Time in MTU
     * @param {number} value Value to be recorded
     * @param {string} func Modification function
    */
    write(time: number, value: number, func?: string): void;
    /**
     * Returns data in the interval start -> end with layer accuracy
     *
     * If the specified start and end are outside the layer, they will be converted to layer frames
     * this will be indicated in the result
     *
     * Start -> end parameters are automatically rounded to layer accuracy
     *
     * If there is a need to get data with arbitrary precision
     * it is better to use `readCustomInterval`.
     *
     * @see readCustomInterval
     *
     * @param {number} start Start time
     * @param {number} end End time
    */
    readInterval(start: number, end: number): IMetricReadResult;
    /**
     * Allows data to be read from a layer at a different precision than the layer's native one
     * Supports both smaller intra-layer precision and larger intra-layer precision.
     * This can be useful for looking at a complex graph in more detail,
     * or aggregating data with the LAST function to view a less detailed graph.
     *
     * If the specified start and end are outside the layer, they will be brought to the layer boundaries.
     * this will be indicated in the result
     *
     * @param {number} start Start time
     * @param {number} end End time
     * @param {number} precision
    */
    readCustomInterval(start: number, end: number, precision: number, func?: string): IMetricReadResult;
    /**
     * Return all points in layer
     * See example!
     *
     * @example console.table(layer.dump())
    */
    dump(): IMetric[];
    /**
     * Reads 1 index by time and retrieves its value
     *
     * @param {number} time time
    */
    protected readOne(time: number): IMetric;
    /**
     * Returns the time index
     *
     * @param {number} time time in MTU
    */
    protected getIndex(time: number): number;
    /**
     * Checks if the time is valid for the current state
     * of the layer, in fact it checks if the time is within the interval
     * of the layer's current active time
     *
     * @param {number} time Time in MTU
    */
    protected validTime(time: number): boolean;
    /**
     * Reading metrics by index
     *
     * @param {number} index Metrics Index
     * @returns {IMetric} Metric value
    */
    protected readBuffer(index: number): IMetric;
    /**
     * Writes data to the buffer
     *
     * @param {number} index Metric Index
     * @param {number} time Time for recording
     * @param {number} value Value for recording
     * @param {string} func Modification function
    */
    protected writeBuffer(index: number, time: number, value: number, func?: string): void;
    /**
     * Modifies the data before writing the buffer
     *
     * @param {number} index Metrics Index
     * @param {number} value Value for recording
     * @param {string} func Modification function
    */
    protected modifyWrite(index: number, value: number, func: string): number;
}
