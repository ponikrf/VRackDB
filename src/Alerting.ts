/*
 * Copyright © 2023 Boris Bobylev. All rights reserved.
 * Licensed under the Apache License, Version 2.0
*/

import AlertCondition from "./AlertCondtition";
import ICondition from "./ICondition";
import AlertQuery from "./AlertQuery";
import SingleDB from "./SingleDB";
import ErrorManager from "./Errors/ErrorManager";
import Interval from "./Interval";
import MetricResult from "./MetricResult";
import Utility from "./Utility";

/**
 * Alert status list
*/
export enum EAlertStatus {
    created = 'created',
    updated = 'updated',
    ok = 'ok',
}

export interface IAlertingPoint {
    readonly path: string,
    readonly query: AlertQuery,
    readonly condition: AlertCondition,
    readonly additional: { [key: string]: any },
    readonly id: string
    status: keyof typeof EAlertStatus
    count: number
    created: number
}

export interface IAlert {
    id: string,
    status: keyof typeof EAlertStatus,
    value: number | null,
    count: number,
    timestamp: number,
    created: number,
    condition: ICondition,
    areas: Array<Array<number | null>>,
    threshholds: Array<number>,
    additional: { [key: string]: any }
}

ErrorManager.register('9gaaPv5DFoh5', 'VDB_ALERTING_DUBLICATE_UID', 'Dublicate key of watch point')

/**
 * Simple implementation of data tracking to generate alarm messages
 * 
 * Used with the AlertCondition and AlertQuery classes
*/
export default class Alerting {
    protected database: SingleDB
    protected listeners: Array<(alert: IAlert) => void> = []

    /**
     * @param database VRack db database instance
     * */
    constructor(database: SingleDB) {
        this.database = database
    }
    
    /**
     * Alerting points
     * Each point have a unique ID
     * @see watch
    */
    protected points: { [key: string]: IAlertingPoint } = {}

    /**
     * List of watch timers
     * List item contain Array of point IDS
     * @see initTimer
    */
    protected timers: { [key: string]: Array<string> } = {}


    /**
     * Add listener for getting alert messages
     * 
     * @param f function for listening
     * @see makeAlert
    */
    addListener(f: (alert: IAlert) => void) {
        this.listeners.push(f)
    }

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
    watch(path: string, query: AlertQuery, condition: AlertCondition, id: string, additional: { [key: string]: any }) {
        if (id === "") id = Utility.uid()
        if (this.points[id] !== undefined) throw ErrorManager.make(new Error, 'VDB_ALERTING_DUBLICATE_UID', { id })
        const fconf: IAlertingPoint = { status: 'ok',created: 0, path, query, condition, additional, id, count: 0 }
        this.points[id] = fconf
        this.initTimer(id)
        return id
    }

    /**
     * Stop watching
     * 
     * @see watch
     * @param id Unique id of point
    */
    unwatch(id: string) {
        if (this.points[id]) {
            const tInterval = this.points[id].query.getEvaluateInterval()
            const isec = Interval.parseInterval(tInterval);
            const timer = this.timers[isec]
            for (let i = 0; i < timer.length; i++) if (timer[i] === id) timer.splice(i, 1)
            delete this.points[id]
        }
    }

    /**
     * Initializing the Data Refresh Timer
     * 
     * @param id Unique id of point
    */
    protected initTimer(id: string) {
        const tInterval = this.points[id].query.query.evaluateInterval
        const isec = Interval.parseInterval(tInterval);
        if (this.timers[isec] === undefined) {
            this.timers[isec] = []
            setInterval(() => { this.runTimer(isec) }, isec * 1000)
        }
        this.timers[isec].push(id)
    }

    /**
     * Run a timer
     * 
     * @see initTimer
     * 
     * @param isec Timer evaluate interval in second 
    */
    protected runTimer(isec: number) {
        for (const id of this.timers[isec]) this.evaluate(id)
    }

    /**
     * Running a evaluate AlertPoint
     * 
     * @param id Unique id of point
    */
    protected evaluate(id: string) {
        const point = this.points[id]
        const value = this.getQueryValue(point)
        if (point.condition.check(value, id)) {
            point.count++
            if (point.status === 'ok'){
                point.status = "created"
                point.created = Math.floor(Date.now() / 1000)
                return this.makeAlert(id, value, point)
            }
            point.status = "updated"
            this.makeAlert(id, value, point)
        } else {
            if (point.status !== "ok") { 
                point.status = "ok" 
                point.count = 0
                this.makeAlert(id, value, point)
            }
        }
    }

    /**
     * Return query result 
     * 
     * @param point Alert point
    */
    protected getQueryValue(point: IAlertingPoint) {
        const query = point.query
        const qr = this.database.read(point.path, query.query.period, query.query.interval)
        return MetricResult.aggregate(qr, query.query.func)
    }

    /**
     * Creates an alarm and sends information to all subscribers
     * 
     * @param id UID of point
     * @param value alert evaluate value
     * @param point 
    */
    protected makeAlert(id: string, value: number | null, point: IAlertingPoint) {
        const nAlert: IAlert = {
            id, value, status: this.points[id].status,
            count: this.points[id].count,
            timestamp: Math.floor(Date.now() / 1000),
            created: this.points[id].created,
            condition: point.condition.condition,
            areas: point.condition.areas(),
            threshholds: point.condition.threshholds(),
            additional: point.additional
        }
        for (const f of this.listeners) f(nAlert)
    }
}