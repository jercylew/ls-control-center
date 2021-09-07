import MQTT from 'sp-react-native-mqtt';
import {useDispatch} from 'react-redux';
import {syncDevice} from '../data/device-slice';
import React, {createContext, useState, useContext} from 'react';

const TOPIC_DEV_STATUS = '$thing/up/status/sale_table';
const TOPIC_DEV_PROPERTY = '$thing/up/property/sale_table';
const UNKNOWN_SCENE_NAME = '未知场地';
const UNKNOWN_SCENE_ID = '00000-0000000000';

const MqttContext = createContext();

export const MqttProvider = ({children}) => {
  const [mqttClient, setMqttClient] = useState(null);
  const sendCommand = (topic, data) => {
    console.log('MQTT trying to send mqtt command:', data);
    mqttClient.publish(TOPIC_DEV_STATUS, data, 0, false);
  };

  const dispatch = useDispatch();

  const handleDevStatusReport = (devId, reportData) => {
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
    let in_scene_name = propData.Device_Name;
    let in_scene_id = propData.device_id;
    if (
      propData.Device_Name === null ||
      propData.Device_Name === 'NA' ||
      propData.Device_Name === ''
    ) {
      in_scene_name = UNKNOWN_SCENE_NAME;
      in_scene_id = UNKNOWN_SCENE_ID;
    }

    let newDevice = {
      name: propData.Device_Name,
      id: propData.device_id,
      scene_id: in_scene_id,
      scene_name: in_scene_name,
      is_heating: null,
      is_up_water: null,
      net_type: null,
      detection_temperature: null,
      water_level_detection: null,
      error: null,
    };
    dispatch(syncDevice(newDevice));
  };

  if (mqttClient === null) {
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
                  handleDevErrorReport(dataJson.device_id, dataJson.error);
                }
              } else if (dataJson.method === 'control_reply') {
                handleControlReply(dataJson.device_id, dataJson.status);
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
        });

        setMqttClient(client);
        client.connect();
      })
      .catch(function (err) {
        console.log(err);
      });
  } else {
    console.log('Mqtt already connected!');
  }

  return (
    <MqttContext.Provider value={{mqttClient, sendCommand}}>
      {children}
    </MqttContext.Provider>
  );
};

export const useMqttClient = () => useContext(MqttContext);
