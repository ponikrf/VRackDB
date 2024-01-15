"use strict";
/*
 * Copyright © 2023 Boris Bobylev. All rights reserved.
 * Licensed under the Apache License, Version 2.0
*/
Object.defineProperty(exports, "__esModule", { value: true });
class Typing {
    /**
     * Check the number is unsignet integer
     *
     * @param num check value
    */
    static isUInt(num) {
        if (Number.isInteger(num) && num > 0)
            return true;
        return false;
    }
    /**
     * Checks if a string is a name
     * Only Latin letters and dots are allowed
     * @param name check name string
    */
    static isName(name) {
        return /^[a-zA-Z0-9._*]+$/.test(name);
    }
}
exports.default = Typing;
