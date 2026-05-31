import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { ParamListBase, RouteProp } from '@react-navigation/native';
import { scrollTabToTop } from '@/hooks/useTabScrollToTop';
import { getNavigationPathname } from '@/hooks/useTabNavigation';
import { createTabScrollToTopListener } from '@/utils/tabScrollToTopListener';

jest.mock('@/hooks/useTabScrollToTop', () => ({
   scrollTabToTop: jest.fn(),
}));

jest.mock('@/hooks/useTabNavigation', () => ({
   ...jest.requireActual('@/hooks/useTabNavigation'),
   getNavigationPathname: jest.fn(),
}));

const mockedScrollTabToTop = scrollTabToTop as jest.MockedFunction<typeof scrollTabToTop>;
const mockedGetNavigationPathname = getNavigationPathname as jest.MockedFunction<
   typeof getNavigationPathname
>;

function createMockNavigation(isFocused: boolean): BottomTabNavigationProp<ParamListBase> {
   return {
      isFocused: () => isFocused,
   } as BottomTabNavigationProp<ParamListBase>;
}

function createMockRoute(name: string): RouteProp<ParamListBase, string> {
   return { key: `${name}-key`, name } as RouteProp<ParamListBase, string>;
}

function fireTabPress(
   navigation: BottomTabNavigationProp<ParamListBase>,
   route: RouteProp<ParamListBase, string>
): { preventDefault: jest.Mock } {
   const event = { preventDefault: jest.fn() };
   const listener = createTabScrollToTopListener({ navigation, route });
   listener.tabPress(event);
   return event;
}

describe('createTabScrollToTopListener', () => {
   beforeEach(() => {
      jest.clearAllMocks();
   });

   it('does not scroll when switching to an inactive tab', () => {
      const event = fireTabPress(createMockNavigation(false), createMockRoute('index'));

      expect(mockedScrollTabToTop).not.toHaveBeenCalled();
      expect(event.preventDefault).not.toHaveBeenCalled();
   });

   it('scrolls to top and prevents default when re-tapping the active tab root', () => {
      mockedGetNavigationPathname.mockReturnValue('/(tabs)/index');
      const event = fireTabPress(createMockNavigation(true), createMockRoute('index'));

      expect(mockedScrollTabToTop).toHaveBeenCalledWith('index');
      expect(event.preventDefault).toHaveBeenCalledTimes(1);
   });

   it('does not scroll when re-tapping active tab while on a stack overlay', () => {
      mockedGetNavigationPathname.mockReturnValue('/details/abc123');
      const event = fireTabPress(createMockNavigation(true), createMockRoute('index'));

      expect(mockedScrollTabToTop).not.toHaveBeenCalled();
      expect(event.preventDefault).not.toHaveBeenCalled();
   });

   it('does not scroll when focused tab route does not match pathname route', () => {
      mockedGetNavigationPathname.mockReturnValue('/(tabs)/library');
      const event = fireTabPress(createMockNavigation(true), createMockRoute('index'));

      expect(mockedScrollTabToTop).not.toHaveBeenCalled();
      expect(event.preventDefault).not.toHaveBeenCalled();
   });
});
