import React from 'react';
import { View } from 'react-native';
import { showToast } from '@/utils/toast';

interface ErrorBoundaryProps {
   children: React.ReactNode;
}

interface ErrorBoundaryState {
   hasError: boolean;
}

export class ErrorBoundary extends React.Component<
   ErrorBoundaryProps,
   ErrorBoundaryState
> {
   state: ErrorBoundaryState = { hasError: false };

   static getDerivedStateFromError(): ErrorBoundaryState {
      return { hasError: true };
   }

   componentDidCatch(error: Error, info: React.ErrorInfo): void {
      console.error('[ErrorBoundary]', error, info.componentStack);
      showToast({
         message: 'Something went wrong. Please try again.',
         type: 'error',
      });
   }

   render() {
      if (this.state.hasError) {
         return <View style={{ flex: 1 }} />;
      }

      return this.props.children;
   }
}
