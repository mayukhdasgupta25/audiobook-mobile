import { Stack } from 'expo-router';
import { colors } from '@/theme';

/**
 * Signup onboarding wizard stack (Age → Gender → Genres)
 */
export default function OnboardingLayout() {
   return (
      <Stack
         screenOptions={{
            headerShown: false,
            gestureEnabled: false,
            animation: 'slide_from_right',
            contentStyle: {
               backgroundColor: colors.background.dark,
            },
         }}
      />
   );
}
