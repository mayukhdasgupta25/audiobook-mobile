/**
 * Keeps useAudioPlayer mounted app-wide so playback, progress polling, and remote handlers
 * stay active when the player UI is hidden.
 */

import React, { createContext, useContext, type PropsWithChildren } from 'react';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';

export type AudioPlaybackControls = ReturnType<typeof useAudioPlayer>;

const AudioPlaybackContext = createContext<AudioPlaybackControls | null>(null);

export function AudioPlaybackProvider({ children }: PropsWithChildren): React.ReactElement {
   const controls = useAudioPlayer();

   return (
      <AudioPlaybackContext.Provider value={controls}>
         {children}
      </AudioPlaybackContext.Provider>
   );
}

export function useAudioPlayerControls(): AudioPlaybackControls {
   const context = useContext(AudioPlaybackContext);
   if (!context) {
      throw new Error('useAudioPlayerControls must be used within AudioPlaybackProvider');
   }
   return context;
}
