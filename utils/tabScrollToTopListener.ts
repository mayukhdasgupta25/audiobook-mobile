import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { ParamListBase, RouteProp } from '@react-navigation/native';
import { scrollTabToTop } from '@/hooks/useTabScrollToTop';

type TabListenerProps = {
   navigation: BottomTabNavigationProp<ParamListBase>;
   route: RouteProp<ParamListBase, string>;
};

/** Scroll to top when the user taps a tab bar icon for the visible tab screen. */
export function createTabScrollToTopListener({ navigation, route }: TabListenerProps) {
   return {
      tabPress: (event: { preventDefault: () => void }) => {
         if (navigation.isFocused()) {
            event.preventDefault();
         }
         scrollTabToTop(route.name);
      },
   };
}
