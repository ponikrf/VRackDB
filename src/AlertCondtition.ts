/*
 * Copyright © 2023 Boris Bobylev. All rights reserved.
 * Licensed under the Apache License, Version 2.0
*/

import ICondition from "./ICondition";

export default abstract class AlertCondition {
    abstract condition: ICondition
    abstract areas(): Array<Array<number | null>>
    abstract check(value: number | null, id: string) : boolean
    abstract threshholds(): Array<number>
    export() { return this.condition }
    import(condition: ICondition) { this.condition = condition }
}