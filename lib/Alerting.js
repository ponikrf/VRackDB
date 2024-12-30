"use strict";
/*
 * Copyright © 2023 Boris Bobylev. All rights reserved.
 * Licensed under the Apache License, Version 2.0
*/
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EAlertStatus = void 0;
const ErrorManager_1 = __importDefault(require("./Errors/ErrorManager"));
const Interval_1 = __importDefault(require("./Interval"));
const MetricResult_1 = __importDefault(require("./MetricResult"));
const Utility_1 = __importDefault(require("./Utility"));
/**
 * Alert status list
*/
var EAlertStatus;
(function (EAlertStatus) {
    EAlertStatus["created"] = "created";
    EAlertStatus["updated"] = "updated";
    EAlertStatus["ok"] = "ok";
})(EAlertStatus = exports.EAlertStatus || (exports.EAlertStatus = {}));
ErrorManager_1.default.register('9gaaPv5DFoh5', 'VDB_ALERTING_DUBLICATE_UID', 'Dublicate key of watch point');
/**
 * Simple implementation of data tracking to generate alarm messages
 *
 * Used with the AlertCondition and AlertQuery classes
*/
class Alerting {
    /**
     * @param database VRack db database instance
     * */
    constructor(database) {
        this.listeners = [];
        /**
         * Alerting points
         * Each point have a unique ID
         * @see watch
        */
        this.points = {};
        /**
         * List of watch timers
         * List item contain Array of point IDS
         * @see initTimer
        */
        this.timers = {};
        this.database = database;
    }
    /**
     * Add listener for getting alert messages
     *
     * @param f function for listening
     * @see makeAlert
    */
    addListener(f) {
        this.listeners.push(f);
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
    watch(path, query, condition, id, additional) {
        if (id === "")
            id = Utility_1.default.uid();
        if (this.points[id] !== undefined)
            throw ErrorManager_1.default.make(new Error, 'VDB_ALERTING_DUBLICATE_UID', { id });
        const fconf = { status: 'ok', created: 0, path, query, condition, additional, id, count: 0 };
        this.points[id] = fconf;
        this.initTimer(id);
        return id;
    }
    /**
     * Stop watching
     *
     * @see watch
     * @param id Unique id of point
    */
    unwatch(id) {
        if (this.points[id]) {
            const tInterval = this.points[id].query.getEvaluateInterval();
            const isec = Interval_1.default.parseInterval(tInterval);
            const timer = this.timers[isec];
            for (let i = 0; i < timer.length; i++)
                if (timer[i] === id)
                    timer.splice(i, 1);
            delete this.points[id];
        }
    }
    /**
     * Initializing the Data Refresh Timer
     *
     * @param id Unique id of point
    */
    initTimer(id) {
        const tInterval = this.points[id].query.query.evaluateInterval;
        const isec = Interval_1.default.parseInterval(tInterval);
        if (this.timers[isec] === undefined) {
            this.timers[isec] = [];
            setInterval(() => { this.runTimer(isec); }, isec * 1000);
        }
        this.timers[isec].push(id);
    }
    /**
     * Run a timer
     *
     * @see initTimer
     *
     * @param isec Timer evaluate interval in second
    */
    runTimer(isec) {
        for (const id of this.timers[isec])
            this.evaluate(id);
    }
    /**
     * Running a evaluate AlertPoint
     *
     * @param id Unique id of point
    */
    evaluate(id) {
        const point = this.points[id];
        const value = this.getQueryValue(point);
        if (point.condition.check(value, id)) {
            point.count++;
            if (point.status === 'ok') {
                point.status = "created";
                point.created = Math.floor(Date.now() / 1000);
                return this.makeAlert(id, value, point);
            }
            point.status = "updated";
            this.makeAlert(id, value, point);
        }
        else {
            if (point.status !== "ok") {
                point.status = "ok";
                point.count = 0;
                this.makeAlert(id, value, point);
            }
        }
    }
    /**
     * Return query result
     *
     * @param point Alert point
    */
    getQueryValue(point) {
        const query = point.query;
        const qr = this.database.read(point.path, query.query.period, query.query.interval);
        return MetricResult_1.default.aggregate(qr, query.query.func);
    }
    /**
     * Creates an alarm and sends information to all subscribers
     *
     * @param id UID of point
     * @param value alert evaluate value
     * @param point
    */
    makeAlert(id, value, point) {
        const nAlert = {
            id, value, status: this.points[id].status,
            count: this.points[id].count,
            timestamp: Math.floor(Date.now() / 1000),
            created: this.points[id].created,
            condition: point.condition.condition,
            areas: point.condition.areas(),
            threshholds: point.condition.threshholds(),
            additional: point.additional
        };
        for (const f of this.listeners)
            f(nAlert);
    }
}
exports.default = Alerting;
