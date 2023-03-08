/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  SafeAreaView,
  StatusBar,
  FlatList,
  View,
  Alert,
  Image,
  ScrollView,
  Pressable,
} from 'react-native';
import { RadialGradient, Svg, Defs, Stop, Circle } from 'react-native-svg';
import { Button, Dialog, Portal, DataTable } from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { Picker } from '@react-native-picker/picker';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { createStackNavigator } from '@react-navigation/stack';
import {
  syncDevice,
  selectScenes,
  DEV_TYPE_SALE_TABLE,
  DEV_TYPE_REFRIGERATOR,
} from '../data/device-slice';
import { useMqttClient } from '../api/mqtt-hooks';
import { strToUnicode } from '../api/unicode';
import { dialogButtonOk, dialogButtonCancel } from '../constants/button';
import { colors } from '../constants/colors';
import { FlatGrid } from 'react-native-super-grid';

const TOPIC_DEV_CMD_PREFIX = '$thing/down/control/sale_table/';
const TOPIC_REFRGTOR_CMD_PREFIX = '$thing/down/control/refrigerator/';
const TOPIC_SALE_TABLE_GET_STATUS = '$thing/up/status/sale_table';
const TOPIC_REFRGTOR_GET_STATUS = '$thing/up/status/refrigerator';

const DeviceStack = createStackNavigator();

const boolToText = value => {
  return value ? '是' : '否';
};

const netTypeToText = value => {
  if (value === 1) {
    return 'Wifi';
  } else if (value === 2) {
    return '4G';
  } else {
    return '未设置';
  }
};

const textToInt = value => {
  if (/^[-+]?(\d+|Infinity)$/.test(value)) {
    return Number(value);
  } else {
    return 0;
  }
};

const intToText = value => {
  if (value === null || value === undefined) {
    return '0';
  }

  return value.toString();
};

const floatToText = value => {
  if (value === null || value === undefined) {
    return '0';
  }

  return value.toFixed(2).toString();
};

const binStateToText = value => {
  if (value === 1) {
    return '打开';
  }

  return '关闭';
};

const waterSensorType = value => {
  let typeText = '';

  if (value === WATER_SENSOR_TYPE_ULTRASOUND) {
    typeText = '超声波';
  } else if (value === WATER_SENSOR_TYPE_TRADITIONAL) {
    typeText = '传统';
  } else {
    typeText = '未知';
  }

  return typeText;
};

const WATER_SENSOR_TYPE_TRADITIONAL = 0;
const WATER_SENSOR_TYPE_ULTRASOUND = 1;

