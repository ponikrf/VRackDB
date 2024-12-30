/*
 * Copyright © 2024 Boris Bobylev. All rights reserved.
 * Licensed under the Apache License, Version 2.0
*/

/**
 * Base class for error realization with the ability to 
 * import and export error classes for client-server operations.
 * 
 * In VRack, a lot of things are transmitted over the network as JSON.  
 * Since pure errors are not converted to JSON, methods were made to export and 
 * import them while preserving the main important properties.
 * 
 * If the imported error has properties that are not in the base class,
 * they will be added. To get unknown properties you can use the function 
 * (for typescript) getUnknownProperty.
 * 
*/
class CoreError extends Error{

    /** Flag that the error belongs to VRack */
    vError = true

    /** Error code */
    vCode = ""

    /** Short code */
    vShort = ""

    /** List of additional parameters */
    vAdd: Array<string> = []

    /** Nested errors */
    vAddErrors: Array<Error> = []

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
     * Returns an object to be transmitted over the network 
     * with preliminary conversion to JSON
    */
    export() : any {
        return CoreError.objectify(this)
    }


    /**
     * Add nested error
     * 
     * @param err Nested error
    */
    add(err: Error) {
        this.vAddErrors.push(CoreError.objectify(err))
        return this
    }

    /**
     * For Typescript it is used to retrieve an unknown
     * instance property after importing an incoming error
    */
    getUnknownProperty(field:string): any | undefined {
        const dynamicKey = field as keyof CoreError;
        return this[dynamicKey]
    }

    /**
     *  Returns an object to be transmitted over the network
     * 
     * @param {any} error Error for conversion to an object
     * */
    static objectify(error: any) : any {
        const result: any = {}
        for (const key of Object.getOwnPropertyNames(error))  result[key] = error[key]
        return result
    }
}

export default CoreError