import { useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useAtom, useSetAtom } from 'jotai';
import { MainTabParamList } from './types';
import { Employees, Home, Recruit } from '@/screens';
import { TabBar } from '@/components';
import { hydratePlayerAtom, isPlayerHydratedAtom } from '@/lib/jotai';

const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainTab = () => {
  const hydratePlayer = useSetAtom(hydratePlayerAtom);
  const [isPlayerHydrated] = useAtom(isPlayerHydratedAtom);

  useEffect(() => {
    void hydratePlayer();
  }, [hydratePlayer]);

  if (!isPlayerHydrated) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#A66A18" />
        <Text style={styles.loadingText}>회사 데이터를 불러오는 중...</Text>
      </View>
    );
  }

  return (
    <Tab.Navigator
      initialRouteName='Home'
      screenOptions={{
        headerShown: false,
      }}
      tabBar={props => <TabBar {...props} />}
    >
      <Tab.Screen name="Home" component={Home} options={{
        tabBarLabel: '홈',
      }}/>
      <Tab.Screen name="Recruit" component={Recruit} options={{
        tabBarLabel: '채용',
      }}/>
      <Tab.Screen name="Employees" component={Employees} options={{
        tabBarLabel: '직원',
      }}/>
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    backgroundColor: '#F7F0E5',
  },
  loadingText: { color: '#675A4D', fontSize: 15, fontWeight: '700' },
});
