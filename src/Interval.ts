/*
 * Copyright © 2023 Boris Bobylev. All rights reserved.
 * Licensed under the Apache License, Version 2.0
*/

import ErrorManager from "./Errors/ErrorManager";
import Typing from "./Typing";

interface IPeriodMapInterface {
    [index: string]: number;
}

interface IRetention {
    interval: number,
    period: number,
    retention: string
}

interface IPeriod {
    start: number,
    end: number
}

ErrorManager.register('UNNdYlOiGduD', 'VDB_INTREVAL_PRECISION', 'Incorrect type given, values must be integer and greater than zero')
ErrorManager.register('2nWCcqq49P5Y', 'VDB_INTREVAL_TIME', 'Incorrect type given, type integer is required')
ErrorManager.register('QC93dkEnQAW1', 'VDB_INTREVAL_SECTION', 'Incorrect section - The beginning is greater than the end')
ErrorManager.register('nuELzbjx0HqG', 'VDB_INTREVAL_PERIOD', 'Incorrect period string, use example `now-1d:now-1h` ')
ErrorManager.register('T80r57lrQFCb', 'VDB_INTREVAL_PARSE', 'Incorrect interval string, use example `10s` `1m` `1h` ')
ErrorManager.register('8A2U9F2oIDG4', 'VDB_INTREVAL_RETENTION', 'Incorrect retention string, use example `10s:1m` `1m:15h` `1h:1y` ')

export default class Interval {

    static #map: IPeriodMapInterface = {
        s: 1,
        m: 60,
        h: 60 * 60,
        d: 60 * 60 * 24,
        w: 60 * 60 * 24 * 7,
        mon: 60 * 60 * 24 * 30,
        y: 60 * 60 * 24 * 365
    }

    /**
     * Returns the current time in seconds
    */
    static now() {
        return Interval.toTime(Date.now())
    }

    /**
     * Converts JS timestamp microseconds to seconds
    */
    static toTime(time: number): number {
        if (!Number.isInteger(time)) throw ErrorManager.make('VDB_INTREVAL_TIME', { time })
        return Math.floor(time / 1000)
    }

    /**
     * Returns the transferred time rounded to precision accuracy
     * 
     * @param {number} precision Точность в секундах
     * @param {number} time Время для округления
    */
    static roundTime(time: number, precision: number) {
        if (!Number.isInteger(time)) throw ErrorManager.make('VDB_INTREVAL_TIME', { time })
        if (!Typing.isUInt(precision)) throw ErrorManager.make('VDB_INTREVAL_PRECISION', { precision })
        return time - (time % precision)
    }

    /**
     * Returns an array of dates at a certain interval (precision)
     * Looks like this:
     * | start | start + precission | start + precission * I| end |
     * 
    */
    static getIntervals(start: number, end: number, precision: number): Array<number> {
        if (start > end) throw ErrorManager.make('VDB_INTREVAL_SECTION', { start, end })
        start = Interval.roundTime(start, precision)
        end = Interval.roundTime(end, precision)
        if (start === end) [start]
        const ccount = (end - start) / precision
        const result = []
        for (let i = 0; i < ccount; i++) result.push(start + (i * precision))
        result.push(end)
        return result
    }

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
    static period(period: string): IPeriod {
        period = period.replace(/ /g, '')
        if (period.indexOf(':') === -1) throw ErrorManager.make('VDB_INTREVAL_PERIOD', { period })
        const parts = period.split(':')
        if (parts.length !== 2) throw ErrorManager.make('VDB_INTREVAL_PERIOD', { period })
        return {
            start: Interval.partOfPeriod(parts[0]),
            end: Interval.partOfPeriod(parts[1])
        }
    }

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
    static partOfPeriod(str: string) {
        str = str.replace(/ /g, '')
        if (str.indexOf('-') !== -1) return Interval.#operation(str.split('-'), 'sub')
        if (str.indexOf('+') !== -1) return Interval.#operation(str.split('+'), 'add')
        return Interval.#prepareInterval(str)
    }

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
    static retentions(str: string): Array<IRetention> {
        str = str.replace(/ /g, '')
        const result: Array<IRetention> = []
        if (str.indexOf(',') !== -1) {
            const retons = str.split(',')
            for (const sret of retons) result.push(Interval.#retention(sret))
        } else {
            result.push(Interval.#retention(str))
        }
        return result
    }

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
    static parseInterval(ival: string): number {
        const match = ival.match(/^(\d+)(\w+)$/);
        if (!match || !Interval.#map[match[2]]) throw ErrorManager.make('VDB_INTREVAL_PARSE', { interval: ival })
        return parseInt(match[1]) * Interval.#map[match[2]];
    }

    /**
     * Returns the interval (in seconds) for the "start" and "end" period to provide the number of metrics "count".
     * 
     * Can be used to simplify the derivation of fixed number metrics regardless of period size.
     * 
     * @param {number} start - Start of period in secodn
     * @param {number} end - end of period in secodn
     * @param {number} count - count of metrics
    */
    static getIntervalOfFixedCount(start: number, end: number, count: number): number {
        let cnt = Math.floor(Math.abs(start - end) / count)
        if (isNaN(cnt) || cnt < 1) cnt = 1
        return cnt
    }

    /**
     * Performs subtractions for each actet passed from `partOfPeriod`.
     * 
     * @see partOfPeriod
     * @param {Array<string>} acts Array of intervals of type now
     * @return {number} Interval
    */
    static #operation(acts: Array<string>, oper: string) {
        let result = 0
        for (let i = 0; i < acts.length; i++) {
            if (i === 0) {
                result = Interval.#prepareInterval(acts[i])
                continue
            }
            if (oper === 'sub') result -= Interval.#prepareInterval(acts[i])
            if (oper === 'add') result += Interval.#prepareInterval(acts[i])
        }
        return result
    }

    /**
     * Handles additional time objects, such as now
     * Since now is not part of the interval concept, it should not be included
     * in the parseInterval function, that's why this layer function was created
     * which handles additional time parameters
     * 
     * @todo to process the numerical time values
     * @see #operation()
     * @param {string} str String of interval
    */
    static #prepareInterval(str: string): number {
        if (str === 'now') return Interval.now()
        return Interval.parseInterval(str)
    }

    /**
     * Returns an object of type IRetention from a string of type '10s:1m'
     * 
     * @see retentions
     * @param {string} ret String of period
    */
    static #retention(ret: string): IRetention {
        const acts = ret.split(':');
        if (acts.length !== 2) throw ErrorManager.make('VDB_INTREVAL_RETENTION', { retention: ret })
        const newRet: IRetention = {
            interval: Interval.parseInterval(acts[0]),
            period: Interval.parseInterval(acts[1]),
            retention: ret
        }
        return newRet
    }

}
