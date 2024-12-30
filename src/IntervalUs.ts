/*
 * Copyright © 2024 Boris Bobylev. All rights reserved.
 * Licensed under the Apache License, Version 2.0
*/

import Interval, { IPeriodMapInterface } from "./Interval";

/**
 * Extends the interval class to use microseconds as the MTU
 * 
 * @see Interval
*/
export default class IntervalUs extends Interval {
    /**
     * Multiplier for easy calculation of the number of MTUs for a period
    */
    protected static mint = 1000000

    protected static map: IPeriodMapInterface = {
        mcs: 1,
        ms: 1000,
        s: 1 * this.mint,
        m: 60 * this.mint,
        h: 60 * 60 * this.mint,
        d: 60 * 60 * 24 * this.mint,
        w: 60 * 60 * 24 * 7 * this.mint,
        mon: 60 * 60 * 24 * 30 * this.mint,
        y: 60 * 60 * 24 * 365 * this.mint
    }

    protected static nowFactor = 1000
}
