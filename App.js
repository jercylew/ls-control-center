import React, {Component} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import Devices from './views/devices';
import NetworkConfig from './views/network-config';
import Settings from './views/settings';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {Provider as PaperProvider} from 'react-native-paper';
import store from './data/store';
import {Provider as StoreProvider} from 'react-redux';
import MQTT from 'sp-react-native-mqtt';
import {useDispatch} from 'react-redux';
import {syncDevice} from './data/device-slice';

const Tab = createBottomTabNavigator();
const TOPIC_DEV_STATUS = '$thing/up/status/sale_table';
const TOPIC_DEV_PROPERTY = '$thing/up/property/sale_table';

const MyTabs = () => {
  const dispatch = useDispatch();
  const [mqttClient, setMqttClient] = React.useState(null);

  const handleDevStatusReport = (devId, reportData) => {
    //device status
    let newDevice = {
      name: null,
      id: devId,
      scene_id: null,
      scene_name: null,
      is_heating: reportData.Is_Heating,
      is_up_water: reportData.Is_Up_water,
      net_type: reportData.NET_type,
      detection_temperature: reportData.Detection_temperature,
      water_level_detection: reportData.Water_level_detection,
      error: '',
    };
    console.log('Now try to sync to slice...');
    dispatch(syncDevice(newDevice));
  };
  const handleDevErrorReport = (devId, error) => {
    console.log('Device[' + devId + '], ' + ' error: ' + error);
  };
  const handleControlReply = (devId, status) => {
    console.log(
      'Device[' + devId + '], ' + ' control command reply: ' + status,
    );
  };

  const handleDevicePropertyReport = propData => {
    let newDevice = {
      name: propData.Device_Name,
      id: propData.device_id,
      scene_id: propData.Scene_Id,
      scene_name: propData.Scene_Name,
      is_heating: null,
      is_up_water: null,
      net_type: null,
      detection_temperature: null,
      water_level_detection: null,
      error: null,
    };
    dispatch(syncDevice(newDevice));
  };

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
        let dataJson = JSON.parse(msg.data);
        if (msg.topic === TOPIC_DEV_STATUS) {
          console.log('Device status');

          if ('method' in dataJson) {
            if (dataJson.method === 'report') {
              if ('params' in dataJson) {
                handleDevStatusReport(dataJson.device_id, dataJson.params);
              }
              if ('error' in dataJson) {
                handleDevErrorReport(dataJson.error);
              }
            } else if (dataJson.method === 'control_reply') {
              handleControlReply(dataJson.status);
            } else {
              console.log('Unsupported message');
            }
          }
        } else if (msg.topic === TOPIC_DEV_PROPERTY) {
          console.log('Device property');
          handleDevicePropertyReport(dataJson);
        } else {
          console.log(
            'Unknown message with topic:' + msg.topic + ', ignore it!',
          );
        }
      });

      client.on('connect', function () {
        console.log('connected');
        client.subscribe(TOPIC_DEV_STATUS, 0);
        client.subscribe(TOPIC_DEV_PROPERTY, 0);

        setMqttClient(client);
      });

      client.connect();
    })
    .catch(function (err) {
      console.log(err);
    });

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
};

export default function App() {
  return (
    <StoreProvider store={store}>
      <PaperProvider>
        <NavigationContainer>
          <MyTabs />
        </NavigationContainer>
      </PaperProvider>
    </StoreProvider>
  );
}
