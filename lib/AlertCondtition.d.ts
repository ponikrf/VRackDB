import ICondition from "./ICondition";
export default abstract class AlertCondition {
    abstract condition: ICondition;
    abstract areas(): Array<Array<number | null>>;
    abstract check(value: number | null, id: string): boolean;
    abstract threshholds(): Array<number>;
    export(): ICondition;
    import(condition: ICondition): void;
}
