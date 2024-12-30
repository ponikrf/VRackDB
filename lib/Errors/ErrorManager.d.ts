import CoreError from "./CoreError";
/**
 * The class is the entry point for initializing exceptions
 *
 * It was decided to make one class instead of a bunch of small files of the same type *
 * with standard functionality
 */
declare class RegisteredErrorManager {
    private registeredList;
    /**
     * Registers the error type of the component
     * Before the error manager can create errors, the error type must be registered.
     *
     * @param {string} name Название компонента
     * @param {string} code Код ошибки
     * @param {string} short Короткий код ошибки
     * @param {string} description Описание ошибки
     *
    */
    register(code: string, short: string, description: string): void;
    /**
     * Error creation
     *
     * @param {string} short
    */
    make(err: Error, short: string, additional?: {}): CoreError;
    /**
     * Преобразует обычную ошибку в ошибку VRack
     *
     * @param {Error} error Ошибка для преобразования
    */
    convert(error: any): any;
    /**
     * Test error message
     *
     * @param func function for test
     * @param result Expected result short code
    */
    test(func: () => boolean, result: string): boolean;
    /**
     * Возвращает тип ошибки или null
     *
     * @param {string} short Короткий код ошибки или код ошибки поиска
    */
    private getRegistered;
}
declare const ErrorManager: RegisteredErrorManager;
export default ErrorManager;
