import { Stack } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';

/**
 * Signup onboarding wizard stack (Age → Gender → Genres)
 */
export default function OnboardingLayout() {
   const { colors } = useTheme();

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
