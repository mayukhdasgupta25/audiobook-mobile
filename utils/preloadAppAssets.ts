import * as Font from 'expo-font';
import { Ionicons } from '@expo/vector-icons';

/**
 * Preload vector icon fonts so header/tab icons render on the first frame.
 */
export async function preloadAppAssets(): Promise<void> {
   try {
      await Font.loadAsync(Ionicons.font);
   } catch (error) {
      console.warn('[preloadAppAssets] Failed to preload icon fonts:', error);
   }
}
