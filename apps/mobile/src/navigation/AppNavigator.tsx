import React from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity, useWindowDimensions } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Borders } from '../constants/theme';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { SearchScreen } from '../screens/SearchScreen';
import { ResultsScreen } from '../screens/ResultsScreen';
import { WatchlistScreen } from '../screens/WatchlistScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { LoginScreen, RegisterScreen } from '../screens/AuthScreens';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { useAuthStore } from '../store/auth.store';
import { STORAGE_KEYS } from '../constants/app';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// ── Tab configuration ───────────────────────────────────────
interface TabConfigItem {
  label: string;
  emoji: string;
  testID: string;
}

const TAB_CONFIG: Record<string, TabConfigItem> = {
  Search: { label: 'HUNT', emoji: '🔍', testID: 'tab-hunt' },
  Watchlist: { label: 'ALERTS', emoji: '🔔', testID: 'tab-alerts' },
  History: { label: 'HISTORY', emoji: '📋', testID: 'tab-history' },
  Profile: { label: 'PROFILE', emoji: '👤', testID: 'tab-profile' },
};

// ── Custom Bottom Tab Bar ───────────────────────────────────
const CustomBottomTabBar: React.FC<any> = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 600;
  const isSmallPhone = width < 360;

  const emojiSize = isTablet ? 22 : isSmallPhone ? 18 : 20;
  const labelSize = isTablet ? 11 : isSmallPhone ? 8 : 9;
  const safeBottom = Math.max(insets.bottom, Platform.OS === 'android' ? 10 : 4);

  return (
    <View style={[tabStyles.barContainer, { paddingBottom: safeBottom }]}>
      <View style={tabStyles.tabsRow}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const config = TAB_CONFIG[route.name] || {
            label: (options.title ?? route.name).toUpperCase(),
            emoji: '•',
            testID: `tab-${route.name.toLowerCase()}`,
          };

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel ?? config.label}
              testID={options.tabBarTestID ?? config.testID}
              onPress={onPress}
              onLongPress={onLongPress}
              activeOpacity={0.75}
              style={[
                tabStyles.tabItem,
                isFocused && tabStyles.tabItemFocused,
              ]}
            >
              {/* Active top line accent indicator */}
              <View
                style={[
                  tabStyles.topIndicator,
                  isFocused && tabStyles.topIndicatorFocused,
                ]}
              />
              <View style={tabStyles.tabContent}>
                <Text style={[tabStyles.emoji, { fontSize: emojiSize, lineHeight: emojiSize + 4 }]}>
                  {config.emoji}
                </Text>
                <Text
                  style={[
                    tabStyles.label,
                    { fontSize: labelSize },
                    isFocused && tabStyles.labelFocused,
                  ]}
                  numberOfLines={1}
                >
                  {config.label}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

// ── Main bottom tab navigator ───────────────────────────────
const MainTabs: React.FC = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomBottomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Watchlist" component={WatchlistScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

// ── Root navigator ──────────────────────────────────────────
export const AppNavigator: React.FC = () => {
  const [initialRoute, setInitialRoute] = React.useState<string | null>(null);

  React.useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEYS.ONBOARDED).then((val) => {
      setInitialRoute(val === 'true' ? 'Main' : 'Onboarding');
    }).catch(() => {
      setInitialRoute('Main');
    });
  }, []);

  if (!initialRoute) {
    return <View style={{ flex: 1, backgroundColor: Colors.bgPrimary }} />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        {/* Onboarding */}
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />

        {/* Auth routes */}
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />

        {/* Main app */}
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen
          name="Results"
          component={ResultsScreen}
          options={{ animation: 'slide_from_bottom' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const tabStyles = StyleSheet.create({
  barContainer: {
    backgroundColor: Colors.ink,
    borderTopWidth: Borders.widthThick,
    borderTopColor: Colors.accentRed,
    elevation: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
  },
  tabsRow: {
    flexDirection: 'row',
    height: 56,
    alignItems: 'stretch',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  tabItemFocused: {
    backgroundColor: 'rgba(0, 212, 245, 0.08)',
  },
  topIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'transparent',
  },
  topIndicatorFocused: {
    backgroundColor: Colors.accentCyan,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    gap: 3,
  },
  emoji: {
    textAlign: 'center',
    includeFontPadding: false,
  },
  label: {
    fontWeight: Typography.black,
    color: Colors.inkLight,
    letterSpacing: 1.2,
    includeFontPadding: false,
    textAlign: 'center',
  },
  labelFocused: {
    color: Colors.accentCyan,
  },
});
