import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from './types';
import { Home, Recruit } from '@/screens';
import { TabBar } from '@/components';

const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainTab = () => {
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
    </Tab.Navigator>
  );
};
