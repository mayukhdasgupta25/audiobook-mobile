/**
 * Authentication Redux slice
 * Manages authentication state including accessToken and user data
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import * as SecureStore from 'expo-secure-store';
import { User } from '@/services/auth';
import { getUserProfile, UserProfile } from '@/services/user';

/**
 * Auth state interface
 */
export interface AuthState {
   accessToken: string | null;
   refreshToken: string | null;
   user: User | null;
   userProfile: UserProfile | null;
   profileFetched: boolean;
   isAuthenticated: boolean;
   isInitialized: boolean;
}

/**
 * Initial auth state
 */
const initialState: AuthState = {
   accessToken: null,
   refreshToken: null,
   user: null,
   userProfile: null,
   profileFetched: false,
   isAuthenticated: false,
   isInitialized: false,
};

/**
 * Secure storage keys
 */
const ACCESS_TOKEN_KEY = 'auth_access_token';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';
const USER_KEY = 'auth_user';
const USER_PROFILE_KEY = 'auth_user_profile';

/**
 * Async thunk to initialize auth state from secure storage
 * Loads persisted accessToken, refreshToken, user data, and user profile on app startup
 */
export const initializeAuth = createAsyncThunk(
   'auth/initialize',
   async (): Promise<{
      accessToken: string | null;
      refreshToken: string | null;
      user: User | null;
      userProfile: UserProfile | null;
   }> => {
      try {
         // Load accessToken from secure store
         const accessToken = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);

         // Load refreshToken from secure store
         const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);

         // Load user data from secure store (non-sensitive, but still stored securely)
         const userJson = await SecureStore.getItemAsync(USER_KEY);
         const user = userJson ? (JSON.parse(userJson) as User) : null;

         // Load user profile from secure store
         const profileJson = await SecureStore.getItemAsync(USER_PROFILE_KEY);
         const userProfile = profileJson ? (JSON.parse(profileJson) as UserProfile) : null;

         return {
            accessToken,
            refreshToken,
            user,
            userProfile,
         };
      } catch (error) {
         console.error('Error initializing auth:', error);
         return {
            accessToken: null,
            refreshToken: null,
            user: null,
            userProfile: null,
         };
      }
   }
);

/**
 * Async thunk to fetch user profile
 * Calls the user profile API and stores the result in Redux state
 * Should only be called once after successful login
 */
export const fetchUserProfile = createAsyncThunk(
   'auth/fetchUserProfile',
   async (): Promise<UserProfile> => {
      try {
         const response = await getUserProfile();
         return response.data;
      } catch (error) {
         console.error('Error fetching user profile:', error);
         throw error;
      }
   }
);

/**
 * Auth slice with reducers and actions
 */
const authSlice = createSlice({
   name: 'auth',
   initialState,
   reducers: {
      /**
       * Set authentication state after successful login or signup
       * Clears previous user profile to ensure new account's profile replaces old one
       */
      setAuth: (
         state,
         action: PayloadAction<{ accessToken: string; refreshToken: string; user: User }>
      ) => {
         state.accessToken = action.payload.accessToken;
         state.refreshToken = action.payload.refreshToken;
         state.user = action.payload.user;
         state.isAuthenticated = true;

         // Clear previous user profile when new account logs in
         // This ensures multiple accounts on same device don't mix profiles
         state.userProfile = null;
         state.profileFetched = false;

         // Persist to secure store
         SecureStore.setItemAsync(ACCESS_TOKEN_KEY, action.payload.accessToken).catch(
            (error) => console.error('Error saving access token:', error)
         );
         SecureStore.setItemAsync(REFRESH_TOKEN_KEY, action.payload.refreshToken).catch(
            (error) => console.error('Error saving refresh token:', error)
         );
         SecureStore.setItemAsync(USER_KEY, JSON.stringify(action.payload.user)).catch(
            (error) => console.error('Error saving user data:', error)
         );

         // Clear previous user profile from SecureStore when new account logs in
         // New profile will be saved when fetchUserProfile completes
         SecureStore.deleteItemAsync(USER_PROFILE_KEY).catch((error) =>
            console.error('[Auth] Error clearing previous user profile from SecureStore:', error)
         );
      },
      /**
       * Clear authentication state on logout
       * Note: We keep userProfile in SecureStore even after logout so we can show
       * "Welcome Back" message for returning users. Profile is non-sensitive data.
       */
      clearAuth: (state) => {
         state.accessToken = null;
         state.refreshToken = null;
         state.user = null;
         state.userProfile = null;
         state.profileFetched = false;
         state.isAuthenticated = false;

         // Clear secure store (authentication tokens and user data)
         SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY).catch((error) =>
            console.error('Error deleting access token:', error)
         );
         SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY).catch((error) =>
            console.error('Error deleting refresh token:', error)
         );
         SecureStore.deleteItemAsync(USER_KEY).catch((error) =>
            console.error('Error deleting user data:', error)
         );
         // Keep userProfile in SecureStore for "Welcome Back" message
         // Only clear it if user explicitly deletes account
      },
   },
   extraReducers: (builder) => {
      builder
         .addCase(initializeAuth.pending, (state) => {
            state.isInitialized = false;
         })
         .addCase(initializeAuth.fulfilled, (state, action) => {
            state.accessToken = action.payload.accessToken;
            state.refreshToken = action.payload.refreshToken;
            state.user = action.payload.user;
            state.userProfile = action.payload.userProfile;
            state.profileFetched = !!action.payload.userProfile; // Mark as fetched if profile exists
            state.isAuthenticated = !!action.payload.accessToken;
            state.isInitialized = true;
         })
         .addCase(initializeAuth.rejected, (state) => {
            state.accessToken = null;
            state.refreshToken = null;
            state.user = null;
            state.isAuthenticated = false;
            state.isInitialized = true;
         })
         .addCase(fetchUserProfile.pending, () => {
            // Profile is being fetched, no state change needed
         })
         .addCase(fetchUserProfile.fulfilled, (state, action) => {
            state.userProfile = action.payload;
            state.profileFetched = true;
            // Persist user profile to secure store
            const profileJson = JSON.stringify(action.payload);
            SecureStore.setItemAsync(USER_PROFILE_KEY, profileJson).catch((error) => {
               console.error('[Auth] Error saving user profile to SecureStore:', error);
            });
         })
         .addCase(fetchUserProfile.rejected, (state) => {
            // On error, mark as fetched to prevent retry loops
            // Profile will remain null, but we won't keep trying
            state.profileFetched = true;
         });
   },
});

/**
 * Helper function to check if user profile exists in SecureStore
 * Used by sign-in screen to determine welcome message
 * @returns Promise<boolean> - true if profile exists, false otherwise
 */
export async function hasStoredUserProfile(): Promise<boolean> {
   try {
      const profileJson = await SecureStore.getItemAsync(USER_PROFILE_KEY);

      // Check if it's null, undefined, or the string "null"
      if (profileJson === null || profileJson === undefined || profileJson === 'null' || (typeof profileJson === 'string' && profileJson.trim() === '')) {
         return false;
      }

      // Try to parse it to ensure it's valid JSON
      try {
         const parsed = JSON.parse(profileJson);
         return !!parsed && typeof parsed === 'object' && !Array.isArray(parsed);
      } catch (parseError) {
         console.error('[Auth] Error parsing stored profile JSON:', parseError);
         return false;
      }
   } catch (error) {
      console.error('[Auth] Error checking stored user profile:', error);
      return false;
   }
}

export const { setAuth, clearAuth } = authSlice.actions;
export default authSlice.reducer;

