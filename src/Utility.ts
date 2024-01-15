/*
 * Copyright © 2023 Boris Bobylev. All rights reserved.
 * Licensed under the Apache License, Version 2.0
*/

export default class Utility {
    static uid(){
        return  Math.random().toString(16).slice(2)
    }
}