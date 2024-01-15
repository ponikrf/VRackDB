import AlertCondition from "./AlertCondtition";
import ICondition from "./ICondition";
import AlertQuery from "./AlertQuery";
import Database from "./Database";
/**
 * Alert status list
*/
export declare enum EAlertStatus {
    created = "created",
    updated = "updated",
    ok = "ok"
}
export interface IAlertingPoint {
    readonly path: string;
    readonly query: AlertQuery;
    readonly condition: AlertCondition;
    readonly additional: {
        [key: string]: any;
    };
    readonly id: string;
    status: keyof typeof EAlertStatus;
    count: number;
    created: number;
}
export interface IAlert {
    id: string;
    status: keyof typeof EAlertStatus;
    value: number | null;
    count: number;
    timestamp: number;
    created: number;
    condition: ICondition;
    areas: Array<Array<number | null>>;
    threshholds: Array<number>;
    additional: {
        [key: string]: any;
    };
}
/**
 * Simple implementation of data tracking to generate alarm messages
 *
 * Used with the AlertCondition and AlertQuery classes
*/
export default class Alerting {
    protected database: Database;
    protected listeners: Array<(alert: IAlert) => void>;
    /**
     * @param database VRack db database instance
     * */
    constructor(database: Database);
    /**
     * Alerting points
     * Each point have a unique ID
     * @see watch
    */
    protected points: {
        [key: string]: IAlertingPoint;
    };
    /**
     * List of watch timers
     * List item contain Array of point IDS
     * @see initTimer
    */
    protected timers: {
        [key: string]: Array<string>;
    };
    /**
     * Add listener for getting alert messages
     *
     * @param f function for listening
     * @see makeAlert
    */
    addListener(f: (alert: IAlert) => void): void;
    /**
     * Start watch of alert point
     *
     * Automatically queries the data at the specified `query` interval for the `path`
     * metric and checks the received data against `condition`.
     *
     * @param path Metric path in vrack database
     * @param query Query parameters
     * @param condition Condition settings class
     * @param id Unique id for this point. If you don't specify it, it will be filled in automatically
     * @param additional Additional information that will be specified in the created message
    */
    watch(path: string, query: AlertQuery, condition: AlertCondition, id: string, additional: {
        [key: string]: any;
    }): string;
    /**
     * Stop watching
     *
     * @see watch
     * @param id Unique id of point
    */
    unwatch(id: string): void;
    /**
     * Initializing the Data Refresh Timer
     *
     * @param id Unique id of point
    */
    protected initTimer(id: string): void;
    /**
     * Run a timer
     *
     * @see initTimer
     *
     * @param isec Timer evaluate interval in second
    */
    protected runTimer(isec: number): void;
    /**
     * Running a evaluate AlertPoint
     *
     * @param id Unique id of point
    */
    protected evaluate(id: string): void;
    /**
     * Return query result
     *
     * @param point Alert point
    */
    protected getQueryValue(point: IAlertingPoint): number | null;
    /**
     * Creates an alarm and sends information to all subscribers
     *
     * @param id UID of point
     * @param value alert evaluate value
     * @param point
    */
    protected makeAlert(id: string, value: number | null, point: IAlertingPoint): void;
}
