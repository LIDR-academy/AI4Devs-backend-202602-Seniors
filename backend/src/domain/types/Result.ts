export type Success<T> = { success: true; value: T };
export type Failure<E> = { success: false; error: E };
export type Result<T, E = string> = Success<T> | Failure<E>;

export const Result = {
    ok: <T>(value: T): Success<T> => ({ success: true, value }),
    fail: <E>(error: E): Failure<E> => ({ success: false, error }),
};
