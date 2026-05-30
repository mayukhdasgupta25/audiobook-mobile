import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { useAudioPlayerControls } from '@/contexts/AudioPlaybackContext';

/**
 * Seek (and resume) playback when the user taps an @timestamp in a comment.
 * No-op when no chapter is loaded for this audiobook.
 */
export function useCommentTimestampSeek(audiobookId: string) {
   const { seekToTime, playPlayback } = useAudioPlayerControls();
   const currentChapterId = useSelector((state: RootState) => state.player.currentChapterId);
   const playerAudiobookId = useSelector((state: RootState) => state.player.audiobookId);
   const isPlaying = useSelector((state: RootState) => state.player.isPlaying);

   const canSeek = Boolean(currentChapterId && playerAudiobookId === audiobookId);

   const seekToCommentTimestamp = useCallback(
      (positionSeconds: number) => {
         if (!canSeek) return;
         void seekToTime(positionSeconds);
         if (!isPlaying) {
            void playPlayback();
         }
      },
      [canSeek, seekToTime, playPlayback, isPlaying]
   );

   return { seekToCommentTimestamp, canSeek };
}
