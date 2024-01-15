interface IRetention {
    interval: number;
    period: number;
    retention: string;
}
interface IPeriod {
    start: number;
    end: number;
}
export default class Interval {
    #private;
    /**
     * Returns the current time in seconds
    */
    static now(): number;
    /**
     * Converts JS timestamp microseconds to seconds
    */
    static toTime(time: number): number;
    /**
     * Returns the transferred time rounded to precision accuracy
     *
     * @param {number} precision Точность в секундах
     * @param {number} time Время для округления
    */
    static roundTime(time: number, precision: number): number;
    /**
     * Returns an array of dates at a certain interval (precision)
     * Looks like this:
     * | start | start + precission | start + precission * I| end |
     *
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
     * @param {string} period Период формата 'now-1d:now-1h'
     *
    */
    static period(period: string): IPeriod;
    /**
     * Allows you to calculate in simple form the part of the period e.g:
     *
     * - now-10d - Calculates the current time minus 10 days.
     * - now+1h - Current time plus 1 hour
     * - now-1h-1m - Current time minus 1 hour and minus 1 minute.
     *
     * You can't combine the + and - operators, only either all + or all - operations.
     *
     * Supports only 2 operators + and -
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
     * Returns the number of seconds in the specified amount of time
     *
     * The format is like graphite:
     *  - 15s - 15 sec
     *  - 10m - 10 min
     *
     * Where:
     *
     * - s - seconds
     * - m - minutes
     * - h - hours
     * - d - days
     * - w - weeks
     * - mon - months
     * - y - years
     *
     * @param {string} ival String of interval
    */
    static parseInterval(ival: string): number;
    /**
     * Returns the interval (in seconds) for the "start" and "end" period to provide the number of metrics "count".
     *
     * Can be used to simplify the derivation of fixed number metrics regardless of period size.
     *
     * @param {number} start - Start of period in secodn
     * @param {number} end - end of period in secodn
     * @param {number} count - count of metrics
    */
    static getIntervalOfFixedCount(start: number, end: number, count: number): number;
}
export {};
