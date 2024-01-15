export default interface ICondition {
    readonly level: string;
    readonly id: string;
    readonly type: string;
    readonly params: Array<number>;
}
