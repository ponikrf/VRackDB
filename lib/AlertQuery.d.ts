import { EAggregateFunctions } from "./MetricResult";
export interface IAlertQuery {
    readonly evaluateInterval: string;
    readonly interval: string;
    readonly period: string;
    readonly func: string;
}
export default class AlertQuery {
    query: IAlertQuery;
    getEvaluateInterval(): string;
    /**
     * Set the query parameters.
     * Defines the data set to be evaluated.
     * It is recommended to select parameters taking into account the set evaluation interval.
     * For example, you should not take a period shorter than the set evaluation interval.
     * It is recommended to select the query interval as close to the layer accuracy as possible.
     * The `func` function will be applied to the obtained query result
     *
     * @param evaluateInterval Sets the interval at which the data will be evaluated.
     * @param interval Interval of query use standart interval format
     * @param period Period of query. For example 'now-1d:now' @see Interval.period
     * @param func Aggregation function of query. @see MetricResult.aggregate
    */
    constructor(evaluateInterval: string, interval: string, period: string, func: keyof typeof EAggregateFunctions);
    export(): IAlertQuery;
    import(query: IAlertQuery): void;
}
