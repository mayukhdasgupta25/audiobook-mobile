import React, {
   createContext,
   useCallback,
   useContext,
   useEffect,
   useRef,
   useState,
} from 'react';
import {
   registerToastListener,
   TOAST_DURATION_MS,
   type ToastPayload,
   type ToastType,
} from '@/utils/toast';

export interface ToastState {
   message: string;
   type: ToastType;
   visible: boolean;
}

interface ToastContextValue {
   toast: ToastState | null;
   show: (payload: ToastPayload) => void;
   hide: () => void;
   clear: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
   const [toast, setToast] = useState<ToastState | null>(null);
   const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

   const hide = useCallback(() => {
      if (hideTimerRef.current) {
         clearTimeout(hideTimerRef.current);
         hideTimerRef.current = null;
      }
      setToast((current) => (current ? { ...current, visible: false } : null));
   }, []);

   const clear = useCallback(() => {
      setToast(null);
   }, []);

   const show = useCallback(
      (payload: ToastPayload) => {
         if (hideTimerRef.current) {
            clearTimeout(hideTimerRef.current);
         }

         const type = payload.type ?? 'success';
         setToast({ message: payload.message, type, visible: true });

         hideTimerRef.current = setTimeout(() => {
            hide();
         }, payload.durationMs ?? TOAST_DURATION_MS);
      },
      [hide]
   );

   useEffect(() => {
      registerToastListener(show);
      return () => {
         registerToastListener(null);
         if (hideTimerRef.current) {
            clearTimeout(hideTimerRef.current);
         }
      };
   }, [show]);

   return (
      <ToastContext.Provider value={{ toast, show, hide, clear }}>
         {children}
      </ToastContext.Provider>
   );
}

export function useToastContext(): ToastContextValue {
   const context = useContext(ToastContext);
   if (!context) {
      throw new Error('useToastContext must be used within ToastProvider');
   }
   return context;
}
