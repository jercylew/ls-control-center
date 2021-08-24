import React, {Component} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createMaterialBottomTabNavigator} from '@react-navigation/material-bottom-tabs';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Devices from './views/devices';
import NetworkConfig from './views/network-config';
import Settings from './views/settings';
import {MqttUtility} from './api/mqtt-wrapper';

const Tab = createMaterialBottomTabNavigator();

class MyTabs extends Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    this.mqttUtility = new MqttUtility({
      mqtt_broker_address: '',
      mqtt_user: '',
      mqtt_password: '',
      mqtt_client_id: '',
      mqtt_port: 1883,
      callback_on_message: this.onMqttMessageReceived,
    });

    console.log('App didMount');
  }

  componentWillUnmount() {
    this.mqttUtility.close();
    console.log('App willUnmount');
  }

  onMqttMessageReceived(message) {
    console.log('Message received from MQTT broker: ', message);
  }

  render() {
    return (
      <Tab.Navigator
        initialRouteName="Devices"
        tabBarOptions={{
          activeTintColor: '#e91e63',
        }}>
        <Tab.Screen
          name="Devices"
          component={Devices}
          options={{
            tabBarLabel: '设备',
            tabBarIcon: ({color, size}) => (
              <MaterialCommunityIcons name="home" color={color} size={26} />
            ),
            tabBarBadge: 4,
          }}
        />
        <Tab.Screen
          name="NetworkConfig"
          component={NetworkConfig}
          options={{
            tabBarLabel: '配网',
            tabBarIcon: ({color, size}) => (
              <MaterialCommunityIcons name="wifi" color={color} size={26} />
            ),
          }}
        />
        <Tab.Screen
          name="Settings"
          component={Settings}
          options={{
            tabBarLabel: '设置',
            tabBarIcon: ({color, size}) => (
              <MaterialCommunityIcons name="send" color={color} size={26} />
            ),
          }}
        />
      </Tab.Navigator>
    );
  }
}

export default function App() {
  return (
    <NavigationContainer>
      <MyTabs />
    </NavigationContainer>
  );
}
