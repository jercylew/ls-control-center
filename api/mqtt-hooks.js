import MQTT from 'sp-react-native-mqtt';
import {useDispatch} from 'react-redux';
import {syncDevice} from '../data/device-slice';
import React, {createContext, useState, useContext} from 'react';
import {strFromUnicode} from './unicode';

const TOPIC_DEV_STATUS = '$thing/up/status/sale_table';
const TOPIC_DEV_PROPERTY = '$thing/up/property/sale_table';
const UNKNOWN_SCENE_NAME = '未知场地';
const UNKNOWN_SCENE_ID = '00000-0000000000';

const MqttContext = createContext();

export const MqttProvider = ({children}) => {
  const [mqttClient, setMqttClient] = useState(null);
  const sendCommand = (topic, data) => {
    console.log('MQTT trying to send mqtt command:', data);
    mqttClient.publish(topic, data, 0, false);
  };

  const dispatch = useDispatch();

  const handleDevStatusReport = (devId, reportData) => {
    let newDevice = {
      name: null,
      id: devId,
      sceneId: null,
      sceneName: null,
      isHeating: reportData.Is_Heating,
      isUpWater: reportData.Is_Up_water,
      netType: reportData.NET_type,
      detectionTemperature: reportData.Detection_temperature,
      waterLevelDetection: reportData.Water_level_detection,
      errorWaterLevel: reportData.error_water_level,
      errorTemperature: reportData.error_temperature,
      maxWaterLevel: null,
      maxTemperature: null,
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
    let inSceneName = propData.Scene_Name;
    let inSceneId = propData.Scene_Id;
    if (
      propData.Scene_Name === null ||
      propData.Scene_Name === 'NA' ||
      propData.Scene_Name === ''
    ) {
      inSceneName = UNKNOWN_SCENE_NAME;
      inSceneId = UNKNOWN_SCENE_ID;
    } else {
      inSceneName = strFromUnicode(propData.Scene_Name);
    }

    let inDevName = propData.Device_Name;
    if (propData.Device_Name.length >= 4) {
      inDevName = strFromUnicode(propData.Device_Name);
    }

    let newDevice = {
      name: inDevName,
      id: propData.device_id,
      sceneId: inSceneId,
      sceneName: inSceneName,
      isHeating: null,
      isUpWater: null,
      netType: null,
      detectionTemperature: null,
      waterLevelDetection: null,
      errorWaterLevel: null,
      errorTemperature: null,
      maxWaterLevel: propData.params.Water_level_Threshold_Max,
      maxTemperature: propData.params.Temp_Threshold_Max,
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
