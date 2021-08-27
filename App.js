import React, {Component} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import Devices from './views/devices';
import NetworkConfig from './views/network-config';
import Settings from './views/settings';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {Provider as PaperProvider} from 'react-native-paper';
import MQTT from 'sp-react-native-mqtt';

const Tab = createBottomTabNavigator();

class MyTabs extends Component {
  constructor(props) {
    super(props);

    this.mqtt_client = null;

    MQTT.createClient({
      host: '118.24.201.167',
      port: 1883,
      user: 'tkt_iot_user',
      pass: 'tkt1qazm,./',
      auth: true,
      clientId: 'app-clt-0a1234ef5b',
    })
      .then(function (client) {
        client.on('closed', function () {
          console.log('mqtt.event.closed');
        });

        client.on('error', function (msg) {
          console.log('mqtt.event.error', msg);
        });

        client.on('message', function (msg) {
          console.log('mqtt.event.message', msg);
        });

        client.on('connect', function () {
          console.log('connected');
          client.subscribe('/data', 0);
          client.publish('/data', 'test', 0, false);
        });

        client.connect();
        this.mqtt_client = client;
      })
      .catch(function (err) {
        console.log(err);
      });
  }

  componentDidMount() {
    console.log('App didMount');
  }

  componentWillUnmount() {
    console.log('App willUnmount');
    if (this.mqtt_client) {
      this.mqtt_client.disconnect();
    }
  }

  onMessageArrived(message) {
    console.log('Message received from MQTT broker: ', message);
  }

  onConnectionLost() {
    console.log('Message received from MQTT broker: ');
  }

  render() {
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
            tabBarIcon: ({color, size}) => (
              <MaterialCommunityIcons name="home" color={color} size={26} />
            ),
            headerTitle: '在线设备',
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
            headerTitle: '网络配置',
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
            headerTitle: '设置',
          }}
        />
      </Tab.Navigator>
    );
  }
}

export default function App() {
  return (
    <PaperProvider>
      <NavigationContainer>
        <MyTabs />
      </NavigationContainer>
    </PaperProvider>
  );
}
