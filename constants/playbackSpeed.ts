/** Supported playback speed multipliers */
export const PLAYBACK_SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.75] as const;

export type PlaybackSpeed = (typeof PLAYBACK_SPEED_OPTIONS)[number];

export const DEFAULT_PLAYBACK_SPEED: PlaybackSpeed = 1;

export function formatPlaybackSpeedLabel(speed: PlaybackSpeed): string {
   if (speed === 1) {
      return '1x';
   }
   return `${speed}x`;
}
