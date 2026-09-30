import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';
import { palette } from '../../src/constants/colors';

export default function TabsLayout() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: palette.greenMid,
        tabBarInactiveTintColor: isDark ? '#5A7A68' : '#94A3B8',
        tabBarStyle: {
          backgroundColor: isDark ? '#1A2922' : '#FFFFFF',
          borderTopColor:  isDark ? '#2A3F35' : '#E2E8F0',
          paddingBottom: 8,
          paddingTop: 4,
          height: 62,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color }) => <TabIcon emoji="🏠" color={color} />,
        }}
      />
      <Tabs.Screen
        name="walk"
        options={{
          title: 'Paseo',
          tabBarIcon: ({ color }) => <TabIcon emoji="🦮" color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Historial',
          tabBarIcon: ({ color }) => <TabIcon emoji="📊" color={color} />,
        }}
      />
      <Tabs.Screen
        name="family"
        options={{
          title: 'Familia',
          tabBarIcon: ({ color }) => <TabIcon emoji="👨‍👩‍👦" color={color} />,
        }}
      />
    </Tabs>
  );
}

function TabIcon({ emoji, color }: { emoji: string; color: string }) {
  const { Text } = require('react-native');
  return <Text style={{ fontSize: 22 }}>{emoji}</Text>;
}
