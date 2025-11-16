/**
 * Common type definitions used across the application
 */

/**
 * Generic result type for operations that can fail
 */
export type Result<T, E = Error> =
   | { success: true; data: T }
   | { success: false; error: E };

/**
 * Async result type
 */
export type AsyncResult<T, E = Error> = Promise<Result<T, E>>;

/**
 * Nullable type helper
 */
export type Nullable<T> = T | null;

/**
 * Optional type helper
 */
export type Optional<T> = T | undefined;

/**
 * Make specific properties optional
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Make specific properties required
 */
export type RequiredBy<T, K extends keyof T> = Omit<T, K> &
   Required<Pick<T, K>>;

/**
 * Navigation params type helper
 */
export type NavigationParams<T extends Record<string, unknown> = Record<string, unknown>> = T;

/**
 * Component props with children
 */
export interface ComponentWithChildren {
   children: React.ReactNode;
}

/**
 * Component props with optional children
 */
export interface ComponentWithOptionalChildren {
   children?: React.ReactNode;
}

