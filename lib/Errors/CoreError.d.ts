/**
 * A base class for error realization with the ability to
 * Import and export error classes for client-server operations.
 *
*/
declare class CoreError extends Error {
    vError: boolean;
    vCode: string;
    vShort: string;
    vAdd: Array<string>;
    vAddErrors: Array<CoreError>;
    constructor(name: string, message: string, code: string, short: string);
    /**
     * Imports an error that came over the network as a JSON object
     * Uses objectify for the incoming object just in case
     *
     * @returns {CoreError} this после модификации
    */
    import(error: any): this;
    /**
     * Returns an object to be transmitted over the network with preliminary
     * converted to JSON
    */
    export(): any;
    add(err: CoreError): this;
    /**
     * For Typescript is used to retrieve an unknown
     * instance property after importing an incoming error
    */
    getUnknownProperty(field: string): any | undefined;
    /**
     * Returns an object to be transmitted over the network
     *
     * @param {any} error Error to convert to an object
     * */
    static objectify(error: any): any;
}
export default CoreError;
