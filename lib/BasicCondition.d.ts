import AlertCondition from "./AlertCondtition";
import ICondition from "./ICondition";
export declare enum EConditionType {
    isAbove = "isAbove",
    isBelow = "isBelow",
    isEqual = "isEqual",
    outRange = "outRange",
    inRange = "inRange",
    noValue = "noValue"
}
export default class BasicCondition extends AlertCondition {
    condition: ICondition;
    /**
     * Add new condition
     *
     * The first time the condition is added, the operator is disregarded.
     * The operator defines how several conditions will be processed.
     * Each new condition will be processed in separate brackets and added
     * to the previous one via the specified operator.
     *
     * For example `(condition1) OR (condition2) AND (condition3)`.
     *
     * The type of condition determines not only the processing method, but also how many parameters will be required
     *
     * List of condition types:
     *
     * **isAbove** requiered 1 param
     * **isBelow** requiered 1 param,
     * **isEqual** requiered 1 param,
     * **outRange** requiered 2 params,
     * **inRange** requiered 2 params,
     * **noValue** requiered 0 param,
     *
     * @example condition('level','outRange', [1,2])
     *
     * @param level string level identify
     * @param type isAbove | isBelow | isEqual | outRange | inRange | noValue
     * @param params Array of params for current type
    */
    constructor(level: string, type: keyof typeof EConditionType, params: Array<number>);
    /**
     * Returns an array of areas whose intersection will trigger an alarm.
     * Each area consists of a beginning and an end (from smaller to larger).
     *
     * Example. [[3,5]] is an area from 3 to 5.
     *
     * Areas can start or end at infinity.
     *
     * For example [[null, 3], [5, null]] would mean - from minus infinity to 3 and from 5 to plus infinity
    */
    areas(): Array<Array<number | null>>;
    /**
     * Checks whether the data and the internal logic of the condition match.
     *
     * @param value Value of query result
    */
    check(value: number | null, id: string): boolean;
    /**
     * Returns an array containing a list of Y coordinates
    */
    threshholds(): number[];
    export(): ICondition;
    import(condition: ICondition): void;
}
