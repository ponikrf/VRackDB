/*
 * Copyright © 2023 Boris Bobylev. All rights reserved.
 * Licensed under the Apache License, Version 2.0
*/

export default interface ICondition {
    readonly level: string;
    readonly id: string;
    readonly type: string;
    readonly params: Array<number>;
}
