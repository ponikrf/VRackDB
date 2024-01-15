/*
 * Copyright © 2023 Boris Bobylev. All rights reserved.
 * Licensed under the Apache License, Version 2.0
*/

/**
 * A base class for error realization with the ability to
 * Import and export error classes for client-server operations.
 * 
*/
class CoreError extends Error{
    vError = true
    vCode = ""
    vShort = ""
    vAdd: Array<string> = []
    vAddErrors: Array<CoreError> = []

    constructor(name: string, message: string, code: string, short: string) {
        super(message)
        this.name = name
        this.vCode = code
        this.vShort = short
    }
    
    /**
     * Imports an error that came over the network as a JSON object
     * Uses objectify for the incoming object just in case
     * 
     * @returns {CoreError} this после модификации
    */
    import(error: any) : this {
        const objectifyError = CoreError.objectify(error)
        Object.assign(this, objectifyError)
        return this
    }

    /**
     * Returns an object to be transmitted over the network with preliminary 
     * converted to JSON
    */
    export() : any {
        return CoreError.objectify(this)
    }


    add(err: CoreError) {
        this.vAddErrors.push(err)
        return this
    }

    /**
     * For Typescript is used to retrieve an unknown
     * instance property after importing an incoming error
    */
    getUnknownProperty(field:string): any | undefined {
        const dynamicKey = field as keyof CoreError;
        return this[dynamicKey]
    }

    /**
     * Returns an object to be transmitted over the network
     * 
     * @param {any} error Error to convert to an object
     * */
    static objectify(error: any) : any {
        const result: any = {}
        for (const key of Object.getOwnPropertyNames(error))  result[key] = error[key]
        return result
    }
}

export default CoreError