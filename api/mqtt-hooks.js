import MQTT from 'sp-react-native-mqtt';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { useDispatch } from 'react-redux';
import {
  syncDevice,
  DEV_TYPE_REFRIGERATOR,
  DEV_TYPE_SALE_TABLE,
} from '../data/device-slice';
import React, { createContext, useState, useContext, useEffect } from 'react';
import { strFromUnicode } from './unicode';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOPIC_SALE_TABLE_STATUS = '$thing/up/status/sale_table';
const TOPIC_SALE_TABLE_PROPERTY = '$thing/up/property/sale_table';
const TOPIC_REFRG_STATUS = '$thing/up/status/refrigerator';
const TOPIC_REFRG_PROPERTY = '$thing/up/property/refrigerator';
const UNKNOWN_SCENE_NAME = '未知场地';
const UNKNOWN_SCENE_ID = '00000-0000000000';
const DEVICE_TIMER_ID_KEY = 'dev-timer-id';

const MqttContext = createContext();

export const MqttProvider = ({ children }) => {
  const [mqttClient, setMqttClient] = useState(null);
  const sendCommand = (topic, data) => {
    console.log('MQTT trying to send mqtt command:', data);
    mqttClient.publish(topic, data, 0, false);
  };

  const dispatch = useDispatch();

  const resetDeviceTimerIds = async () => {
    try {
      const strExistingDevTimerIds = await AsyncStorage.getItem(
        DEVICE_TIMER_ID_KEY,
      );
      console.log('resetDeviceTimerIds: ', strExistingDevTimerIds);
      await AsyncStorage.setItem(DEVICE_TIMER_ID_KEY, '{}');
    } catch (e) {
      console.log('Failed to reset device timer Ids:', e);
      return null;
    }
  };

  /*
  {
    LS_100051: [100, 101, 102],
    LS_100053: [103, 104, 105],
  }
  */
  const setDeviceTimerId = async (devId, timerId) => {
    try {
      const strExistingDevTimerIds = await AsyncStorage.getItem(
        DEVICE_TIMER_ID_KEY,
      );

      let existingDeviceTimerIds = {};
      if (strExistingDevTimerIds) {
        existingDeviceTimerIds = JSON.parse(strExistingDevTimerIds);
      }

      if (existingDeviceTimerIds[devId]) {
        for (let id of existingDeviceTimerIds[devId]) {
          console.log('Clear timer:', timerId);
          clearTimeout(id);
        }
        existingDeviceTimerIds[devId].splice(
          0,
          existingDeviceTimerIds[devId].length,
        );

        existingDeviceTimerIds[devId].push(timerId);
      } else {
        let timerIds = [];
        timerIds.push(timerId);
        existingDeviceTimerIds[devId] = timerIds;
      }

      let strMergedDevTimerIds = JSON.stringify(existingDeviceTimerIds);
      console.log('setDeviceTimerId to save: ', strMergedDevTimerIds);
      await AsyncStorage.setItem(DEVICE_TIMER_ID_KEY, strMergedDevTimerIds);
    } catch (e) {
      console.log('Failed to set device timer id for', devId, ': ', e);
    }
  };

  const clearTimersForDevice = async devId => {
    try {
      const strExistingDevTimerIds = await AsyncStorage.getItem(
        DEVICE_TIMER_ID_KEY,
      );

      let existingDeviceTimerIds = {};
      if (strExistingDevTimerIds) {
        existingDeviceTimerIds = JSON.parse(strExistingDevTimerIds);
      }

      if (existingDeviceTimerIds[devId]) {
        let devTimerIds = existingDeviceTimerIds[devId];
        for (let timerId of devTimerIds) {
          console.log('Clear timer:', timerId);
          clearTimeout(timerId);
        }

        existingDeviceTimerIds[devId].splice(
          0,
          existingDeviceTimerIds[devId].length,
        );
      }

      let strMergedDevTimerIds = JSON.stringify(existingDeviceTimerIds);
      console.log('clearTimersForDevice to save: ', strMergedDevTimerIds);
      await AsyncStorage.setItem(DEVICE_TIMER_ID_KEY, strMergedDevTimerIds);
    } catch (e) {
      console.log('Failed to clear device timer id for', devId);
    }
  };

  const handleSaleTableStatusReport = (devId, reportData) => {
    let newDevice = {
      id: devId,
      devType: DEV_TYPE_SALE_TABLE,
      isHeating: reportData.Is_Heating,
      isUpWater: reportData.Is_Up_water,
      netType: reportData.NET_type,
      detectionTemperature: reportData.Detection_temperature,
      waterLevelDetection: reportData.Water_level_detection,
      errorWaterLevel: reportData.error_water_level,
      errorTemperature: reportData.error_temperature,
      onlineStatus: true,
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

  const handleConfigReply = (devId, status) => {
    console.log(
      'Device[' + devId + '], ' + ' configure command reply: ' + status,
    );
  };

  const handleSaleTablePropertyReport = propData => {
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
      devType: DEV_TYPE_SALE_TABLE,
      sceneId: inSceneId,
      sceneName: inSceneName,
      onlineStatus: true,
      maxWaterLevel: propData.params.Water_level_Threshold_Max,
      maxTemperature: propData.params.Temp_Threshold_Max,
      firmwareVersion: propData.Firmware_information,
      lowestWaterLevel: propData.params.Lowest_water_Level,
      waterStartOut: propData.params.Water_Start_Out,
      waterStopOut: propData.params.Water_Stop_Out,
      tempRetDiff: propData.params.Temp_Ret_diff,
      waterRetDiff: propData.params.water_Ret_diff,
      tempOutDelay: propData.params.Temp_Out_Delay,
      waterSensorType: propData.params.Water_Sen_Type,
      highTempAlarm: propData.params.High_Temp_Alarm,
      lowTempAlarm: propData.params.Low_Temp_Alarm,
      lowWaterLevelAlarm: propData.params.Low_Water_Level_Alarm, //To confirm
      alarmDelay: propData.params.Alarm_Delay,
      tradiWaterMode: propData.params.Tradi_water_mode,
    };
    dispatch(syncDevice(newDevice));
  };

  const handleRefrgStatusReport = (devId, reportData) => {
    let newDevice = {
      id: devId,
      devType: DEV_TYPE_REFRIGERATOR,
      onlineStatus: true,
      netType: reportData.NET_type,
      cabinetTemp: reportData.Cabinet_tempe,
      evaporatorTempe: reportData.Evaporator_tempe,
      condenserTempe: reportData.Condenser_tempe,
      ntcTempe: reportData.NTC_tempe,
      sht30OneTempe: reportData.SHT30_1_tempe,
      sht30OneHumi: reportData.SHT30_1_Humi,
      sht30TwoTempe: reportData.SHT30_2_tempe,
      sht30TwoHumi: reportData.SHT30_2_Humi,
      doorDetection1: reportData.Door_Detection_1,
      doorDetection2: reportData.Door_Detection_2,
      doorStatusOut: reportData.Door_Status_Out,
      relay1Status: reportData.Relay1_Status,
      relay2Status: reportData.Relay2_Status,
    };
    console.log('Now try to sync refrigerator data to slice: ');
    dispatch(syncDevice(newDevice));
  };

  const handleRefrgPropertyReport = propData => {
    let inSceneName;
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
      devType: DEV_TYPE_REFRIGERATOR,
      sceneId: inSceneId,
      sceneName: inSceneName,
      onlineStatus: true,
    };
    dispatch(syncDevice(newDevice));
  };

  const handleMqttClientCreated = client => {
    client.on('closed', function () {
      console.log('mqtt.event.closed');
      setTimeout(() => {
        console.log('Mqtt client disconnected, now reconnecting ...');
        client.connect();
      }, 5000);
    });

    client.on('error', function (msg) {
      console.log('mqtt.event.error', msg);
    });

    client.on('message', msg => {
      handleMqttMessageReceived(msg);
    });

    client.on('connect', function () {
      console.log('connected');
      client.subscribe(TOPIC_SALE_TABLE_STATUS, 0);
      client.subscribe(TOPIC_SALE_TABLE_PROPERTY, 0);
      client.subscribe(TOPIC_REFRG_STATUS, 0);
      client.subscribe(TOPIC_REFRG_PROPERTY, 0);
    });
    client.connect();
  };

  const handleMqttMessageReceived = async msg => {
    console.log('handleMqttMessageReceived: ', msg);
    let dataJson = JSON.parse(msg.data);
    if (msg.topic === TOPIC_SALE_TABLE_STATUS) {
      console.log('Sale table status');

      if ('method' in dataJson) {
        if (dataJson.method === 'report') {
          if ('params' in dataJson) {
            handleSaleTableStatusReport(dataJson.device_id, dataJson.params);
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
    } else if (msg.topic === TOPIC_SALE_TABLE_PROPERTY) {
      console.log('Sale table property');
      handleSaleTablePropertyReport(dataJson);
    } else if (msg.topic === TOPIC_REFRG_STATUS) {
      console.log('Refrigerator status report');

      if ('method' in dataJson) {
        if (dataJson.method === 'report') {
          if ('params' in dataJson) {
            handleRefrgStatusReport(dataJson.device_id, dataJson.params);
          }
        } else if (dataJson.method === 'control_reply') {
          handleControlReply(dataJson.device_id, dataJson.status);
        } else if (dataJson.method === 'configure_reply') {
          handleConfigReply(dataJson.device_id, dataJson.status);
        } else {
          console.log('Unsupported message');
        }
      }
    } else if (msg.topic === TOPIC_REFRG_PROPERTY) {
      console.log('Refrigerator property report');
      handleRefrgPropertyReport(dataJson); //Reuse sale table??
    } else {
      console.log('Unknown message with topic:' + msg.topic + ', ignore it!');
      return;
    }

    clearTimersForDevice(dataJson.device_id);

    let devTimerId = setTimeout(
      devId => {
        console.log(
          'Timeout for reciving device status or property report for',
          devId,
        );
        let newDevice = {
          id: devId,
          onlineStatus: false,
        };
        dispatch(syncDevice(newDevice));
        clearTimersForDevice(devId);
      },
      60000,
      dataJson.device_id,
    );
    setDeviceTimerId(dataJson.device_id, devTimerId);
  };

  useEffect(() => {
    if (mqttClient === null) {
      console.log('Mqttclient is null, create a new one and save it ...');
      MQTT.createClient({
        host: '118.24.201.167',
        port: 1883,
        user: 'tkt_iot_user',
        pass: 'tkt1qazm,./',
        auth: true,
        clientId: 'app-clt-' + uuidv4(),
      })
        .then(client => {
          setMqttClient(client);

          resetDeviceTimerIds();
          console.log('Mqtt client created: ', client);
          handleMqttClientCreated(client);
        })
        .catch(function (err) {
          console.log(err);
        });
    } else {
      console.log('Mqtt client already created!');
    }

    console.log('Mqtt client check timer not created, creat a new one ...');
    let timerId = setInterval(() => {
      console.log('Time to check mqtt client status, mqttClient:', mqttClient);
      if (mqttClient) {
        mqttClient
          .isConnected()
          .then(ret => {
            console.log('Mqtt client check, resp:', ret);
            if (!ret) {
              console.log('MQTT status:' + ret);
              console.log('MQTT disconnected, now reconnecting ...');
              mqttClient.reconnect();
            }
          })
          .catch(msg => {
            console.log('Error: ' + msg);
          });
      }
    }, 5000);

    return function cleanup() {
      if (mqttClient) {
        mqttClient.disconnect();
      }
      if (timerId) {
        clearInterval(timerId);
      }
      resetDeviceTimerIds();
    };
  });

  return (
    <MqttContext.Provider value={{ mqttClient, sendCommand }}>
      {children}
    </MqttContext.Provider>
  );
};

export const useMqttClient = () => useContext(MqttContext);
