/**
 * Stops native playback and clears the TrackPlayer queue (safe when not initialized).
 */

import TrackPlayer from 'react-native-track-player';

export async function teardownTrackPlayerPlayback(): Promise<void> {
   try {
      await TrackPlayer.reset();
   } catch {
      // Player may not be initialized
   }
}
