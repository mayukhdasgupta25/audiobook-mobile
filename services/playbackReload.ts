/**
 * Request the audio hook to reload the current chapter (e.g. after resume position update).
 */

let reloadChapterFn: (() => void) | null = null;

export function registerChapterReload(fn: (() => void) | null): void {
   reloadChapterFn = fn;
}

export function requestChapterReload(): void {
   reloadChapterFn?.();
}