const SaleTableItem = ({ devPros }) => {
  const [dlgDevInfoVisible, setDlgDevInfoVisible] = React.useState(false);
  const [dlgDevConfVisible, setDlgDevConfVisible] = React.useState(false);
  const [dlgSettingTraditionalVisible, setDlgSettingTraditionalVisible] =
    React.useState(false);
  const [dlgSettingUltrasoundVisible, setDlgSettingUltrasoundVisible] =
    React.useState(false);
  const [dlgFactoryResetWarning, setDlgFactoryResetWarning] =
    React.useState(false);

  const [maxTemp, setMaxTemp] = React.useState(devPros.maxTemperature);
  const [maxWaterLevel, setMaxWaterLevel] = React.useState(
    devPros.maxWaterLevel,
  );
  const [lowestWaterLevel, setLowestWaterLevel] = React.useState(
    devPros.lowestWaterLevel,
  );
  const [waterStartOut, setWaterStartOut] = React.useState(
    devPros.waterStartOut,
  );
  const [selectedSensorType, setSelectedSensorType] = React.useState(
    devPros.waterSensorType,
  );
  const [waterStopOut, setWaterStopOut] = React.useState(devPros.waterStopOut);
  const [tempRetDiff, setTempRetDiff] = React.useState(devPros.tempRetDiff);
  const [waterRetDiff, setWaterRetDiff] = React.useState(devPros.waterRetDiff);
  const [tempOutDelay, setTempOutDelay] = React.useState(devPros.tempOutDelay);
  const [alarmDelay, setAlarmDelay] = React.useState(devPros.alarmDelay);
  const [lowTempAlarm, setLowTempAlarm] = React.useState(devPros.lowTempAlarm);
  const [lowTempAlarmError, setLowTempAlarmError] = React.useState(false);
  const [highTempAlarm, setHighTempAlarm] = React.useState(
    devPros.highTempAlarm,
  );
  const [highTempAlarmError, setHighTempAlarmError] = React.useState(false);
  const [selectedTradiWaterMode, setSelectedTradiWaterMode] = React.useState(
    devPros.tradiWaterMode,
  );

  const [devName, setDevName] = React.useState(devPros.name);
  const [sceneName, setSceneName] = React.useState(devPros.sceneName);
  const [sceneId, setSceneId] = React.useState(devPros.sceneId);

  const [tempMessageShow, setTempMessageShow] = React.useState(false);
  const [waterMessageShow, setWaterMessageShow] = React.useState(false);
  const [alarmMessage, setAlarmMessage] = React.useState('');

  const dispatch = useDispatch();

  const showDialogDevInfo = () => setDlgDevInfoVisible(true);
  const hideDialogDevInfo = () => setDlgDevInfoVisible(false);
  const showDialogDevConfig = () => setDlgDevConfVisible(true);
  const hideDialogDevConfig = () => setDlgDevConfVisible(false);
  const showDialogSettingTraditionalDevInfo = () =>
    setDlgSettingTraditionalVisible(true);
  const hideDialogSettingTraditionalDevInfo = () =>
    setDlgSettingTraditionalVisible(false);
  const showDialogSettingUltrasoundDevInfo = () =>
    setDlgSettingUltrasoundVisible(true);
  const hideDialogSettingUltrasoundDevInfo = () =>
    setDlgSettingUltrasoundVisible(false);
  const showDialogFactoryResetWarning = () => setDlgFactoryResetWarning(true);
  const hideDialogFactoryResetWarning = () => setDlgFactoryResetWarning(false);

  const refreshDevInfos = () => {
    setDevName(devPros.name);
    setSceneName(devPros.sceneName);
    setSceneId(devPros.sceneId);

    setMaxTemp(devPros.maxTemperature);
    setMaxWaterLevel(devPros.maxWaterLevel);
    setLowestWaterLevel(devPros.lowestWaterLevel);
    setWaterStartOut(devPros.waterStartOut);
    setSelectedSensorType(devPros.waterSensorType);
    setWaterStopOut(devPros.waterStopOut);
    setTempRetDiff(devPros.tempRetDiff);
    setWaterRetDiff(devPros.waterRetDiff);
    setTempOutDelay(devPros.tempOutDelay);
    setAlarmDelay(devPros.alarmDelay);
    setLowTempAlarm(devPros.lowTempAlarm);
    setHighTempAlarm(devPros.highTempAlarm);
    setSelectedTradiWaterMode(devPros.tradiWaterMode);
  };

  const devCmdTopic = TOPIC_DEV_CMD_PREFIX + devPros.id;
  const { sendCommand } = useMqttClient();

  function onDialogDevConfOk() {
    if (sceneName !== devPros.sceneName) {
      console.log(
        'Device with id `' + devPros.id + '` changed to new scene ' + sceneName,
      );
    }

    let sceneNameUnicode = strToUnicode(sceneName.slice(0, 16));
    let deviceNameUnicode = strToUnicode(devName.slice(0, 16));
    let cmdJson = {
      device_id: devPros.id,
      method: 'configure',
      params: {
        Scene_Name: sceneNameUnicode,
        Scene_Id: sceneId,
        Device_Name: deviceNameUnicode,
        Water_Sen_Type: selectedSensorType,
        Tradi_water_mode: selectedTradiWaterMode,
        // Remote_address: '',
        // Remote_port: 1883,
        // Mqtt_User_Name: '',
        // Mqtt_password: '',
        // Mqtt_Client_id: '',
        // Wifi_ssid: '',
        // Wifi_password: '',
      },
    };

    hideDialogDevInfo();
    let newDevice = {
      name: devName.slice(0, 16),
      id: devPros.id,
      devType: DEV_TYPE_SALE_TABLE,
      sceneId: sceneId,
      sceneName: sceneName.slice(0, 16),
      isHeating: null,
      isUpWater: null,
      netType: null,
      detectionTemperature: null,
      waterLevelDetection: null,
      errorWaterLevel: null,
      errorTemperature: null,
      maxWaterLevel: null,
      maxTemperature: null,
    };
    dispatch(syncDevice(newDevice));
    sendCommand(devCmdTopic, JSON.stringify(cmdJson));
  }

  function onDialogSettingOk() {
    let skipSet = false;
    if (devPros.lowTempAlarm > maxTemp - tempRetDiff) {
      setTempMessageShow(true);
      skipSet = true;
    }

    if (devPros.lowWaterLevelAlarm > maxWaterLevel - waterRetDiff) {
      setWaterMessageShow(true);
      skipSet = true;
    }

    if (skipSet) {
      setTimeout(() => {
        setTempMessageShow(false);
        setWaterMessageShow(false);
      }, 5000);
      return;
    }

    if (
      highTempAlarm < 0 ||
      highTempAlarm > 120 ||
      lowTempAlarm < 0 ||
      lowTempAlarm > 120 ||
      lowTempAlarm >= highTempAlarm
    ) {
      setAlarmMessage('高低温报警值需在0～120， 且高温报警必须大于低温报警');
      setTimeout(() => {
        setAlarmMessage('');
      }, 5000);
      return;
    }

    let cmdJson = {};

    if (devPros.waterSensorType === WATER_SENSOR_TYPE_TRADITIONAL) {
      hideDialogSettingTraditionalDevInfo();
      cmdJson = {
        device_id: devPros.id,
        method: 'control',
        params: {
          Temp_Max: maxTemp,
          Temp_Ret_diff: tempRetDiff,
          High_Temp_Alarm: highTempAlarm,
          Low_Temp_Alarm: lowTempAlarm,
          Temp_Out_Delay: tempOutDelay,
          Water_Start_Out: waterStartOut,
          Water_Stop_Out: waterStopOut,
          Alarm_Delay: alarmDelay,
        },
      };
    } else if (devPros.waterSensorType === WATER_SENSOR_TYPE_ULTRASOUND) {
      hideDialogSettingUltrasoundDevInfo();
      cmdJson = {
        device_id: devPros.id,
        method: 'control',
        params: {
          Temp_Max: maxTemp,
          Temp_Ret_diff: tempRetDiff,
          High_Temp_Alarm: highTempAlarm,
          Low_Temp_Alarm: lowTempAlarm,
          Temp_Out_Delay: tempOutDelay,
          Water_Start_Out: waterStartOut,
          Water_Stop_Out: waterStopOut,
          Alarm_Delay: alarmDelay,
          Water_Level_Max: maxWaterLevel,
          water_Ret_diff: waterRetDiff,
          Lowest_water_Level: lowestWaterLevel,
        },
      };
    } else {
      console.error('Error, unknown water sensor type');
      return;
    }

    sendCommand(devCmdTopic, JSON.stringify(cmdJson));
  }

  const onDialogFactoryResetOk = () => {
    hideDialogFactoryResetWarning();
    let cmdJson = {
      device_id: devPros.id,
      method: 'configure',
      params: {
        Restore_factory: 1,
      },
    };

    sendCommand(devCmdTopic, JSON.stringify(cmdJson));
  };

  const isWaterLeverError = () => {
    return devPros.errorWaterLevel && devPros.errorWaterLevel.length > 0;
  };

  const isTempError = () => {
    return devPros.errorTemperature && devPros.errorTemperature.length > 0;
  };

  const settingsUltrSndSensor = [
    {
      key: 'maxTemp',
      name: '设置温度',
      setter: text => {
        setMaxTemp(textToInt(text));
        updateSettingsVarUltrSnd('maxTemp', textToInt(text));
      },
    },
    {
      key: 'tempRetDiff',
      name: '温度回差(°C)',
      setter: text => {
        setTempRetDiff(textToInt(text));
        updateSettingsVarUltrSnd('tempRetDiff', textToInt(text));
      },
    },
    {
      key: 'highTempAlarm',
      name: '高温报警',
      setter: text => {
        let temp = textToInt(text);
        setHighTempAlarm(temp);
        if (temp >= 0 && temp <= 120) {
          setHighTempAlarmError(false);
        } else {
          setHighTempAlarmError(true);
        }
        updateSettingsVarUltrSnd('highTempAlarm', textToInt(text));
      },
    },
    {
      key: 'lowTempAlarm',
      name: '低温报警',
      setter: text => {
        let temp = textToInt(text);
        setLowTempAlarm(temp);
        if (temp >= 0 && temp <= 120) {
          setLowTempAlarmError(false);
        } else {
          setLowTempAlarmError(true);
        }
        updateSettingsVarUltrSnd('lowTempAlarm', textToInt(text));
      },
    },
    {
      key: 'tempOutDelay',
      name: '加热输出延时',
      setter: text => {
        setTempOutDelay(textToInt(text));
        updateSettingsVarUltrSnd('tempOutDelay', textToInt(text));
      },
    },
    {
      key: 'waterStartOut',
      name: '上水输出延时',
      setter: text => {
        setWaterStartOut(textToInt(text));
        updateSettingsVarUltrSnd('waterStartOut', textToInt(text));
      },
    },
    {
      key: 'waterStopOut',
      name: '停止上水延时',
      setter: text => {
        setWaterStopOut(textToInt(text));
        updateSettingsVarUltrSnd('waterStopOut', textToInt(text));
      },
    },
    {
      key: 'alarmDelay',
      name: '报警延时',
      setter: text => {
        setAlarmDelay(textToInt(text));
        updateSettingsVarUltrSnd('alarmDelay', textToInt(text));
      },
    },
    {
      key: 'maxWaterLevel',
      name: '设置水位(mm)',
      setter: text => {
        setMaxWaterLevel(textToInt(text));
        updateSettingsVarUltrSnd('maxWaterLevel', textToInt(text));
      },
    },
    {
      key: 'waterRetDiff',
      name: '水位回差(mm)',
      setter: text => {
        setWaterRetDiff(textToInt(text));
        updateSettingsVarUltrSnd('waterRetDiff', textToInt(text));
      },
    },
    {
      key: 'lowestWaterLevel',
      name: '最低水位值(mm)',
      setter: text => {
        setLowestWaterLevel(textToInt(text));
        updateSettingsVarUltrSnd('lowestWaterLevel', textToInt(text));
      },
    },
  ];

  const settingsTradSensor = [
    {
      key: 'maxTemp',
      name: '设置温度',
      setter: text => {
        setMaxTemp(textToInt(text));
        updateSettingsVarTradi('maxTemp', textToInt(text));
      },
    },
    {
      key: 'tempRetDiff',
      name: '温度回差(°C)',
      setter: text => {
        setTempRetDiff(textToInt(text));
        updateSettingsVarTradi('tempRetDiff', textToInt(text));
      },
    },
    {
      key: 'highTempAlarm',
      name: '高温报警',
      setter: text => {
        let temp = textToInt(text);
        setHighTempAlarm(temp);
        if (temp >= 0 && temp <= 120) {
          setHighTempAlarmError(false);
        } else {
          setHighTempAlarmError(true);
        }
        updateSettingsVarTradi('highTempAlarm', textToInt(text));
      },
    },
    {
      key: 'lowTempAlarm',
      name: '低温报警',
      setter: text => {
        let temp = textToInt(text);
        setLowTempAlarm(temp);
        if (temp >= 0 && temp <= 120) {
          setLowTempAlarmError(false);
        } else {
          setLowTempAlarmError(true);
        }
        updateSettingsVarTradi('lowTempAlarm', textToInt(text));
      },
    },
    {
      key: 'tempOutDelay',
      name: '加热输出延时',
      setter: text => {
        setTempOutDelay(textToInt(text));
        updateSettingsVarTradi('tempOutDelay', textToInt(text));
      },
    },
    {
      key: 'waterStartOut',
      name: '上水输出延时',
      setter: text => {
        setWaterStartOut(textToInt(text));
        updateSettingsVarTradi('waterStartOut', textToInt(text));
      },
    },
    {
      key: 'waterStopOut',
      name: '停止上水延时',
      setter: text => {
        setWaterStopOut(textToInt(text));
        updateSettingsVarTradi('waterStopOut', textToInt(text));
      },
    },
    {
      key: 'alarmDelay',
      name: '报警延时',
      setter: text => {
        setAlarmDelay(textToInt(text));
        updateSettingsVarTradi('alarmDelay', textToInt(text));
      },
    },
  ];

  const [settingsVarUltrSndSensor, setSettingsVarUltrSndSensor] =
    React.useState({
      maxTemp: { value: intToText(maxTemp), error: false },
      tempRetDiff: { value: intToText(tempRetDiff), error: false },
      highTempAlarm: {
        value: intToText(highTempAlarm),
        error: highTempAlarmError,
      },
      lowTempAlarm: {
        value: intToText(lowTempAlarm),
        error: lowTempAlarmError,
      },
      tempOutDelay: { value: intToText(tempOutDelay), error: false },
      waterStartOut: { value: intToText(waterStartOut), error: false },
      waterStopOut: { value: intToText(waterStopOut), error: false },
      alarmDelay: { value: intToText(alarmDelay), error: false },
      maxWaterLevel: { value: intToText(maxWaterLevel), error: false },
      waterRetDiff: { value: intToText(waterRetDiff), error: false },
      lowestWaterLevel: { value: intToText(lowestWaterLevel), error: false },
    });
  const [settingsVarTradSensor, setSettingsVarTradSensor] = React.useState({
    maxTemp: { value: intToText(maxTemp), error: false },
    tempRetDiff: { value: intToText(tempRetDiff), error: false },
    highTempAlarm: {
      value: intToText(highTempAlarm),
      error: highTempAlarmError,
    },
    lowTempAlarm: {
      value: intToText(lowTempAlarm),
      error: lowTempAlarmError,
    },
    tempOutDelay: { value: intToText(tempOutDelay), error: false },
    waterStartOut: { value: intToText(waterStartOut), error: false },
    waterStopOut: { value: intToText(waterStopOut), error: false },
    alarmDelay: { value: intToText(alarmDelay), error: false },
  });

  const updateSettingsVarUltrSnd = (key, value) => {
    const settings = settingsVarUltrSndSensor;
    settings[key].value = value;
    setSettingsVarUltrSndSensor(settings);
  };

  const updateSettingsVarTradi = (key, value) => {
    const settings = settingsVarTradSensor;
    settings[key].value = value;
    setSettingsVarTradSensor(settings);
  };

  const mainStatusText = () => {
    const heatingInfo = devPros.isHeating ? '加热中 | ' : '';
    const tempInfo = `温度${intToText(devPros.detectionTemperature)}°C `;
    const upWaterInfo = devPros.isUpWater ? ' | 上水中' : '';

    return `${heatingInfo}${tempInfo}${upWaterInfo}`;
  };

  return (
    <>
      <View
        style={devPros.onlineStatus ? styles.itemOnline : styles.itemOffline}>
        <Pressable
          delayLongPress={1000}
          onLongPress={() => {
            console.log('Sale table item long clicked!');
            if (selectedSensorType === WATER_SENSOR_TYPE_TRADITIONAL) {
              showDialogSettingTraditionalDevInfo();
            } else if (selectedSensorType === WATER_SENSOR_TYPE_ULTRASOUND) {
              showDialogSettingUltrasoundDevInfo();
            } else {
              console.log('Unknown water sensor type!');
              Alert.alert('错误', '未知水位传感器类型！');
            }
          }}>
          <View style={styles.itemTop}>
            <View>
              <Image
                source={require('../res/icon-sale-table.png')}
                style={{ width: 40, height: 40, resizeMode: 'stretch' }}
              />
            </View>
            <View style={{ marginLeft: 20 }}>
              <Text
                style={styles.title}
                onPress={() => {
                  console.log(
                    'Item Clicked, setting device info',
                    devPros,
                    'selectedSensorType=',
                    selectedSensorType,
                  );
                  let cmdJson = {
                    device_id: devPros.id,
                    method: 'get_status',
                  };
                  sendCommand(
                    TOPIC_SALE_TABLE_GET_STATUS,
                    JSON.stringify(cmdJson),
                  );

                  refreshDevInfos();
                  setTimeout(() => {
                    showDialogDevInfo();
                  }, 200);
                }}>
                {devPros.name}
              </Text>
              <Text style={styles.info} onPress={showDialogDevConfig}>
                {devPros.id}
              </Text>
            </View>
          </View>
          <View style={styles.itemBottom}>
            <Text style={styles.info}>{mainStatusText()}</Text>
          </View>
        </Pressable>
      </View>
      <Portal>
        <Dialog
          visible={dlgDevInfoVisible}
          onDismiss={hideDialogDevInfo}
          style={styles.dialog}>
          <Dialog.Title
            style={styles.dialogTitle}>{`${devPros.id}-设备信息`}</Dialog.Title>
          <Dialog.Content>
            <DataTable>
              <DataTable.Row style={styles.tableRow}>
                <DataTable.Cell>
                  <Text style={styles.tableCellKey}>{'加热中: '}</Text>
                  <Text style={styles.tableCellValue}>
                    {boolToText(devPros.isHeating)}
                  </Text>
                </DataTable.Cell>
                <DataTable.Cell>
                  <Text style={styles.tableCellKey}>{' 上水中: '}</Text>
                  <Text style={styles.tableCellValue}>
                    {boolToText(devPros.isUpWater)}
                  </Text>
                </DataTable.Cell>
              </DataTable.Row>
              <DataTable.Row style={styles.tableRow}>
                <DataTable.Cell>
                  <Text style={styles.tableCellKey}>{'设置温度:  '}</Text>
                  <Text style={styles.tableCellValue}>
                    {intToText(devPros.maxTemperature) + '°C'}
                  </Text>
                </DataTable.Cell>
                <DataTable.Cell>
                  <Text style={styles.tableCellKey}>{' 当前温度: '}</Text>
                  <Text style={styles.tableCellValue}>
                    {intToText(devPros.detectionTemperature) + '°C'}
                  </Text>
                </DataTable.Cell>
              </DataTable.Row>
              <DataTable.Row style={styles.tableRow}>
                <DataTable.Cell>
                  <Text style={styles.tableCellKey}>{'温度回差:  '}</Text>
                  <Text style={styles.tableCellValue}>
                    {intToText(devPros.tempRetDiff)}
                  </Text>
                </DataTable.Cell>
                <DataTable.Cell
                  style={
                    devPros.waterSensorType === 1 ? styles.show : styles.hide
                  }>
                  <Text style={styles.tableCellKey}>{' 设置水位: '}</Text>
                  <Text style={styles.tableCellValue}>
                    {intToText(devPros.maxWaterLevel) + 'mm'}
                  </Text>
                </DataTable.Cell>
              </DataTable.Row>
              <DataTable.Row style={styles.tableRow}>
                <DataTable.Cell
                  style={
                    devPros.waterSensorType === 1 ? styles.show : styles.hide
                  }>
                  <Text style={styles.tableCellKey}>{'当前水位:  '}</Text>
                  <Text style={styles.tableCellValue}>
                    {intToText(devPros.waterLevelDetection) + 'mm'}
                  </Text>
                </DataTable.Cell>
                <DataTable.Cell
                  style={
                    devPros.waterSensorType === 1 ? styles.show : styles.hide
                  }>
                  <Text style={styles.tableCellKey}>{' 最低水位: '}</Text>
                  <Text style={styles.tableCellValue}>
                    {intToText(devPros.lowestWaterLevel) + 'mm'}
                  </Text>
                </DataTable.Cell>
              </DataTable.Row>
              <DataTable.Row style={styles.tableRow}>
                <DataTable.Cell>
                  <Text style={styles.tableCellKey}>{'水位回差: '}</Text>
                  <Text style={styles.tableCellValue}>
                    {intToText(devPros.waterRetDiff)}
                  </Text>
                </DataTable.Cell>
                <DataTable.Cell>
                  <Text style={styles.tableCellKey}>{' 加热输出延时: '}</Text>
                  <Text style={styles.tableCellValue}>
                    {intToText(devPros.tempOutDelay) + '秒'}
                  </Text>
                </DataTable.Cell>
              </DataTable.Row>
              <DataTable.Row style={styles.tableRow}>
                <DataTable.Cell>
                  <Text style={styles.tableCellKey}>{'上水输出延时: '}</Text>
                  <Text style={styles.tableCellValue}>
                    {intToText(devPros.waterStartOut) + '秒'}
                  </Text>
                </DataTable.Cell>
                <DataTable.Cell>
                  <Text style={styles.tableCellKey}>{' 停止上水延时: '}</Text>
                  <Text style={styles.tableCellValue}>
                    {intToText(devPros.waterStopOut) + '秒'}
                  </Text>
                </DataTable.Cell>
              </DataTable.Row>
              <DataTable.Row style={styles.tableRow}>
                <DataTable.Cell>
                  <Text style={styles.tableCellKey}>{'高温报警:  '}</Text>
                  <Text style={styles.tableCellValue}>
                    {intToText(devPros.highTempAlarm) + '°C'}
                  </Text>
                </DataTable.Cell>
                <DataTable.Cell>
                  <Text style={styles.tableCellKey}>{' 低温报警: '}</Text>
                  <Text style={styles.tableCellValue}>
                    {intToText(devPros.lowTempAlarm) + '°C'}
                  </Text>
                </DataTable.Cell>
              </DataTable.Row>
              <DataTable.Row style={styles.tableRow}>
                <DataTable.Cell>
                  <Text style={styles.tableCellKey}>{'报警延时:  '}</Text>
                  <Text style={styles.tableCellValue}>
                    {intToText(devPros.alarmDelay) + '秒'}
                  </Text>
                </DataTable.Cell>
                <DataTable.Cell>
                  <Text style={styles.tableCellKey}>{' 网卡类型: '}</Text>
                  <Text style={styles.tableCellValue}>
                    {netTypeToText(devPros.netType)}
                  </Text>
                </DataTable.Cell>
              </DataTable.Row>
              <DataTable.Row style={styles.tableRow}>
                <DataTable.Cell>
                  <Text style={styles.tableCellKey}>{'固件版本:  '}</Text>
                  <Text style={styles.tableCellValue}>
                    {devPros.firmwareVersion}
                  </Text>
                </DataTable.Cell>
              </DataTable.Row>
            </DataTable>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              mode="contained"
              color={dialogButtonCancel.color}
              onPress={hideDialogDevInfo}
              contentStyle={dialogButtonCancel.contentStyle}
              labelStyle={dialogButtonCancel.labelStyle}
              style={styles.dialogButton}>
              取消
            </Button>
            <Button
              mode="contained"
              color={dialogButtonOk.color}
              onPress={onDialogDevConfOk}
              contentStyle={dialogButtonOk.contentStyle}
              labelStyle={dialogButtonOk.labelStyle}
              style={styles.dialogButton}>
              确定
            </Button>
          </Dialog.Actions>
        </Dialog>
        <Dialog
          visible={dlgDevConfVisible}
          onDismiss={hideDialogDevConfig}
          style={styles.dialog}>
          <Dialog.Title
            style={styles.dialogTitle}>{`${devPros.id}-设备配置`}</Dialog.Title>
          <Dialog.Content>
            <View style={styles.input}>
              <View style={styles.textContainer}>
                <Text style={styles.textLabel}>传感器类型:</Text>
                <View style={styles.pickerView}>
                  <Picker
                    selectedValue={selectedSensorType}
                    mode={'dropdown'}
                    style={styles.textValue}
                    item
                    onValueChange={(itemValue, itemIndex) =>
                      setSelectedSensorType(itemValue)
                    }>
                    <Picker.Item
                      label={waterSensorType(WATER_SENSOR_TYPE_TRADITIONAL)}
                      value={WATER_SENSOR_TYPE_TRADITIONAL}
                      color={'#009FFC'}
                    />
                    <Picker.Item
                      label={waterSensorType(WATER_SENSOR_TYPE_ULTRASOUND)}
                      value={WATER_SENSOR_TYPE_ULTRASOUND}
                      color={'#009FFC'}
                    />
                  </Picker>
                </View>
              </View>
              <View
                style={
                  devPros.waterSensorType === WATER_SENSOR_TYPE_TRADITIONAL
                    ? styles.textContainer
                    : styles.hide
                }>
                <Text style={styles.textLabel}>传统传感器模式:</Text>
                <View style={styles.pickerView}>
                  <Picker
                    selectedValue={selectedTradiWaterMode}
                    mode={'dropdown'}
                    style={styles.textValue}
                    onValueChange={(itemValue, itemIndex) =>
                      setSelectedTradiWaterMode(itemValue)
                    }>
                    <Picker.Item label={'模式0'} value={0} />
                    <Picker.Item label={'模式1'} value={1} />
                  </Picker>
                </View>
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.textLabel}>设备名称:</Text>
                <TextInput
                  value={devName}
                  onChangeText={text => setDevName(text)}
                  style={styles.dialogInput}
                />
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.textLabel}>场地名称:</Text>
                <TextInput
                  value={sceneName}
                  onChangeText={text => setSceneName(text)}
                  style={styles.dialogInput}
                />
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.textLabel}>场地ID:</Text>
                <TextInput
                  value={sceneId}
                  onChangeText={text => setSceneId(text)}
                  style={styles.dialogInput}
                />
              </View>
            </View>
            <Button
              icon="restore"
              mode="contained"
              color="#FF0000"
              compact={true}
              labelStyle={{ fontSize: 15, color: 'white', fontWeight: 'bold' }}
              style={{ marginHorizontal: 40, marginVertical: 35 }}
              onPress={showDialogFactoryResetWarning}>
              重置
            </Button>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              mode="contained"
              color={dialogButtonCancel.color}
              onPress={hideDialogDevConfig}
              contentStyle={dialogButtonCancel.contentStyle}
              labelStyle={dialogButtonCancel.labelStyle}
              style={styles.dialogButton}>
              取消
            </Button>
            <Button
              mode="contained"
              color={dialogButtonOk.color}
              onPress={onDialogDevConfOk}
              contentStyle={dialogButtonOk.contentStyle}
              labelStyle={dialogButtonOk.labelStyle}
              style={styles.dialogButton}>
              确定
            </Button>
          </Dialog.Actions>
        </Dialog>
        <Dialog
          visible={dlgSettingTraditionalVisible}
          onDismiss={hideDialogSettingTraditionalDevInfo}
          style={styles.dialog}>
          <Dialog.Title style={styles.dialogTitle}>
            设置 - 传统水位传感器
          </Dialog.Title>
          <Dialog.ScrollArea>
            <View style={styles.settingDialogContent}>
              <FlatList
                data={settingsTradSensor}
                renderItem={({ item }) => (
                  <View style={styles.textContainer}>
                    <Text style={styles.textLabel}>{`${item.name}:`}</Text>
                    <TextInput
                      value={settingsVarTradSensor[item.key].value}
                      onChangeText={item.setter}
                      style={styles.dialogInput}
                      error={settingsVarTradSensor[item.key].error}
                      keyboardType="numeric"
                    />
                  </View>
                )}
              />
            </View>
            <Text style={styles.errorMessage}>
              {tempMessageShow ? '温度设置值不得高于报警值！' : ''}
            </Text>
            <Text style={styles.errorMessage}>
              {waterMessageShow ? '水位设置值不得高于报警值！' : ''}
            </Text>
            <Text style={styles.errorMessage}>{alarmMessage}</Text>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button
              mode="contained"
              color={dialogButtonCancel.color}
              onPress={hideDialogSettingTraditionalDevInfo}
              contentStyle={dialogButtonCancel.contentStyle}
              labelStyle={dialogButtonCancel.labelStyle}
              style={styles.dialogButton}>
              取消
            </Button>
            <Button
              mode="contained"
              color={dialogButtonOk.color}
              onPress={onDialogSettingOk}
              contentStyle={dialogButtonOk.contentStyle}
              labelStyle={dialogButtonOk.labelStyle}
              style={styles.dialogButton}>
              确定
            </Button>
          </Dialog.Actions>
        </Dialog>
        <Dialog
          visible={dlgSettingUltrasoundVisible}
          onDismiss={hideDialogSettingUltrasoundDevInfo}
          style={styles.dialog}>
          <Dialog.Title style={styles.dialogTitle}>
            设置 - 超声波水位传感器
          </Dialog.Title>
          <Dialog.ScrollArea>
            <View style={styles.settingDialogContent}>
              <FlatList
                data={settingsUltrSndSensor}
                renderItem={({ item }) => (
                  <View style={styles.textContainer}>
                    <Text style={styles.textLabel}>{`${item.name}:`}</Text>
                    <TextInput
                      value={settingsVarUltrSndSensor[item.key].value}
                      onChangeText={item.setter}
                      style={styles.dialogInput}
                      error={settingsVarUltrSndSensor[item.key].error}
                      keyboardType="numeric"
                    />
                  </View>
                )}
              />
            </View>
            <Text style={styles.errorMessage}>
              {tempMessageShow ? '温度设置值不得高于报警值！' : ''}
            </Text>
            <Text style={styles.errorMessage}>
              {waterMessageShow ? '水位设置值不得高于报警值！' : ''}
            </Text>
            <Text style={styles.errorMessage}>{alarmMessage}</Text>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button
              mode="contained"
              color={dialogButtonCancel.color}
              onPress={hideDialogSettingUltrasoundDevInfo}
              contentStyle={dialogButtonCancel.contentStyle}
              labelStyle={dialogButtonCancel.labelStyle}
              style={styles.dialogButton}>
              取消
            </Button>
            <Button
              mode="contained"
              color={dialogButtonOk.color}
              onPress={onDialogSettingOk}
              contentStyle={dialogButtonOk.contentStyle}
              labelStyle={dialogButtonOk.labelStyle}
              style={styles.dialogButton}>
              确定
            </Button>
          </Dialog.Actions>
        </Dialog>
        <Dialog
          visible={dlgFactoryResetWarning}
          onDismiss={hideDialogFactoryResetWarning}
          style={[styles.dialog, { marginHorizontal: 50 }]}>
          <Dialog.Title style={styles.warningTitle}>
            <View style={[styles.textContainer, { marginTop: 40 }]}>
              <MaterialCommunityIcons name="alert" color="#ff0000" size={35} />
              <Text style={styles.warningTitle}>温馨提示</Text>
            </View>
          </Dialog.Title>
          <Dialog.Content>
            <Text style={styles.warningText}>
              您将进行恢复出厂设置操作，之前的所有设置即将被擦除，是否继续？
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              mode="contained"
              color={dialogButtonCancel.color}
              onPress={hideDialogFactoryResetWarning}
              contentStyle={dialogButtonCancel.contentStyle}
              labelStyle={dialogButtonCancel.labelStyle}
              style={styles.dialogButton}>
              取消
            </Button>
            <Button
              mode="contained"
              color={dialogButtonOk.color}
              onPress={onDialogFactoryResetOk}
              contentStyle={dialogButtonOk.contentStyle}
              labelStyle={dialogButtonOk.labelStyle}
              style={styles.dialogButton}>
              确定
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
};

