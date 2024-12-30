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
declare class CoreError extends Error {
    /** Flag that the error belongs to VRack */
    vError: boolean;
    /** Error code */
    vCode: string;
    /** Short code */
    vShort: string;
    /** List of additional parameters */
    vAdd: Array<string>;
    /** Nested errors */
    vAddErrors: Array<Error>;
    constructor(name: string, message: string, code: string, short: string);
    /**
     * Imports an error that came over the network as a JSON object
     * Uses objectify for the incoming object just in case
     *
     * @returns {CoreError} this после модификации
    */
    import(error: any): this;
    /**
     * Returns an object to be transmitted over the network
     * with preliminary conversion to JSON
    */
    export(): any;
    /**
     * Add nested error
     *
     * @param err Nested error
    */
    add(err: Error): this;
    /**
     * For Typescript it is used to retrieve an unknown
     * instance property after importing an incoming error
    */
    getUnknownProperty(field: string): any | undefined;
    /**
     *  Returns an object to be transmitted over the network
     *
     * @param {any} error Error for conversion to an object
     * */
    static objectify(error: any): any;
}
export default CoreError;
