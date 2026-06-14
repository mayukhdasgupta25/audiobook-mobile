/**
 * Bridge between useAudioPlayer progress sync and useNextChapterPrefetch.
 */

export type NextChapterPrefetchProgressHandler = (
   position: number,
   duration: number
) => void;

let progressHandler: NextChapterPrefetchProgressHandler | null = null;

export function registerNextChapterPrefetchProgress(
   handler: NextChapterPrefetchProgressHandler | null
): void {
   progressHandler = handler;
}

export function notifyNextChapterPrefetchProgress(
   position: number,
   duration: number
): void {
   progressHandler?.(position, duration);
}
