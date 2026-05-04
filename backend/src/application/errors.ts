export class AppError extends Error {
    readonly code: string;
    readonly statusCode: number;

    constructor(code: string, message: string, statusCode: number) {
        super(message);
        this.name = 'AppError';
        this.code = code;
        this.statusCode = statusCode;
    }
}

export function isAppError(error: unknown): error is AppError {
    return (
        error !== null &&
        typeof error === 'object' &&
        (error as any).name === 'AppError' &&
        'code' in error &&
        'statusCode' in error &&
        typeof (error as any).statusCode === 'number'
    );
}