const RefrgtorItem = ({ devPros }) => {
  const [dlgDevInfoVisible, setDlgDevInfoVisible] = React.useState(false);
  const [dlgDevConfVisible, setDlgDevConfVisible] = React.useState(false);
  const [dlgSettingVisible, setDlgSettingVisible] = React.useState(false);
  const [dlgFactoryResetWarning, setDlgFactoryResetWarning] =
    React.useState(false);

  const [devName, setDevName] = React.useState(devPros.name);
  const [sceneName, setSceneName] = React.useState(devPros.sceneName);
  const [sceneId, setSceneId] = React.useState(devPros.sceneId);

  const [comFirstStartTimer, setComFirstStartTimer] = React.useState(
    devPros.comFirstStartTimer,
  );
  const [comSetTemp, setComSetTemp] = React.useState(devPros.comSetTemp);
  const [comTempBacklash, setComTempBacklash] = React.useState(
    devPros.comTempBacklash,
  );
  const [comDelayRunTime, setComDelayRunTime] = React.useState(
    devPros.comDelayRunTime,
  );
  const [comFaultStartTime, setComFaultStartTime] = React.useState(
    devPros.comFaultStartTime,
  );
  const [comFaultStopTime, setComFaultStopTime] = React.useState(
    devPros.comFaultStopTime,
  );
  const [comHighTempAlarm, setComHighTempAlarm] = React.useState(
    devPros.comHighTempAlarm,
  );
  const [comLowTempAlarm, setComLowTempAlarm] = React.useState(
    devPros.comLowTempAlarm,
  );
  const [comAlarmTempUpOffset, setComAlarmTempUpOffset] = React.useState(
    devPros.comAlarmTempUpOffset,
  );
  const [comAlarmTempDownOffset, setComAlarmTempDownOffset] = React.useState(
    devPros.comAlarmTempDownOffset,
  );
  const [comAlarmTempUpOffsetDelay, setComAlarmTempUpOffsetDelay] =
    React.useState(devPros.comAlarmTempUpOffsetDelay);
  const [comAlarmTempDownOffsetDelay, setComAlarmTempDownOffsetDelay] =
    React.useState(devPros.comAlarmTempDownOffsetDelay);
  const [comMaxTempSetting, setComMaxTempSetting] = React.useState(
    devPros.comMaxTempSetting,
  );
  const [comMinTempSetting, setComMinTempSetting] = React.useState(
    devPros.comMinTempSetting,
  );
  const [defFrostingTemp, setDefFrostingTemp] = React.useState(
    devPros.defFrostingTemp,
  );
  const [defStopDefrostingTemp, setDefStopDefrostingTemp] = React.useState(
    devPros.defStopDefrostingTemp,
  );
  const [defMaxDefrostingTimer, setDefMaxDefrostingTimer] = React.useState(
    devPros.defMaxDefrostingTimer,
  );
  const [defLowTempAccumulatedTime, setDefLowTempAccumulatedTime] =
    React.useState(devPros.defLowTempAccumulatedTime);
  const [defDefrostingMode, setDefDefrostingMode] = React.useState(
    devPros.defDefrostingMode,
  );
  const [defDefrostingDisplayDelay, setDefDefrostingDisplayDelay] =
    React.useState(devPros.defDefrostingDisplayDelay);
  const [defDrippingTime, setDefDrippingTime] = React.useState(
    devPros.defDrippingTime,
  );
  const [fanFirstStartTimer, setFanFirstStartTimer] = React.useState(
    devPros.fanFirstStartTimer,
  );
  const [fanOperatingMode, setFanOperatingMode] = React.useState(
    devPros.fanOperatingMode,
  );
  const [conHighTempAlarmValue, setConHighTempAlarmValue] = React.useState(
    devPros.conHighTempAlarmValue,
  );
  const [conHighTempProtectionValue, setConHighTempProtectionValue] =
    React.useState(devPros.conHighTempProtectionValue);
  const [conHighTempBacklash, setConHighTempBacklash] = React.useState(
    devPros.conHighTempBacklash,
  );

  const [alarmMessage, setAlarmMessage] = React.useState('');

  const dispatch = useDispatch();

  const showDialogDevInfo = () => setDlgDevInfoVisible(true);
  const hideDialogDevInfo = () => setDlgDevInfoVisible(false);

  const showDialogFactoryResetWarning = () => setDlgFactoryResetWarning(true);
  const hideDialogFactoryResetWarning = () => setDlgFactoryResetWarning(false);

  const showDialogDevConfig = () => setDlgDevConfVisible(true);
  const hideDialogDevConfig = () => setDlgDevConfVisible(false);

  const showDialogDevSetting = () => setDlgSettingVisible(true);
  const hideDialogDevSetting = () => setDlgSettingVisible(false);

  const devCmdTopic = TOPIC_REFRGTOR_CMD_PREFIX + devPros.id;
  const { sendCommand } = useMqttClient();

  const showDialogErrorInfo = message => {
    setAlarmMessage(message);
    setTimeout(() => {
      setAlarmMessage('');
    }, 5000);
  };

  const settingsRefrgSensor = [
    {
      key: 'comFirstStartTimer',
      name: '压缩机首启延时',
      setter: text => {
        let value = textToInt(text);
        setComFirstStartTimer(value);
        if (value < 1 || value > 60) {
          showDialogErrorInfo('压缩机首启延时应介于1~60之间');
          updateSettingsVarRefrgSensor('comFirstStartTimer', value, true);
        } else {
          showDialogErrorInfo('');
          updateSettingsVarRefrgSensor('comFirstStartTimer', value, false);
        }
      },
    },
    {
      key: 'comSetTemp',
      name: '柜温设置',
      setter: text => {
        let value = textToInt(text);
        setComSetTemp(value);
        if (value < comMinTempSetting || value > comMaxTempSetting) {
          showDialogErrorInfo('柜温设置值应介于预定最大值与最小值之间');
          updateSettingsVarRefrgSensor('comSetTemp', value, true);
        } else {
          showDialogErrorInfo('');
          updateSettingsVarRefrgSensor('comSetTemp', value, false);
        }
      },
    },
    {
      key: 'comTempBacklash',
      name: '温控回差',
      setter: text => {
        let value = textToInt(text);
        setComTempBacklash(value);
        if (value < 1 || value > 15) {
          showDialogErrorInfo('温度控制回差应介于1~15之间');
          updateSettingsVarRefrgSensor('comTempBacklash', value, true);
        } else {
          showDialogErrorInfo('');
          updateSettingsVarRefrgSensor('comTempBacklash', value, false);
        }
      },
    },
    {
      key: 'comDelayRunTime',
      name: '压缩机启动延时',
      setter: text => {
        let value = textToInt(text);
        setComDelayRunTime(value);
        if (value < 1 || value > 60) {
          showDialogErrorInfo('压缩机启动延时应介于1~60之间');
          updateSettingsVarRefrgSensor('comDelayRunTime', value, true);
        } else {
          showDialogErrorInfo('');
          updateSettingsVarRefrgSensor('comDelayRunTime', value, false);
        }
      },
    },
    {
      key: 'comFaultStartTime',
      name: '柜温故障开机时间',
      setter: text => {
        let value = textToInt(text);
        setComFaultStartTime(value);
        if (value < 1 || value > 120) {
          showDialogErrorInfo('柜温故障开机时间应介于1~120之间');
          updateSettingsVarRefrgSensor('comFaultStartTime', value, true);
        } else {
          showDialogErrorInfo('');
          updateSettingsVarRefrgSensor('comFaultStartTime', value, false);
        }
      },
    },
    {
      key: 'comFaultStopTime',
      name: '柜温故障停机时间',
      setter: text => {
        let value = textToInt(text);
        setComFaultStopTime(value);
        if (value < 1 || value > 120) {
          showDialogErrorInfo('柜温故障停机时间应介于1~120之间');
          updateSettingsVarRefrgSensor('comFaultStopTime', value, true);
        } else {
          showDialogErrorInfo('');
          updateSettingsVarRefrgSensor('comFaultStopTime', value, false);
        }
      },
    },
    {
      key: 'comHighTempAlarm',
      name: '高温报警温度',
      setter: text => {
        let value = textToInt(text);
        setComHighTempAlarm(value);
        updateSettingsVarRefrgSensor('comHighTempAlarm', value);
      },
    },
    {
      key: 'comLowTempAlarm',
      name: '低温报警温度',
      setter: text => {
        let value = textToInt(text);
        setComLowTempAlarm(value);
        updateSettingsVarRefrgSensor('comLowTempAlarm', value);
      },
    },
    {
      key: 'comAlarmTempUpOffset',
      name: '柜温上限报警偏移',
      setter: text => {
        let value = textToInt(text);
        setComAlarmTempUpOffset(value);
        if (value < 0 || value > 25) {
          showDialogErrorInfo('柜温上限报警偏移应介于0~25之间');
          updateSettingsVarRefrgSensor('comAlarmTempUpOffset', value, true);
        } else {
          showDialogErrorInfo('');
          updateSettingsVarRefrgSensor('comAlarmTempUpOffset', value, false);
        }
      },
    },
    {
      key: 'comAlarmTempDownOffset',
      name: '柜温下限报警偏移',
      setter: text => {
        let value = textToInt(text);
        setComAlarmTempDownOffset(value);
        if (value < 0 || value > 25) {
          showDialogErrorInfo('柜温下限报警偏移应介于0~25之间');
          updateSettingsVarRefrgSensor('comAlarmTempDownOffset', value, true);
        } else {
          showDialogErrorInfo('');
          updateSettingsVarRefrgSensor('comAlarmTempDownOffset', value, false);
        }
      },
    },
    {
      key: 'comAlarmTempUpOffsetDelay',
      name: '柜温超上限报警延时',
      setter: text => {
        let value = textToInt(text);
        setComAlarmTempUpOffsetDelay(value);
        if (value < 0 || value > 125) {
          showDialogErrorInfo('柜温超上限报警延时应介于0~125之间');
          updateSettingsVarRefrgSensor(
            'comAlarmTempUpOffsetDelay',
            value,
            true,
          );
        } else {
          showDialogErrorInfo('');
          updateSettingsVarRefrgSensor(
            'comAlarmTempUpOffsetDelay',
            value,
            false,
          );
        }
      },
    },
    {
      key: 'comAlarmTempDownOffsetDelay',
      name: '柜温超下限报警延时',
      setter: text => {
        let value = textToInt(text);
        setComAlarmTempDownOffsetDelay(value);
        if (value < 0 || value > 125) {
          showDialogErrorInfo('柜温超下限报警延时应介于0~125之间');
          updateSettingsVarRefrgSensor(
            'comAlarmTempDownOffsetDelay',
            value,
            true,
          );
        } else {
          showDialogErrorInfo('');
          updateSettingsVarRefrgSensor(
            'comAlarmTempDownOffsetDelay',
            value,
            false,
          );
        }
      },
    },
    {
      key: 'comMaxTempSetting',
      name: '柜温最大设置温度',
      setter: text => {
        let value = textToInt(text);
        setComMaxTempSetting(value);
        updateSettingsVarRefrgSensor('comMaxTempSetting', textToInt(text));
      },
    },
    {
      key: 'comMinTempSetting',
      name: '柜温最小设置温度',
      setter: text => {
        let value = textToInt(text);
        setComMinTempSetting(value);
        updateSettingsVarRefrgSensor('comMinTempSetting', textToInt(text));
      },
    },
    {
      key: 'defFrostingTemp',
      name: '结霜温度',
      setter: text => {
        let value = textToInt(text);
        setDefFrostingTemp(value);
        if (value < -40 || value > 0) {
          showDialogErrorInfo('结霜温度应介于-40与0之间');
          updateSettingsVarRefrgSensor('defFrostingTemp', value, true);
        } else {
          showDialogErrorInfo('');
          updateSettingsVarRefrgSensor('defFrostingTemp', value, false);
        }
      },
    },
    {
      key: 'defStopDefrostingTemp',
      name: '化霜终止温度',
      setter: text => {
        let value = textToInt(text);
        setDefStopDefrostingTemp(value);
        if (value < -40 || value > 50) {
          showDialogErrorInfo('化霜终止温度应介于-40与50之间');
          updateSettingsVarRefrgSensor('defStopDefrostingTemp', value, true);
        } else {
          showDialogErrorInfo('');
          updateSettingsVarRefrgSensor('defStopDefrostingTemp', value, false);
        }
      },
    },
    {
      key: 'defMaxDefrostingTimer',
      name: '最长化霜时间',
      setter: text => {
        let value = textToInt(text);
        setDefMaxDefrostingTimer(value);
        if (value < 1 || value > 60) {
          showDialogErrorInfo('最长化霜时间应介于1与60之间');
          updateSettingsVarRefrgSensor('defMaxDefrostingTimer', value, true);
        } else {
          showDialogErrorInfo('');
          updateSettingsVarRefrgSensor('defMaxDefrostingTimer', value, false);
        }
      },
    },
    {
      key: 'defLowTempAccumulatedTime',
      name: '蒸发器累计低温时间',
      setter: text => {
        let value = textToInt(text);
        setDefLowTempAccumulatedTime(value);
        if (value < 20 || value > 360) {
          showDialogErrorInfo('蒸发器累计低温时间应介于1与60之间');
          updateSettingsVarRefrgSensor(
            'defLowTempAccumulatedTime',
            value,
            true,
          );
        } else {
          showDialogErrorInfo('');
          updateSettingsVarRefrgSensor(
            'defLowTempAccumulatedTime',
            value,
            false,
          );
        }
      },
    },
    {
      key: 'defDefrostingMode',
      name: '化霜模式',
      setter: text => {
        let value = textToInt(text);
        setDefDefrostingMode(value);
        if (value !== 0 && value !== 1) {
          showDialogErrorInfo('化霜模式只能为1或者0');
          updateSettingsVarRefrgSensor('defDefrostingMode', value, true);
        } else {
          showDialogErrorInfo('');
          updateSettingsVarRefrgSensor('defDefrostingMode', value, false);
        }
      },
    },
    {
      key: 'defDefrostingDisplayDelay',
      name: '化霜后显示延时',
      setter: text => {
        let value = textToInt(text);
        setDefDefrostingDisplayDelay(value);
        if (value < 0 || value > 60) {
          showDialogErrorInfo('化霜后显示延时应介于0与60之间');
          updateSettingsVarRefrgSensor(
            'defDefrostingDisplayDelay',
            value,
            true,
          );
        } else {
          showDialogErrorInfo('');
          updateSettingsVarRefrgSensor(
            'defDefrostingDisplayDelay',
            value,
            false,
          );
        }
      },
    },
    {
      key: 'defDrippingTime',
      name: '化霜滴水时间',
      setter: text => {
        let value = textToInt(text);
        setDefDrippingTime(value);
        if (value < 0 || value > 60) {
          showDialogErrorInfo('化霜滴水时间应介于0与60之间');
          updateSettingsVarRefrgSensor('defDrippingTime', value, true);
        } else {
          showDialogErrorInfo('');
          updateSettingsVarRefrgSensor('defDrippingTime', value, false);
        }
      },
    },
    {
      key: 'conHighTempAlarmValue',
      name: '冷凝器高温报警值',
      setter: text => {
        let value = textToInt(text);
        setConHighTempAlarmValue(value);
        if (value < 50 || value > 110) {
          showDialogErrorInfo('冷凝器高温报警值应介于50与110之间');
          updateSettingsVarRefrgSensor('conHighTempAlarmValue', value, true);
        } else {
          showDialogErrorInfo('');
          updateSettingsVarRefrgSensor('conHighTempAlarmValue', value, false);
        }
      },
    },
    {
      key: 'conHighTempProtectionValue',
      name: '冷凝器高温保护值',
      setter: text => {
        let value = textToInt(text);
        setConHighTempProtectionValue(value);
        if (value < conHighTempAlarmValue || value > 115) {
          showDialogErrorInfo('冷凝器高温保护值应介于报警值与115之间');
          updateSettingsVarRefrgSensor(
            'conHighTempProtectionValue',
            value,
            true,
          );
        } else {
          showDialogErrorInfo('');
          updateSettingsVarRefrgSensor(
            'conHighTempProtectionValue',
            value,
            false,
          );
        }
      },
    },
    {
      key: 'conHighTempBacklash',
      name: '冷凝器高温恢复回差',
      setter: text => {
        let value = textToInt(text);
        setConHighTempBacklash(value);
        if (value < 0 || value > 45) {
          showDialogErrorInfo('冷凝器高温恢复回差应介于0与45之间');
          updateSettingsVarRefrgSensor('conHighTempBacklash', value, true);
        } else {
          showDialogErrorInfo('');
          updateSettingsVarRefrgSensor('conHighTempBacklash', value, false);
        }
      },
    },
    {
      key: 'fanFirstStartTimer',
      name: '风机首起延时',
      setter: text => {
        let value = textToInt(text);
        setFanFirstStartTimer(value);
        if (value < 1 || value > 60) {
          showDialogErrorInfo('风机首起延时应介于1与60之间');
          updateSettingsVarRefrgSensor('fanFirstStartTimer', value, true);
        } else {
          showDialogErrorInfo('');
          updateSettingsVarRefrgSensor('fanFirstStartTimer', value, false);
        }
      },
    },
    {
      key: 'fanOperatingMode',
      name: '风机运行模式',
      setter: text => {
        let value = textToInt(text);
        setFanOperatingMode(value);
        if (value !== 0 && value !== 1 && value !== 2) {
          showDialogErrorInfo('风机运行模式必须为0, 1或者2');
          updateSettingsVarRefrgSensor('fanOperatingMode', value, true);
        } else {
          showDialogErrorInfo('');
          updateSettingsVarRefrgSensor('fanOperatingMode', value, false);
        }
      },
    },
  ];

  const updateSettingsVarRefrgSensor = (key, value, error) => {
    const settings = settingsVarRefrgSensor;
    settings[key].value = value;
    settings[key].error = error;
    setSettingsVarRefrgSensor(settings);
  };

  const [settingsVarRefrgSensor, setSettingsVarRefrgSensor] = React.useState({
    comFirstStartTimer: { value: intToText(comFirstStartTimer), error: false },
    comSetTemp: { value: intToText(comSetTemp), error: false },
    comTempBacklash: { value: intToText(comTempBacklash), error: false },

    comDelayRunTime: { value: intToText(comDelayRunTime), error: false },
    comFaultStartTime: { value: intToText(comFaultStartTime), error: false },
    comFaultStopTime: { value: intToText(comFaultStopTime), error: false },
    comHighTempAlarm: { value: intToText(comHighTempAlarm), error: false },
    comLowTempAlarm: { value: intToText(comLowTempAlarm), error: false },
    comAlarmTempUpOffset: {
      value: intToText(comAlarmTempUpOffset),
      error: false,
    },
    comAlarmTempDownOffset: {
      value: intToText(comAlarmTempDownOffset),
      error: false,
    },
    comAlarmTempUpOffsetDelay: {
      value: intToText(comAlarmTempUpOffsetDelay),
      error: false,
    },
    comAlarmTempDownOffsetDelay: {
      value: intToText(comAlarmTempDownOffsetDelay),
      error: false,
    },
    comMaxTempSetting: { value: intToText(comMaxTempSetting), error: false },
    comMinTempSetting: { value: intToText(comMinTempSetting), error: false },
    defFrostingTemp: { value: intToText(defFrostingTemp), error: false },
    defStopDefrostingTemp: {
      value: intToText(defStopDefrostingTemp),
      error: false,
    },
    defMaxDefrostingTimer: {
      value: intToText(defMaxDefrostingTimer),
      error: false,
    },
    defLowTempAccumulatedTime: {
      value: intToText(defLowTempAccumulatedTime),
      error: false,
    },
    defDefrostingMode: { value: intToText(defDefrostingMode), error: false },
    defDefrostingDisplayDelay: {
      value: intToText(defDefrostingDisplayDelay),
      error: false,
    },
    defDrippingTime: { value: intToText(defDrippingTime), error: false },
    conHighTempAlarmValue: {
      value: intToText(conHighTempAlarmValue),
      error: false,
    },
    conHighTempProtectionValue: {
      value: intToText(conHighTempProtectionValue),
      error: false,
    },
    conHighTempBacklash: {
      value: intToText(conHighTempBacklash),
      error: false,
    },
    fanFirstStartTimer: {
      value: intToText(fanFirstStartTimer),
      error: false,
    },
    fanOperatingMode: {
      value: intToText(fanOperatingMode),
      error: false,
    },
  });

  function onDialogDevInfoOk() {
    if (sceneName !== devPros.sceneName) {
      console.log(
        'Device with id `' + devPros.id + '` changed to new scene ' + sceneName,
      );
    }

    let sceneNameUnicode = strToUnicode(sceneName.slice(0, 16));
    let deviceNameUnicode = strToUnicode(devName.slice(0, 16));
    let cmdJson = {
      device_id: devPros.id,
      method: 'configure',
      params: {
        Scene_Name: sceneNameUnicode,
        Scene_Id: sceneId,
        Device_Name: deviceNameUnicode,
        // Remote_address: '',
        // Remote_port: 1883,
        // Mqtt_User_Name: '',
        // Mqtt_password: '',
        // Mqtt_Client_id: '',
        // Wifi_ssid: '',
        // Wifi_password: '',
      },
    };

    hideDialogDevInfo();
    let newDevice = {
      name: devName.slice(0, 16),
      id: devPros.id,
      devType: DEV_TYPE_REFRIGERATOR,
      sceneId: sceneId,
      sceneName: sceneName.slice(0, 16),
    };
    dispatch(syncDevice(newDevice));
    sendCommand(devCmdTopic, JSON.stringify(cmdJson));
  }

  const refreshDevInfos = () => {
    setDevName(devPros.name);
    setSceneName(devPros.sceneName);
    setSceneId(devPros.sceneId);

    setComFirstStartTimer(devPros.comFirstStartTimer);
    setComSetTemp(devPros.comSetTemp);
    setComTempBacklash(devPros.comTempBacklash);
    setComDelayRunTime(devPros.comDelayRunTime);
    setComFaultStartTime(devPros.comFaultStartTime);
    setComFaultStopTime(devPros.comFaultStopTime);
    setComHighTempAlarm(devPros.comHighTempAlarm);
    setComLowTempAlarm(devPros.comLowTempAlarm);
    setComAlarmTempUpOffset(devPros.comAlarmTempUpOffset);
    setComAlarmTempDownOffset(devPros.comAlarmTempDownOffset);
    setComAlarmTempUpOffsetDelay(devPros.comAlarmTempUpOffsetDelay);
    setComAlarmTempDownOffsetDelay(devPros.comAlarmTempDownOffsetDelay);
    setComMaxTempSetting(devPros.comMaxTempSetting);
    setComMinTempSetting(devPros.comMinTempSetting);
    setDefFrostingTemp(devPros.defFrostingTemp);
    setDefStopDefrostingTemp(devPros.defStopDefrostingTemp);
    setDefMaxDefrostingTimer(devPros.defMaxDefrostingTimer);
    setDefLowTempAccumulatedTime(devPros.defLowTempAccumulatedTime);
    setDefDefrostingMode(devPros.defDefrostingMode);
    setDefDefrostingDisplayDelay(devPros.defDefrostingDisplayDelay);
    setDefDrippingTime(devPros.defDrippingTime);
    setFanFirstStartTimer(devPros.fanFirstStartTimer);
    setFanFirstStartTimer(devPros.fanFirstStartTimer);
    setFanOperatingMode(devPros.fanOperatingMode);
    setConHighTempAlarmValue(devPros.conHighTempAlarmValue);
    setConHighTempProtectionValue(devPros.conHighTempProtectionValue);
    setConHighTempBacklash(devPros.conHighTempBacklash);

    setSettingsVarRefrgSensor({
      comFirstStartTimer: {
        value: intToText(comFirstStartTimer),
        error: false,
      },
      comSetTemp: { value: intToText(comSetTemp), error: false },
      comTempBacklash: { value: intToText(comTempBacklash), error: false },

      comDelayRunTime: { value: intToText(comDelayRunTime), error: false },
      comFaultStartTime: { value: intToText(comFaultStartTime), error: false },
      comFaultStopTime: { value: intToText(comFaultStopTime), error: false },
      comHighTempAlarm: { value: intToText(comHighTempAlarm), error: false },
      comLowTempAlarm: { value: intToText(comLowTempAlarm), error: false },
      comAlarmTempUpOffset: {
        value: intToText(comAlarmTempUpOffset),
        error: false,
      },
      comAlarmTempDownOffset: {
        value: intToText(comAlarmTempDownOffset),
        error: false,
      },
      comAlarmTempUpOffsetDelay: {
        value: intToText(comAlarmTempUpOffsetDelay),
        error: false,
      },
      comAlarmTempDownOffsetDelay: {
        value: intToText(comAlarmTempDownOffsetDelay),
        error: false,
      },
      comMaxTempSetting: { value: intToText(comMaxTempSetting), error: false },
      comMinTempSetting: { value: intToText(comMinTempSetting), error: false },
      defFrostingTemp: { value: intToText(defFrostingTemp), error: false },
      defStopDefrostingTemp: {
        value: intToText(defStopDefrostingTemp),
        error: false,
      },
      defMaxDefrostingTimer: {
        value: intToText(defMaxDefrostingTimer),
        error: false,
      },
      defLowTempAccumulatedTime: {
        value: intToText(defLowTempAccumulatedTime),
        error: false,
      },
      defDefrostingMode: { value: intToText(defDefrostingMode), error: false },
      defDefrostingDisplayDelay: {
        value: intToText(defDefrostingDisplayDelay),
        error: false,
      },
      defDrippingTime: { value: intToText(defDrippingTime), error: false },
      conHighTempAlarmValue: {
        value: intToText(conHighTempAlarmValue),
        error: false,
      },
      conHighTempProtectionValue: {
        value: intToText(conHighTempProtectionValue),
        error: false,
      },
      conHighTempBacklash: {
        value: intToText(conHighTempBacklash),
        error: false,
      },
      fanFirstStartTimer: {
        value: intToText(fanFirstStartTimer),
        error: false,
      },
      fanOperatingMode: {
        value: intToText(fanOperatingMode),
        error: false,
      },
    });
  };

  const onDialogFactoryResetOk = () => {
    hideDialogFactoryResetWarning();
    let cmdJson = {
      device_id: devPros.id,
      method: 'configure',
      params: {
        Restore_factory: 1,
      },
    };

    sendCommand(devCmdTopic, JSON.stringify(cmdJson));
  };

  function onDialogDevConfOk() {
    if (sceneName !== devPros.sceneName) {
      console.log(
        'Device with id `' + devPros.id + '` changed to new scene ' + sceneName,
      );
    }

    let sceneNameUnicode = strToUnicode(sceneName.slice(0, 16));
    let deviceNameUnicode = strToUnicode(devName.slice(0, 16));
    let cmdJson = {
      device_id: devPros.id,
      method: 'configure',
      params: {
        Scene_Name: sceneNameUnicode,
        Scene_Id: sceneId,
        Device_Name: deviceNameUnicode,
        // Remote_address: '',
        // Remote_port: 1883,
        // Mqtt_User_Name: '',
        // Mqtt_password: '',
        // Mqtt_Client_id: '',
        // Wifi_ssid: '',
        // Wifi_password: '',
      },
    };

    hideDialogDevInfo();
    let newDevice = {
      name: devName.slice(0, 16),
      id: devPros.id,
      devType: DEV_TYPE_SALE_TABLE,
      sceneId: sceneId,
      sceneName: sceneName.slice(0, 16),
    };
    dispatch(syncDevice(newDevice));
    sendCommand(devCmdTopic, JSON.stringify(cmdJson));
  }

  const validateSettingValues = () => {
    if (comFirstStartTimer < 1 || comFirstStartTimer > 60) {
      showDialogErrorInfo('压缩机首启延时应介于1~60之间');
      return false;
    }
    if (comSetTemp < comMinTempSetting || comSetTemp > comMaxTempSetting) {
      showDialogErrorInfo('柜温设置值应介于预定最大值与最小值之间');
      return false;
    }
    if (comTempBacklash < 1 || comTempBacklash > 15) {
      showDialogErrorInfo('温度控制回差应介于1~15之间');
      return false;
    }
    if (comDelayRunTime < 1 || comDelayRunTime > 60) {
      showDialogErrorInfo('压缩机启动延时应介于1~60之间');
      return false;
    }
    if (comFaultStartTime < 1 || comFaultStartTime > 120) {
      showDialogErrorInfo('柜温故障开机时间应介于1~120之间');
      return false;
    }
    if (comFaultStopTime < 1 || comFaultStopTime > 120) {
      showDialogErrorInfo('柜温故障停机时间应介于1~120之间');
      return false;
    }
    if (comAlarmTempUpOffset < 0 || comAlarmTempUpOffset > 25) {
      showDialogErrorInfo('柜温上限报警偏移应介于0~25之间');
      return false;
    }
    if (comAlarmTempDownOffset < 0 || comAlarmTempDownOffset > 25) {
      showDialogErrorInfo('柜温下限报警偏移应介于0~25之间');
      return false;
    }
    if (comAlarmTempUpOffsetDelay < 0 || comAlarmTempUpOffsetDelay > 125) {
      showDialogErrorInfo('柜温超上限报警延时应介于0~125之间');
      return false;
    }
    if (comAlarmTempDownOffsetDelay < 0 || comAlarmTempDownOffsetDelay > 125) {
      showDialogErrorInfo('柜温超下限报警延时应介于0~125之间');
      return false;
    }
    if (defFrostingTemp < -40 || defFrostingTemp > 0) {
      showDialogErrorInfo('结霜温度应介于-40与0之间');
      return false;
    }
    if (defStopDefrostingTemp < -40 || defStopDefrostingTemp > 50) {
      showDialogErrorInfo('化霜终止温度应介于-40与50之间');
      return false;
    }
    if (defMaxDefrostingTimer < 1 || defMaxDefrostingTimer > 60) {
      showDialogErrorInfo('最长化霜时间应介于1与60之间');
      return false;
    }
    if (defLowTempAccumulatedTime < 20 || defLowTempAccumulatedTime > 360) {
      showDialogErrorInfo('蒸发器累计低温时间应介于1与60之间');
      return false;
    }
    if (defDefrostingMode !== 0 && defDefrostingMode !== 1) {
      showDialogErrorInfo('化霜模式只能为1或者0');
      return false;
    }
    if (defDefrostingDisplayDelay < 0 || defDefrostingDisplayDelay > 60) {
      showDialogErrorInfo('化霜后显示延时应介于0与60之间');
      return false;
    }
    if (defDrippingTime < 0 || defDrippingTime > 60) {
      showDialogErrorInfo('化霜滴水时间应介于0与60之间');
      return false;
    }
    if (conHighTempAlarmValue < 50 || conHighTempAlarmValue > 110) {
      showDialogErrorInfo('冷凝器高温报警值应介于50与110之间');
      return false;
    }
    if (
      conHighTempProtectionValue < conHighTempAlarmValue ||
      conHighTempProtectionValue > 115
    ) {
      showDialogErrorInfo('冷凝器高温保护值应介于报警值与115之间');
      return false;
    }
    if (conHighTempBacklash < 0 || conHighTempBacklash > 45) {
      showDialogErrorInfo('冷凝器高温恢复回差应介于0与45之间');
      return false;
    }
    if (fanFirstStartTimer < 1 || fanFirstStartTimer > 60) {
      showDialogErrorInfo('风机首起延时应介于1与60之间');
      return false;
    }
    if (
      fanOperatingMode !== 0 &&
      fanOperatingMode !== 1 &&
      fanOperatingMode !== 2
    ) {
      showDialogErrorInfo('风机运行模式必须为0, 1或者2');
      return false;
    }
    return true;
  };

  function onDialogSettingOk() {
    if (!validateSettingValues()) {
      return;
    }

    let cmdJson = {};

    hideDialogDevSetting();
    cmdJson = {
      device_id: devPros.id,
      method: 'control',
      params: {
        Com_First_Start_Timer: comFirstStartTimer,
        Set_temperature: setTemperature,
        Max_temp_setting: maxTempSetting,
        Min_temp_setting: minTempSetting,
        Temp_return_difference: tempReturnDifference,
        Delay_Run_Time: delayRunTime,
        Fault_Start_Time: faultStartTime,
        Fault_Stop_Time: faultStopTime,
        Alarm_Temp_UpOffset: alarmTempUpOffset,
        Alarm_Temp_DownOffset: alarmTempDownOffset,
        Alarm_Temp_UpOffset_Delay: alarmTempUpOffsetDelay,
        Alarm_Temp_DownOffset_Delay: alarmTempDownOffsetDelay,
        Frosting_temperature: frostingTemperature,
        Stop_defrosting_temperature: stopDefrostingTemperature,
        Max_Defrosting_Timer: maxDefrostingTimer,
        Low_Temp_Accumulated_Time: lowTempAccumulatedTime,
        Defrosting_Display_delay: defrostingDisplayDelay,
        Defrosting_Cycle: defrostingCycle,
        Dripping_Time: drippingTime,
        Defrosting_Mode: defrostingMode,
        Fan_First_Start_Timer: fanFirstStartTimer,
        Fan_Operating_Mode: fanOperatingMode,
        High_Temp_Alarm_Value: highTempAlarmValue,
        High_Temp_Protection_Value: highTempProtectionValue,
        High_Temp_Return_Difference: highTempReturnDifference,
      },
    };

    sendCommand(devCmdTopic, JSON.stringify(cmdJson));
  }

  const mainStatusText = () => {
    const compressInfo = devPros.comStartRunFlag ? '压缩机开启 | ' : '';
    const tempInfo = `柜温${intToText(devPros.comDetectiontemperature)}°C `;
    const defrostInfo = devPros.defrostingFlag ? ' | 化霜中' : '';
    const drippingFlag = devPros.drippingFlag ? ' | 滴水中' : '';

    return `${compressInfo}${tempInfo}${defrostInfo}${drippingFlag}`;
  };

  return (
    <>
      <View
        style={devPros.onlineStatus ? styles.itemOnline : styles.itemOffline}>
        <Pressable
          delayLongPress={1000}
          onLongPress={() => {
            console.log('Refrigetor item long clicked!');
            showDialogDevSetting();
          }}>
          <View style={styles.itemTop}>
            <View>
              <Image
                source={require('../res/icon-refreg.png')}
                style={{ width: 40, height: 40, resizeMode: 'stretch' }}
              />
            </View>
            <View>
              <Text
                style={styles.title}
                onPress={() => {
                  console.log('Item Clicked, setting device info', devPros);
                  let cmdJson = {
                    device_id: devPros.id,
                    method: 'get_status',
                  };
                  sendCommand(
                    TOPIC_SALE_TABLE_GET_STATUS,
                    JSON.stringify(cmdJson),
                  );

                  refreshDevInfos();
                  setTimeout(() => {
                    showDialogDevInfo();
                  }, 200);
                }}>
                {devPros.name}
              </Text>
              <Text style={styles.info} onPress={showDialogDevConfig}>
                {devPros.id}
              </Text>
            </View>
          </View>
          <View style={styles.itemBottom}>
            <Text style={styles.info}>{mainStatusText()}</Text>
          </View>
        </Pressable>
      </View>
      <Portal>
        <Dialog
          visible={dlgDevInfoVisible}
          onDismiss={hideDialogDevInfo}
          style={styles.dialog}>
          <Dialog.Title
            style={styles.dialogTitle}>{`${devPros.id}-设备信息`}</Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView style={styles.settingDialogContent}>
              <DataTable>
                <DataTable.Row style={styles.tableRow}>
                  <DataTable.Cell>
                    <Text style={styles.tableCellKey}>{'柜温: '}</Text>
                    <Text style={styles.tableCellValue}>
                      {intToText(devPros.comDetectiontemperature) + '°C'}
                    </Text>
                  </DataTable.Cell>
                  <DataTable.Cell>
                    <Text style={styles.tableCellKey}>{'  压缩机开启: '}</Text>
                    <Text style={styles.tableCellValue}>
                      {boolToText(devPros.comStartRunFlag)}
                    </Text>
                  </DataTable.Cell>
                </DataTable.Row>
                <DataTable.Row style={styles.tableRow}>
                  <DataTable.Cell>
                    <Text style={styles.tableCellKey}>{'蒸发器温度:  '}</Text>
                    <Text style={styles.tableCellValue}>
                      {intToText(devPros.defDetectionTemperature) + '°C'}
                    </Text>
                  </DataTable.Cell>
                  <DataTable.Cell>
                    <Text style={styles.tableCellKey}>{'  化霜开始: '}</Text>
                    <Text style={styles.tableCellValue}>
                      {boolToText(devPros.defrostingFlag)}
                    </Text>
                  </DataTable.Cell>
                </DataTable.Row>
                <DataTable.Row style={styles.tableRow}>
                  <DataTable.Cell>
                    <Text style={styles.tableCellKey}>{'滴水开始:  '}</Text>
                    <Text style={styles.tableCellValue}>
                      {boolToText(devPros.drippingFlag)}
                    </Text>
                  </DataTable.Cell>
                  <DataTable.Cell>
                    <Text style={styles.tableCellKey}>{'  风机运行: '}</Text>
                    <Text style={styles.tableCellValue}>
                      {boolToText(devPros.fanRunFlag)}
                    </Text>
                  </DataTable.Cell>
                </DataTable.Row>
                <DataTable.Row style={styles.tableRow}>
                  <DataTable.Cell>
                    <Text style={styles.tableCellKey}>{'冷凝器温度:  '}</Text>
                    <Text style={styles.tableCellValue}>
                      {intToText(devPros.conDetectionTemperature) + '°C'}
                    </Text>
                  </DataTable.Cell>
                  <DataTable.Cell>
                    <Text style={styles.tableCellKey}>{'  高温报警: '}</Text>
                    <Text style={styles.tableCellValue}>
                      {boolToText(devPros.highTempAlarmFlag)}
                    </Text>
                  </DataTable.Cell>
                </DataTable.Row>
                <DataTable.Row style={styles.tableRow}>
                  <DataTable.Cell>
                    <Text style={styles.tableCellKey}>{'高温保护: '}</Text>
                    <Text style={styles.tableCellValue}>
                      {boolToText(devPros.highTempProtectionFlag)}
                    </Text>
                  </DataTable.Cell>
                  <DataTable.Cell>
                    <Text style={styles.tableCellKey}>{'固件版本:'}</Text>
                    <Text style={styles.tableCellValue}>
                      {devPros.firmwareVersion}
                    </Text>
                  </DataTable.Cell>
                </DataTable.Row>
                <DataTable.Row style={styles.tableRow}>
                  <DataTable.Cell>
                    <Text style={styles.tableCellKey}>{'柜温故障: '}</Text>
                    <Text style={styles.tableCellValue}>
                      {boolToText(devPros.cabinetTempeError)}
                    </Text>
                  </DataTable.Cell>
                  <DataTable.Cell>
                    <Text style={styles.tableCellKey}>{'  柜高温报警:  '}</Text>
                    <Text style={styles.tableCellValue}>
                      {boolToText(devPros.highTempAlarm)}
                    </Text>
                  </DataTable.Cell>
                </DataTable.Row>
                <DataTable.Row style={styles.tableRow}>
                  <DataTable.Cell>
                    <Text style={styles.tableCellKey}>{'柜低温报警: '}</Text>
                    <Text style={styles.tableCellValue}>
                      {boolToText(devPros.lowTempAlarm)}
                    </Text>
                  </DataTable.Cell>
                  <DataTable.Cell>
                    <Text style={styles.tableCellKey}>{'    '}</Text>
                    <Text style={styles.tableCellValue}>{'   '}</Text>
                  </DataTable.Cell>
                </DataTable.Row>
              </DataTable>
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button
              mode="contained"
              color={dialogButtonCancel.color}
              onPress={hideDialogDevInfo}
              contentStyle={dialogButtonCancel.contentStyle}
              labelStyle={dialogButtonCancel.labelStyle}
              style={styles.dialogButton}>
              取消
            </Button>
            <Button
              mode="contained"
              color={dialogButtonOk.color}
              onPress={onDialogDevInfoOk}
              contentStyle={dialogButtonOk.contentStyle}
              labelStyle={dialogButtonOk.labelStyle}
              style={styles.dialogButton}>
              确定
            </Button>
          </Dialog.Actions>
        </Dialog>
        <Dialog
          visible={dlgDevConfVisible}
          onDismiss={hideDialogDevConfig}
          style={styles.dialog}>
          <Dialog.Title
            style={styles.dialogTitle}>{`${devPros.id}-设备配置`}</Dialog.Title>
          <Dialog.Content>
            <View style={styles.input}>
              <View style={styles.textContainer}>
                <Text style={styles.textLabel}>设备名称:</Text>
                <TextInput
                  value={devName}
                  onChangeText={text => setDevName(text)}
                  style={styles.dialogInput}
                />
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.textLabel}>场地名称:</Text>
                <TextInput
                  value={sceneName}
                  onChangeText={text => setSceneName(text)}
                  style={styles.dialogInput}
                />
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.textLabel}>场地ID:</Text>
                <TextInput
                  value={sceneId}
                  onChangeText={text => setSceneId(text)}
                  style={styles.dialogInput}
                />
              </View>
            </View>
            <Button
              icon="restore"
              mode="contained"
              color="#FF0000"
              compact={true}
              labelStyle={{ fontSize: 15, color: 'white', fontWeight: 'bold' }}
              style={{ marginHorizontal: 40, marginVertical: 35 }}
              onPress={showDialogFactoryResetWarning}>
              重置
            </Button>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              mode="contained"
              color={dialogButtonCancel.color}
              onPress={hideDialogDevConfig}
              contentStyle={dialogButtonCancel.contentStyle}
              labelStyle={dialogButtonCancel.labelStyle}
              style={styles.dialogButton}>
              取消
            </Button>
            <Button
              mode="contained"
              color={dialogButtonOk.color}
              onPress={onDialogDevConfOk}
              contentStyle={dialogButtonOk.contentStyle}
              labelStyle={dialogButtonOk.labelStyle}
              style={styles.dialogButton}>
              确定
            </Button>
          </Dialog.Actions>
        </Dialog>
        <Dialog
          visible={dlgSettingVisible}
          onDismiss={hideDialogDevSetting}
          style={styles.dialog}>
          <Dialog.Title style={styles.dialogTitle}>
            设置 - 冰箱控制器
          </Dialog.Title>
          <Dialog.ScrollArea>
            <View style={styles.settingDialogContent}>
              <FlatList
                data={settingsRefrgSensor}
                renderItem={({ item }) => (
                  <View style={styles.textContainer}>
                    <Text style={styles.textLabel}>{`${item.name}:`}</Text>
                    <TextInput
                      value={settingsVarRefrgSensor[item.key].value}
                      onChangeText={item.setter}
                      style={styles.dialogInput}
                      error={settingsVarRefrgSensor[item.key].error}
                      keyboardType="numeric"
                    />
                  </View>
                )}
              />
            </View>
            <Text style={styles.errorMessage}>{alarmMessage}</Text>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button
              mode="contained"
              color={dialogButtonCancel.color}
              onPress={hideDialogDevSetting}
              contentStyle={dialogButtonCancel.contentStyle}
              labelStyle={dialogButtonCancel.labelStyle}
              style={styles.dialogButton}>
              取消
            </Button>
            <Button
              mode="contained"
              color={dialogButtonOk.color}
              onPress={onDialogSettingOk}
              contentStyle={dialogButtonOk.contentStyle}
              labelStyle={dialogButtonOk.labelStyle}
              style={styles.dialogButton}>
              确定
            </Button>
          </Dialog.Actions>
        </Dialog>
        <Dialog
          visible={dlgFactoryResetWarning}
          onDismiss={hideDialogFactoryResetWarning}
          style={[styles.dialog, { marginHorizontal: 50 }]}>
          <Dialog.Title style={styles.warningTitle}>
            <View style={[styles.textContainer, { marginTop: 40 }]}>
              <MaterialCommunityIcons name="alert" color="#ff0000" size={35} />
              <Text style={styles.warningTitle}>温馨提示</Text>
            </View>
          </Dialog.Title>
          <Dialog.Content>
            <Text style={styles.warningText}>
              您将进行恢复出厂设置操作，之前的所有设置即将被擦除，是否继续？
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              mode="contained"
              color={dialogButtonCancel.color}
              onPress={hideDialogFactoryResetWarning}
              contentStyle={dialogButtonCancel.contentStyle}
              labelStyle={dialogButtonCancel.labelStyle}
              style={styles.dialogButton}>
              取消
            </Button>
            <Button
              mode="contained"
              color={dialogButtonOk.color}
              onPress={onDialogFactoryResetOk}
              contentStyle={dialogButtonOk.contentStyle}
              labelStyle={dialogButtonOk.labelStyle}
              style={styles.dialogButton}>
              确定
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
};

