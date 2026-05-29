/**
 * Temporary context when auth is blocked by the subscription device limit.
 */

import { create } from 'zustand';
import type { RegisteredDevice } from '@/utils/authApiErrors';

interface DeviceLimitState {
   message: string | null;
   maxDevices: number | null;
   registeredDevices: RegisteredDevice[];
   setContext: (context: {
      message: string;
      maxDevices: number | null;
      registeredDevices: RegisteredDevice[];
   }) => void;
   setRegisteredDevices: (devices: RegisteredDevice[]) => void;
   clearContext: () => void;
}

export const useDeviceLimitStore = create<DeviceLimitState>((set) => ({
   message: null,
   maxDevices: null,
   registeredDevices: [],
   setContext: ({ message, maxDevices, registeredDevices }) =>
      set({ message, maxDevices, registeredDevices }),
   setRegisteredDevices: (registeredDevices) => set({ registeredDevices }),
   clearContext: () =>
      set({ message: null, maxDevices: null, registeredDevices: [] }),
}));
