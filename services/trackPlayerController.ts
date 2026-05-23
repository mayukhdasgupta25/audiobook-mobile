/**
 * Imperative bridge between RNTP playback service and useAudioPlayer (no hooks in service).
 */

export interface TrackPlayerHandlers {
   seekToTime: (seconds: number) => void;
   seekBy: (seconds: number) => void;
   skipToNextChapter: () => Promise<void>;
   skipToPreviousChapter: () => Promise<void>;
}

let handlers: TrackPlayerHandlers | null = null;
let isDraggingProgress = false;

export function registerTrackPlayerHandlers(next: TrackPlayerHandlers | null): void {
   handlers = next;
}

export function setTrackPlayerDragging(dragging: boolean): void {
   isDraggingProgress = dragging;
}

export function getIsDragging(): boolean {
   return isDraggingProgress;
}

export function seekToTime(seconds: number): void {
   handlers?.seekToTime(seconds);
}

export function seekBy(seconds: number): void {
   handlers?.seekBy(seconds);
}

export async function skipToNextChapter(): Promise<void> {
   await handlers?.skipToNextChapter();
}

export async function skipToPreviousChapter(): Promise<void> {
   await handlers?.skipToPreviousChapter();
}
