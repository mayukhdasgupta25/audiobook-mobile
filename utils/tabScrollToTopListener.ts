import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { ParamListBase, RouteProp } from '@react-navigation/native';
import { scrollTabToTop } from '@/hooks/useTabScrollToTop';
import {
   getNavigationPathname,
   getTabRouteFromPathname,
   isTabGroupPathname,
} from '@/hooks/useTabNavigation';

type TabListenerProps = {
   navigation: BottomTabNavigationProp<ParamListBase>;
   route: RouteProp<ParamListBase, string>;
};

/** Scroll to top when the user re-taps the active tab bar icon on that tab's root screen. */
export function createTabScrollToTopListener({ navigation, route }: TabListenerProps) {
   return {
      tabPress: (event: { preventDefault: () => void }) => {
         if (!navigation.isFocused()) {
            return;
         }

         const pathname = getNavigationPathname();
         if (!isTabGroupPathname(pathname)) {
            return;
         }

         if (getTabRouteFromPathname(pathname) !== route.name) {
            return;
         }

         event.preventDefault();
         scrollTabToTop(route.name);
      },
   };
}
