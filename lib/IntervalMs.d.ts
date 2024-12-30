import Interval, { IPeriodMapInterface } from "./Interval";
/**
 * Extends the interval class to use milliseconds as the MTU
 *
 * @see Interval
*/
export default class IntervalMs extends Interval {
    /**
     * Multiplier for easy calculation of the number of MTUs for a period
    */
    protected static mint: number;
    protected static map: IPeriodMapInterface;
    protected static nowFactor: number;
}
