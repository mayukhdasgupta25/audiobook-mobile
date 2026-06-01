/**
 * Apply Track Player progress to Redux only when values actually change.
 */
import type { AppDispatch } from '@/store';
import { store } from '@/store';
import { setPosition, setTotalDuration, setLoading } from '@/store/player';
import { clampPlaybackSeekSeconds } from '@/utils/playbackPosition';

const POSITION_EPSILON_SEC = 0.25;
const DURATION_EPSILON_SEC = 0.5;

export function syncTrackProgressToPlayerStore(
   dispatch: AppDispatch,
   position: number,
   duration: number
): void {
   const player = store.getState().player;

   const effectiveDuration =
      duration > 0 ? duration : player.totalDuration;
   const cappedPosition = clampPlaybackSeekSeconds(
      position,
      effectiveDuration,
      player.chapterEndPosition
   );

   if (Math.abs(player.playbackPosition - cappedPosition) >= POSITION_EPSILON_SEC) {
      dispatch(setPosition(cappedPosition));
   }

   if (
      effectiveDuration > 0 &&
      Math.abs(player.totalDuration - effectiveDuration) >= DURATION_EPSILON_SEC
   ) {
      dispatch(setTotalDuration(effectiveDuration));
   }

   if (player.isLoading) {
      dispatch(setLoading(false));
   }
}

export function clearPlayerLoadingIfNeeded(dispatch: AppDispatch): void {
   if (store.getState().player.isLoading) {
      dispatch(setLoading(false));
   }
}
