/**
 * Authentication Redux slice
 * Manages authentication state including accessToken and user data
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import * as SecureStore from 'expo-secure-store';
import { User } from '@/services/auth';

/**
 * Auth state interface
 */
export interface AuthState {
   accessToken: string | null;
   refreshToken: string | null;
   user: User | null;
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
   isAuthenticated: false,
   isInitialized: false,
};

/**
 * Secure storage keys
 */
const ACCESS_TOKEN_KEY = 'auth_access_token';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';
const USER_KEY = 'auth_user';

/**
 * Async thunk to initialize auth state from secure storage
 * Loads persisted accessToken, refreshToken, and user data on app startup
 */
export const initializeAuth = createAsyncThunk(
   'auth/initialize',
   async (): Promise<{ accessToken: string | null; refreshToken: string | null; user: User | null }> => {
      try {
         // Load accessToken from secure store
         const accessToken = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);

         // Load refreshToken from secure store
         const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);

         // Load user data from secure store (non-sensitive, but still stored securely)
         const userJson = await SecureStore.getItemAsync(USER_KEY);
         const user = userJson ? (JSON.parse(userJson) as User) : null;

         return {
            accessToken,
            refreshToken,
            user,
         };
      } catch (error) {
         console.error('Error initializing auth:', error);
         return {
            accessToken: null,
            refreshToken: null,
            user: null,
         };
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
       */
      setAuth: (
         state,
         action: PayloadAction<{ accessToken: string; refreshToken: string; user: User }>
      ) => {
         state.accessToken = action.payload.accessToken;
         state.refreshToken = action.payload.refreshToken;
         state.user = action.payload.user;
         state.isAuthenticated = true;

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
      },
      /**
       * Clear authentication state on logout
       */
      clearAuth: (state) => {
         state.accessToken = null;
         state.refreshToken = null;
         state.user = null;
         state.isAuthenticated = false;

         // Clear secure store
         SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY).catch((error) =>
            console.error('Error deleting access token:', error)
         );
         SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY).catch((error) =>
            console.error('Error deleting refresh token:', error)
         );
         SecureStore.deleteItemAsync(USER_KEY).catch((error) =>
            console.error('Error deleting user data:', error)
         );
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
            state.isAuthenticated = !!action.payload.accessToken;
            state.isInitialized = true;
         })
         .addCase(initializeAuth.rejected, (state) => {
            state.accessToken = null;
            state.refreshToken = null;
            state.user = null;
            state.isAuthenticated = false;
            state.isInitialized = true;
         });
   },
});

export const { setAuth, clearAuth } = authSlice.actions;
export default authSlice.reducer;

