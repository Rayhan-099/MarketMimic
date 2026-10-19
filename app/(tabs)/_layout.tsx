import React from 'react';
import { Tabs } from 'expo-router';
import { useTheme } from '../../src/theme/ThemeContext.js';
import { Icon, type IconName } from '../../src/components/common/Icon.js';

interface TabBarIconProps {
  name: IconName;
  focused: boolean;
  color: string;
}

function TabBarIcon({ name, color }: TabBarIconProps): React.JSX.Element {
  return <Icon name={name} size={20} color={color} />;
}

export default function TabLayout(): React.JSX.Element {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bgSurface,
          borderTopColor: colors.borderSubtle,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: colors.brandPrimary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Watchlist',
          tabBarLabel: 'Watchlist',
          tabBarIcon: ({ focused, color }) => (
            <TabBarIcon name="watchlist" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarLabel: 'Search',
          tabBarIcon: ({ focused, color }) => (
            <TabBarIcon name="search" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarLabel: 'Orders',
          tabBarIcon: ({ focused, color }) => (
            <TabBarIcon name="orders" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="portfolio"
        options={{
          title: 'Portfolio',
          tabBarLabel: 'Portfolio',
          tabBarIcon: ({ focused, color }) => (
            <TabBarIcon name="portfolio" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarLabel: 'Settings',
          tabBarIcon: ({ focused, color }) => (
            <TabBarIcon name="settings" focused={focused} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
