export interface IPeriodMapInterface {
    [index: string]: number;
}
export interface IRetention {
    interval: number;
    period: number;
    retention: string;
}
export interface IPeriod {
    start: number;
    end: number;
}
/**
 * A class for working with time segments.
 *
 * This class takes the second as the basis of time, but it may be different for other classes.
 *  For this reason, this class already introduces such a concept as MTU - minimal time unit.
 *
 * For this class, MTU = second.
 *
 * All methods of the class will imply that you are using MTU time. **The exception is the method toTime**
 *
 * For example, roundTime as before accepts time: number, precision: number, but now this time is not in seconds but in MTU.
 *
*/
export default class Interval {
    /**
     * Multiplier, to get from the standard JS time to the MTU for this class.
     * Other classes like IntervalMs can change this parameter.
    */
    protected static nowFactor: number;
    /**
     * A map that determines the number of MTUs in a specific time period.
     *
     * For this class MTU = second and intervals such as "ms" "mcs" that create a fractional part will be rounded.
     * All operations occur only with integers.
    */
    protected static map: IPeriodMapInterface;
    /**
     * Returns the current time in MTU
    */
    static now(): number;
    /**
     * Converts JS timestamp microseconds to MTU
     *
     * @see now()
     * @param jsTime Time in microseconds
    */
    static toTime(jsTime: number): number;
    /**
     * Returns the transferred time rounded to precision accuracy
     *
     * @param {number} time Time for rounding in MTU
     * @param {number} precision Accuracy in MTU
    */
    static roundTime(time: number, precision: number): number;
    /**
     * Splits the period from start to end into intervals of precision size with start and end pre-rounded to precision accuracy
     *
     * Looks like this:
     * [ start, start + precission, start + precission * I, end ]
     *
     * @param start Start at which the interval report will begin (rounded to “precision”)
     * @param end The end to which the time will be divided into intervals (rounded to “precision”)
     * @param precision Interval into which the period will be divided
    */
    static getIntervals(start: number, end: number, precision: number): Array<number>;
    /**
     * Returns the period in carbon retention type format
     *
     * For example, get the last day's preod: 'now-1d:now'
     *
     * @see partOfPeriod
     * @see parseInterval
     *
     * @param {string} period Period formatted like a 'now-1d:now-1h'
     * @returns {IPeriod} { start: number, end: number }
    */
    static period(period: string): IPeriod;
    /**
     * Allows you to calculate in simple form the part of the period e.g:
     *
     * - now-10d - Calculates the current time minus 10 days.
     * - now+1h - Current time plus 1 hour
     * - now-1h-1m - Current time minus 1 hour and minus 1 minute.
     *
     * Supports 2 operators `+` and `-`
     *
     * If just an interval is specified, e.g. 10d, the result will be returned.
     * calculation of `parseInterval` for interval 10d
     *
     * @see parseInterval
     *
     * @param {string} str Calculation string
    */
    static partOfPeriod(str: string): number;
    /**
     * Parses the time string at specified intervals
     *
     * For example the string '10s:1m, 1m:6h, 1h:1w' *
     * Will return an array:
     *
     * ```
     * [
     * { interval: 10, period: 60 }
     * { interval: 60, period: 21600 }
     * { interval: 3600, period: 604800 }
     * ]
     * ```
     *
     * The function only checks if the string is correct for formatting, but does not check if
     * the given set of intervals and periods are correct and make sense
     *
     * @param {string} str Schema format string graphite-carbon
     *
    */
    static retentions(str: string): Array<IRetention>;
    /**
     * Returns the number of MTU in the specified amount of time
     *
     * The format is like graphite:
     *  - 15s - 15 sec
     *  - 10m - 10 min
     *
     * Where:
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
     *
     * @param {string} ival String of interval
    */
    static parseInterval(ival: string): number;
    /**
     * Returns the interval (in MTU) for the "start" and "end" period to provide the number of metrics "count".
     *
     * Can be used to simplify the derivation of fixed number metrics regardless of period size.
     *
     * @param {number} start - Start of period in secodn
     * @param {number} end - end of period in secodn
     * @param {number} count - count of metrics
    */
    static getIntervalOfFixedCount(start: number, end: number, count: number): number;
    /**
     * Returns the factor for convert milliseconds to MTUs
    */
    static getFactor(): number;
    /**
     * Handles additional time objects, such as now
     * Since now is not part of the interval concept, it should not be included
     * in the parseInterval function, that's why this layer function was created
     * which handles additional time parameters
     *
     * @todo to process the numerical time values
     * @param {string} str String of interval
    */
    protected static prepareInterval(str: string): number;
    /**
     * Returns an object of type IRetention from a string of type '10s:1m'
     *
     * @see retentions
     * @param {string} ret String of period
    */
    protected static retention(ret: string): IRetention;
}