const Item = ({ devPros }) => {
  if (devPros.devType === DEV_TYPE_SALE_TABLE) {
    return SaleTableItem({ devPros });
  } else if (devPros.devType === DEV_TYPE_REFRIGERATOR) {
    return RefrgtorItem({ devPros });
  } else {
    console.log('@@@@@@ERROR   Unknown device type');
    return (
      <>
        <Text>NA</Text>
      </>
    );
  }
};

const DeviceHome = ({ route, navigation }) => {
  const scenes = useSelector(selectScenes);

  let renderScenes = [];
  for (let scene of scenes) {
    if (scene.data.length > 0) {
      let copyScene = JSON.parse(JSON.stringify(scene));
      renderScenes.push(copyScene);
    }
  }

  return (
    <SafeAreaView
      style={{
        flex: 1,
        paddingTop: 5,
        marginHorizontal: 10,
      }}>
      {/* <SectionList
        sections={renderScenes}
        keyExtractor={(item, index) => item.id + index}
        renderItem={({ item }) => <Item devPros={item} />}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.header}>{title}</Text>
        )}
      /> */}
      {/* <SectionGrid
        itemDimension={160}
        sections={renderScenes}
        renderItem={({ item }) => <Item devPros={item} />}
        renderSectionHeader={({ section }) => (
          <Text style={styles.header}>{section.title}</Text>
        )}
      /> */}
      <View style={{ marginHorizontal: 0 }}>
        <FlatList
          data={renderScenes}
          keyExtractor={item => `DeviceHome-scene-${item.id}-${item.title}`}
          renderItem={({ item }) => (
            <Pressable
              // key={`DeviceHome-scene-${item.id}-${item.title}`}
              style={{
                marginVertical: 18,
                marginHorizontal: 18,
                borderRadius: 8,
                backgroundColor: 'white',
                shadowColor: 'black',
                shadowOffset: { width: 2, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 3,
                elevation: 10,
              }}
              onPress={() => {
                console.log(`scene-${item.id}-${item.title}`);
                navigation.navigate('DeviceItems', {
                  sceneId: item.id,
                  sceneName: item.title,
                  // devices: item.data,
                });
              }}>
              <View>
                <View style={styles.itemTop}>
                  <View>
                    <Image
                      source={require('../res/icon-scene.png')}
                      style={{ width: 60, height: 60, resizeMode: 'stretch' }}
                    />
                  </View>
                  <View>
                    <Text style={styles.title}>{item.title}</Text>
                  </View>
                </View>
                <View style={styles.itemBottom}>
                  <Text
                    style={
                      styles.info
                    }>{`总设备数: ${item.data.length}, 在线： ${item.data.length}`}</Text>
                </View>
              </View>
            </Pressable>
          )}
        />
      </View>
    </SafeAreaView>
  );
};

const DeviceItems = ({ route, navigation }) => {
  const { sceneId, sceneName } = route.params;
  const scenes = useSelector(selectScenes);
  const scene = scenes.find(element => element.id === sceneId);

  // devices from slice
  return (
    <SafeAreaView
      style={{
        flex: 1,
        paddingTop: 5,
        marginHorizontal: 5,
      }}>
      <FlatGrid
        itemDimension={130}
        keyExtractor={item => `DeviceItems-${item.id}`}
        data={scene.data}
        renderItem={({ item }) => (
          <Item key={`DeviceItems-${item.id}`} devPros={item} />
        )}
      />
    </SafeAreaView>
  );
};

const Devices = () => {
  return (
    <DeviceStack.Navigator initialRouteName="DeviceHome">
      <DeviceStack.Screen
        name="DeviceHome"
        component={DeviceHome}
        options={{ headerShown: false }}
      />
      <DeviceStack.Screen
        name="DeviceItems"
        component={DeviceItems}
        initialParams={{ id: undefined }}
        options={({ route }) => ({
          title: route.params.sceneName,
          headerShown: true,
          headerBackTitleVisible: false,
          headerTitle: route.params.sceneName,
        })}
      />
    </DeviceStack.Navigator>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: StatusBar.currentHeight,
    marginHorizontal: 5,
  },
  itemOffline: {
    marginVertical: 5,
    borderRadius: 8,
    backgroundColor: 'white',
    shadowColor: '#000000',
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: '#000000',
    elevation: 15,
  },
  itemOnline: {
    marginVertical: 5,
    borderRadius: 8,
    backgroundColor: 'white',
    shadowColor: '#0000FF',
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: '#0000FF',
    elevation: 15,
  },
  itemTop: {
    flexDirection: 'row',
    paddingHorizontal: 5,
    marginVertical: 10,
    alignItems: 'center',
  },
  itemMiddle: {},
  itemBottom: {
    flexDirection: 'row',
    paddingHorizontal: 5,
    paddingVertical: 10,
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#839795',
  },
  title: {
    fontSize: 15,
    fontWeight: 'bold',
    color: 'black',
    paddingLeft: 20,
    // paddingTop: 25,
  },
  dialogTitle: {
    textAlign: 'center',
    fontWeight: 'bold',
  },
  errorMessage: {
    fontSize: 18,
    color: '#ff0000',
  },
  info: {
    fontSize: 12,
    // fontWeight: 'bold',
    marginTop: 10,
    paddingLeft: 10,
    color: '#839795',
  },
  input: {
    fontSize: 18,
    marginTop: 5,
  },
  itemSetTempWaterLevel: {
    alignContent: 'flex-end',
    paddingVertical: 30,
    marginHorizontal: 20,
  },
  itemAlarmMessage: {
    alignContent: 'center',
    paddingVertical: 30,
    flexDirection: 'row',
    marginHorizontal: 15,
  },
  itemSetTempWaterLevelText: {
    fontSize: 17,
    color: '#72D6FE',
    paddingHorizontal: 12,
  },
  itemSetRefrgRelayText: {
    fontSize: 17,
    color: '#72D6FE',
    paddingHorizontal: 40,
    marginVertical: 2,
  },
  itemAlarmMessageText: {
    fontSize: 12,
    color: '#ff0000',
    paddingHorizontal: 5,
  },
  itemStatusIcon: {
    marginLeft: 10,
    paddingHorizontal: 5,
  },
  itemAlarmMessageTextHide: {
    fontSize: 12,
    color: '#ff0000',
    paddingHorizontal: 5,
    opacity: 0,
  },
  switchItem: {
    flexDirection: 'row',
    marginLeft: 190,
    marginTop: 8,
    marginBottom: 8,
    marginRight: 8,
    padding: 2,
  },
  labelSwitchText: {
    margin: 5,
    fontSize: 20,
  },
  labelSwitch: {
    margin: 5,
    fontSize: 20,
  },
  inputColumnTwo: {
    display: 'flex',
    flexDirection: 'row',
    marginVertical: 4,
  },
  inputColumnItem: {
    width: '50%',
    marginHorizontal: 2,
  },
  typePicker: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  dialog: {
    borderRadius: 15,
  },
  dialogInput: {
    marginTop: 5,
    borderRadius: 10,
    width: 150,
    fontSize: 15,
    color: '#009FFC',
    backgroundColor: '#E8E8E8',
    height: 45,
    fontWeight: 'bold',
    padding: 10,
  },
  dialogButton: {
    borderRadius: 10,
    width: 100,
    marginHorizontal: 20,
    shadowColor: 'white',
  },
  hide: {
    display: 'none',
  },
  show: {
    display: 'flex',
  },
  tableRow: {
    borderWidth: 1,
    borderTopColor: '#F1F1F1',
    borderLeftColor: 'white',
    borderRightColor: 'white',
  },
  tableCellKey: {
    fontSize: 15,
    // fontWeight: 'bold',
    color: '#949D9F',
  },
  tableCellValue: {
    fontSize: 15,
    // fontWeight: 'bold',
    color: '#04A4FF',
  },
  pickerView: {
    borderRadius: 10,
    height: 50,
    minHeight: 50,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
  },
  textContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 10,
    borderRadius: 10,
    height: 60,
    fontSize: 20,
    backgroundColor: colors.backgroundColor,
  },
  textLabel: {
    paddingHorizontal: 5,
    fontSize: 15,
    color: '#9AAAAA',
    // fontWeight: 'bold',
  },
  textValue: {
    width: 150,
    fontSize: 15,
    // fontWeight: 'bold',
    color: '#009FFC',
    backgroundColor: '#E8E8E8',
    borderRadius: 10,
    height: 20,
  },
  warningText: {
    color: 'red',
    fontSize: 18,
    fontWeight: 'bold',
  },
  warningTitle: {
    fontWeight: 'bold',
    color: 'red',
    textAlign: 'center',
    fontSize: 22,
    paddingTop: 3,
  },
  settingDialogContent: {
    paddingTop: 10,
    borderRadius: 15,
    height: 300,
  },
});

export default Devices;
