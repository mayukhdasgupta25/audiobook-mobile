/**
 * Shared profile types used by auth-service and app-service profile APIs.
 */

export interface UserPreferences {
   theme: 'light' | 'dark';
   autoPlay: boolean;
   language: string;
   playbackSpeed: number;
   favoriteGenreIds?: string[];
   languages?: string[];
}

/** Location payload for PUT /auth/user/profile — latitude and longitude as strings. */
export interface ProfileLocationPayload {
   latitude: string;
   longitude: string;
}

/** @deprecated Use ProfileLocationPayload for API requests and DeviceLocationReading for GPS cache. */
export type UserLocation = ProfileLocationPayload;
