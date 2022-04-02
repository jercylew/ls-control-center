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

const Tab = createBottomTabNavigator();

const MyTabs = () => {
  const scenes = useSelector(selectScenes);

  return (
    <Tab.Navigator
      initialRouteName="Devices"
      screenOptions={{
        tabBarActiveTintColor: '#e91e63',
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
        }}
      />
      <Tab.Screen
        name="Settings"
        component={Settings}
        options={{
          tabBarLabel: '设置',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="send" color={color} size={26} />
          ),
          headerTitle: '设置',
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
