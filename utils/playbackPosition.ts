/**
 * Clamp helpers for in-app seeking and playback sync API payloads.
 */

/** RNTP/HLS may not seek to the exact reported duration */
const PLAYER_SEEK_END_MARGIN_SEC = 0.25;

/**
 * Maximum seekable seconds: min(duration cap, chapter endPosition from API).
 */
export function resolveMaxSeekableSeconds(
   durationSeconds: number,
   endPositionSeconds?: number | null
): number {
   if (durationSeconds <= 0) {
      return 0;
   }

   const durationCap = Math.max(0, durationSeconds - PLAYER_SEEK_END_MARGIN_SEC);

   if (
      endPositionSeconds == null ||
      !Number.isFinite(endPositionSeconds) ||
      endPositionSeconds <= 0
   ) {
      return durationCap;
   }

   const endCap = Math.max(0, endPositionSeconds - PLAYER_SEEK_END_MARGIN_SEC);
   return Math.min(durationCap, endCap);
}

/**
 * Maximum seconds the player/API can seek to for a chapter.
 */
export function getMaxSeekableSeconds(
   durationSeconds: number,
   endPositionSeconds?: number | null
): number {
   return resolveMaxSeekableSeconds(durationSeconds, endPositionSeconds);
}

/**
 * Seconds left until the seekable end (0 when at or past the cap).
 */
export function getPlaybackRemainingSeconds(
   position: number,
   durationSeconds: number,
   endPositionSeconds?: number | null
): number {
   const maxSeek = getMaxSeekableSeconds(durationSeconds, endPositionSeconds);
   return Math.max(0, Math.round(maxSeek - position));
}

/**
 * Progress ratio (0–1) corresponding to the seekable end of a chapter.
 */
export function getMaxSeekableProgress(
   durationSeconds: number,
   endPositionSeconds?: number | null
): number {
   if (durationSeconds <= 0) {
      return 0;
   }
   return getMaxSeekableSeconds(durationSeconds, endPositionSeconds) / durationSeconds;
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
export function progressToSeekSeconds(
   progress: number,
   durationSeconds: number,
   endPositionSeconds?: number | null
): number {
   if (durationSeconds <= 0) {
      return 0;
   }
   const clampedProgress = Math.max(0, Math.min(1, progress));
   return clampPlaybackSeekSeconds(
      clampedProgress * durationSeconds,
      durationSeconds,
      endPositionSeconds
   );
}

/**
 * Clamp a progress ratio so the UI never shows past the seekable end.
 */
export function clampScrubProgress(
   progress: number,
   durationSeconds: number,
   endPositionSeconds?: number | null
): number {
   const maxProgress = getMaxSeekableProgress(durationSeconds, endPositionSeconds);
   return Math.max(0, Math.min(maxProgress, progress));
}

/**
 * Clamp a seek target for local playback (TrackPlayer / Redux position).
 */
export function clampPlaybackSeekSeconds(
   position: number,
   durationSeconds: number,
   endPositionSeconds?: number | null
): number {
   if (!Number.isFinite(position) || position <= 0) {
      return 0;
   }
   const maxSeek = resolveMaxSeekableSeconds(durationSeconds, endPositionSeconds);
   if (durationSeconds <= 0 && maxSeek <= 0) {
      return position;
   }
   return Math.min(position, maxSeek);
}

/**
 * Normalize position sent to POST /playback/sync.
 * Seek actions must stay strictly before chapter duration; pause may use full duration.
 */
export function clampSyncPlaybackPosition(
   position: number,
   durationSeconds: number,
   action: 'play' | 'pause' | 'seek',
   endPositionSeconds?: number | null
): number {
   const safe = Math.max(0, Math.floor(position));
   if (durationSeconds <= 0) {
      return safe;
   }

   const durationCap = Math.max(0, Math.floor(durationSeconds));

   if (action === 'seek') {
      return Math.min(
         safe,
         Math.floor(getMaxSeekableSeconds(durationSeconds, endPositionSeconds))
      );
   }

   return Math.min(safe, durationCap);
}
