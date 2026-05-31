/**
 * Clamp helpers for in-app seeking and playback sync API payloads.
 */

/** RNTP/HLS may not seek to the exact reported duration */
const PLAYER_SEEK_END_MARGIN_SEC = 0.25;

/**
 * Maximum seconds the player/API can seek to for a chapter.
 */
export function getMaxSeekableSeconds(durationSeconds: number): number {
   if (durationSeconds <= 0) {
      return 0;
   }
   return clampPlaybackSeekSeconds(durationSeconds, durationSeconds);
}

/**
 * Progress ratio (0–1) corresponding to the seekable end of a chapter.
 */
export function getMaxSeekableProgress(durationSeconds: number): number {
   if (durationSeconds <= 0) {
      return 0;
   }
   return getMaxSeekableSeconds(durationSeconds) / durationSeconds;
}

/**
 * Map a touch X coordinate on the track to a clamped progress ratio.
 */
export function progressFromTouchX(touchX: number, barWidth: number): number {
   if (!Number.isFinite(touchX) || barWidth <= 0) {
      return 0;
   }
   return Math.max(0, Math.min(1, touchX / barWidth));
}

/**
 * Convert a progress ratio to seek seconds, capped at the seekable end.
 */
export function progressToSeekSeconds(progress: number, durationSeconds: number): number {
   if (durationSeconds <= 0) {
      return 0;
   }
   const clampedProgress = Math.max(0, Math.min(1, progress));
   return clampPlaybackSeekSeconds(clampedProgress * durationSeconds, durationSeconds);
}

/**
 * Clamp a progress ratio so the UI never shows past the seekable end.
 */
export function clampScrubProgress(progress: number, durationSeconds: number): number {
   const maxProgress = getMaxSeekableProgress(durationSeconds);
   return Math.max(0, Math.min(maxProgress, progress));
}

/**
 * Clamp a seek target for local playback (TrackPlayer / Redux position).
 */
export function clampPlaybackSeekSeconds(
   position: number,
   durationSeconds: number
): number {
   if (!Number.isFinite(position) || position <= 0) {
      return 0;
   }
   if (durationSeconds <= 0) {
      return position;
   }
   const maxSeek = Math.max(0, durationSeconds - PLAYER_SEEK_END_MARGIN_SEC);
   return Math.min(position, maxSeek);
}

/**
 * Normalize position sent to POST /playback/sync.
 * Seek actions must stay strictly before chapter duration; pause may use full duration.
 */
export function clampSyncPlaybackPosition(
   position: number,
   durationSeconds: number,
   action: 'play' | 'pause' | 'seek'
): number {
   const safe = Math.max(0, Math.floor(position));
   if (durationSeconds <= 0) {
      return safe;
   }

   const durationCap = Math.max(0, Math.floor(durationSeconds));

   if (action === 'seek') {
      return Math.min(safe, Math.max(0, durationCap - 1));
   }

   return Math.min(safe, durationCap);
}
