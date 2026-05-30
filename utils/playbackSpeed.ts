import {
   PLAYBACK_SPEED_OPTIONS,
   type PlaybackSpeed,
   DEFAULT_PLAYBACK_SPEED,
} from '@/constants/playbackSpeed';

export function isPlaybackSpeed(value: number): value is PlaybackSpeed {
   return (PLAYBACK_SPEED_OPTIONS as readonly number[]).includes(value);
}

function indexOfSpeed(speed: PlaybackSpeed): number {
   const index = PLAYBACK_SPEED_OPTIONS.indexOf(speed);
   return index >= 0 ? index : PLAYBACK_SPEED_OPTIONS.indexOf(DEFAULT_PLAYBACK_SPEED);
}

export function getNextPlaybackSpeed(current: PlaybackSpeed): PlaybackSpeed {
   const nextIndex = (indexOfSpeed(current) + 1) % PLAYBACK_SPEED_OPTIONS.length;
   return PLAYBACK_SPEED_OPTIONS[nextIndex];
}

export function getPreviousPlaybackSpeed(current: PlaybackSpeed): PlaybackSpeed {
   const index = indexOfSpeed(current);
   const prevIndex =
      (index - 1 + PLAYBACK_SPEED_OPTIONS.length) % PLAYBACK_SPEED_OPTIONS.length;
   return PLAYBACK_SPEED_OPTIONS[prevIndex];
}
