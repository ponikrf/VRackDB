import { StorageTypes } from "./LayerStorage/LayerStorage";
/**
 * Metric storage object interface
 * It is allowed to use null for a value when
 * no value can be obtained for a given time
*/
export interface IMetric {
    /** Time in seconds */
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
/**
 * See the documentation for the layer
 *
 * @see /docs/layer.md
*/
export default class Layer {
    #private;
    /** Layer accuracy in seconds */
    interval: number;
    /** Period of layer */
    period: number;
    /** Number of intervals in a layer */
    points: number;
    /** Initial point of time in the layer */
    startTime: number;
    /** End point of time in the layer */
    endTime: number;
    /**
     * Creating a new storage with a certain accuracy (interval) and size (period)
     *
     * **Layer accuracy cannot be greater than the total storage interval**
     *
     * @example  new Layer(1, 10) // Creates a layer with an interval of 1 second and a period of 10 seconds
     *
     * @param {number} interval Defines the accuracy with which the data will be stored,
     * for example 10 - 10 seconds. After specifying 10 seconds, this layer will not be able to store data for more than 10 seconds.
     *
     * @param {number} period Determines the total data storage period,
     * 100 - 100sec , i.e. this layer will not be able to store data for more than 100sec.
    */
    constructor(interval: number, period: number, vStorage?: StorageTypes | null, tStorage?: StorageTypes | null);
    /**
     * Clear layer data
    */
    clear(): void;
    /**
     * Returns the size of the layer in bytes
    */
    size(): number;
    /**
     * Returns the total time of the layer in seconds
     * */
    timeSize(): number;
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
     * @param {number} time Time in seconds
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
     *
     * @example console.table(layer.dump())
    */
    dump(): IMetric[];
}
