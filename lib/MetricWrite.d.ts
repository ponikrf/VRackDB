/**
 * Helper for writing data to the database
*/
export default class MetricWrite {
    /**
     * Modifies the data before writing it to the database
     *
     * By default, the `last' function is used in the database *
     *
     * List of all modifiers:
     * - **last** - Permanently overwrites the metric index value
     * - **first** - Leaves the first metric value to be overwritten
     * - **max** - Overwrites the value if the new value is greater than the old one.
     * - **min** - Overwrites the value if the new value is less than the old value
     * - **avg** - Calculates the average value between the current value and the previous value.
     * - **sum** - Adds the current value to the past value
     *
     * @param {number} a Current index value
     * @param {number} b New index value
     * @param {string} func Modification function
     * @return {number} New index value
    */
    static modify(a: number, b: number, func: string): number;
}
