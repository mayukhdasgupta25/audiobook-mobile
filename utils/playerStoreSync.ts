/**
 * Apply Track Player progress to Redux only when values actually change.
 */
import type { AppDispatch } from '@/store';
import { store } from '@/store';
import { setPosition, setTotalDuration, setLoading } from '@/store/player';

const POSITION_EPSILON_SEC = 0.25;
const DURATION_EPSILON_SEC = 0.5;

export function syncTrackProgressToPlayerStore(
   dispatch: AppDispatch,
   position: number,
   duration: number
): void {
   const player = store.getState().player;

   if (Math.abs(player.playbackPosition - position) >= POSITION_EPSILON_SEC) {
      dispatch(setPosition(position));
   }

   if (duration > 0 && Math.abs(player.totalDuration - duration) >= DURATION_EPSILON_SEC) {
      dispatch(setTotalDuration(duration));
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
