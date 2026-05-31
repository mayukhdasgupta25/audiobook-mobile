import { Stack } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';

/**
 * Nested stack for library list screens. Transition is handled by the root stack
 * when pushing the library group from tabs — no second slide here (avoids double animation).
 */
export default function LibraryStackLayout() {
   const { colors } = useTheme();

   return (
      <Stack
         screenOptions={{
            headerShown: false,
            animation: 'none',
            contentStyle: {
               backgroundColor: colors.background.screen,
            },
         }}
      />
   );
}
