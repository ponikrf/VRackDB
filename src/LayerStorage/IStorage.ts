/*
 * Copyright © 2023 Boris Bobylev. All rights reserved.
 * Licensed under the Apache License, Version 2.0
*/

import { Buffer } from "buffer";


export default interface IStorage
{
    buffer: Buffer
    readBuffer(index: number) : number
    writeBuffer(index: number, value: number) : void
}