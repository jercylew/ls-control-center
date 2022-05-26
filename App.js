import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import Devices from './views/devices';
import NetworkConfig from './views/network-config';
import Settings from './views/settings';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider as PaperProvider } from 'react-native-paper';
import store from './data/store';
import { Provider as StoreProvider, useSelector } from 'react-redux';
import { MqttProvider } from './api/mqtt-hooks';
import { selectScenes } from './data/device-slice';
import { Svg, G, Path } from 'react-native-svg';
import { colors } from './constants/colors';

const Tab = createBottomTabNavigator();

const MyTabs = () => {
  const scenes = useSelector(selectScenes);

  return (
    <Tab.Navigator
      initialRouteName="Devices"
      screenOptions={{
        tabBarActiveTintColor: colors.theme,
        tabBarStyle: [
          {
            display: 'flex',
          },
          null,
        ],
      }}>
      <Tab.Screen
        name="Devices"
        component={Devices}
        options={{
          tabBarLabel: '设备',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home" color={color} size={26} />
          ),
          headerTitle: '在线设备',
          headerTitleAlign: 'center',
          tabBarBadge: scenes.length > 1 ? scenes.length - 1 : scenes.length,
        }}
      />
      <Tab.Screen
        name="NetworkConfig"
        component={NetworkConfig}
        options={{
          tabBarLabel: '配网',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="wifi" color={color} size={26} />
          ),
          headerTitle: '网络配置',
          headerTitleAlign: 'center',
        }}
      />
      <Tab.Screen
        name="Settings"
        component={Settings}
        options={{
          tabBarLabel: '设置',
          tabBarIcon: ({ color, size }) => (
            <Svg height="32" width="32">
              <G
                transform="translate(0.000000,32.000000) scale(0.100000,-0.100000)"
                fill="#000000"
                stroke="none">
                <Path
                  fill={color}
                  stroke={color}
                  strokeWidth="4"
                  d="M78 288 c-23 -19 -68 -104 -68 -128 0 -24 45 -109 68 -127 21 -17
143 -17 164 0 23 18 68 103 68 127 0 24 -45 109 -68 128 -9 7 -44 12 -82 12
-38 0 -73 -5 -82 -12z m186 -71 l31 -57 -31 -58 -31 -57 -71 -3 -71 -3 -30 53
c-17 29 -31 60 -31 68 0 8 14 39 31 68 l30 53 71 -3 71 -3 31 -58z"
                />
                <Path
                  fill={color}
                  stroke={color}
                  strokeWidth="4"
                  d="M120 200 c-11 -11 -20 -29 -20 -40 0 -26 34 -60 60 -60 26 0 60 34
60 60 0 11 -9 29 -20 40 -11 11 -29 20 -40 20 -11 0 -29 -9 -40 -20z m70 -15
c26 -32 -13 -81 -47 -59 -23 14 -28 41 -13 59 16 19 44 19 60 0z"
                />
              </G>
            </Svg>
          ),
          headerTitle: '设置',
          headerTitleAlign: 'center',
        }}
      />
    </Tab.Navigator>
  );
};

export default function App() {
  return (
    <StoreProvider store={store}>
      <MqttProvider>
        <PaperProvider>
          <NavigationContainer>
            <MyTabs />
          </NavigationContainer>
        </PaperProvider>
      </MqttProvider>
    </StoreProvider>
  );
}
