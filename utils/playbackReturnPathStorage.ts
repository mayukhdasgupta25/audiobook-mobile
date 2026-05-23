/**
 * Persists last in-app route during playback so notification tap can restore it
 * (+native-intent and cold start run before Redux is available).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const RETURN_PATH_KEY = '@audiobook/playbackReturnPath';
const AUDIOBOOK_ID_KEY = '@audiobook/playbackAudiobookId';

export async function persistPlaybackReturnPath(path: string | null): Promise<void> {
   if (path) {
      await AsyncStorage.setItem(RETURN_PATH_KEY, path);
   } else {
      await AsyncStorage.removeItem(RETURN_PATH_KEY);
   }
}

export async function getPersistedPlaybackReturnPath(): Promise<string | null> {
   const path = await AsyncStorage.getItem(RETURN_PATH_KEY);
   return path && path.length > 0 ? path : null;
}

export async function persistPlaybackAudiobookId(audiobookId: string | null): Promise<void> {
   if (audiobookId) {
      await AsyncStorage.setItem(AUDIOBOOK_ID_KEY, audiobookId);
   } else {
      await AsyncStorage.removeItem(AUDIOBOOK_ID_KEY);
   }
}

export async function getPersistedPlaybackAudiobookId(): Promise<string | null> {
   const id = await AsyncStorage.getItem(AUDIOBOOK_ID_KEY);
   return id && id.length > 0 ? id : null;
}

export async function resolvePersistedPlaybackRoute(): Promise<string | null> {
   const returnPath = await getPersistedPlaybackReturnPath();
   if (returnPath) {
      return returnPath;
   }
   const audiobookId = await getPersistedPlaybackAudiobookId();
   if (audiobookId) {
      return `/details/${audiobookId}`;
   }
   return null;
}
