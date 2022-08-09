/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  SafeAreaView,
  SectionList,
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
      <View style={styles.item}>
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
      </View>
      <Portal>
        <Dialog
          visible={dlgDevInfoVisible}
          onDismiss={hideDialogDevInfo}
          style={styles.dialog}>
          <Dialog.Title style={styles.dialogTitle}>设备信息</Dialog.Title>
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
          <Dialog.Title style={styles.dialogTitle}>设备配置</Dialog.Title>
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
          onDismiss={hideDialogSettingTraditionalDevInfo}>
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
  const [setTemperature, setSetTemperature] = React.useState(
    devPros.setTemperature,
  );
  const [maxTempSetting, setMaxTempSetting] = React.useState(60);
  const [minTempSetting, setMinTempSetting] = React.useState(0);
  const [tempReturnDifference, setTempReturnDifference] = React.useState(
    devPros.tempReturnDifference,
  );
  const [delayRunTime, setDelayRunTime] = React.useState(devPros.delayRunTime);
  const [faultStartTime, setFaultStartTime] = React.useState(
    devPros.faultStartTime,
  );
  const [faultStopTime, setFaultStopTime] = React.useState(
    devPros.faultStopTime,
  );
  const [alarmTempUpOffset, setAlarmTempUpOffset] = React.useState(
    devPros.alarmTempUpOffset,
  );
  const [alarmTempDownOffset, setAlarmTempDownOffset] = React.useState(
    devPros.alarmTempDownOffset,
  );
  const [alarmTempUpOffsetDelay, setAlarmTempUpOffsetDelay] = React.useState(
    devPros.alarmTempUpOffsetDelay,
  );
  const [alarmTempDownOffsetDelay, setAlarmTempDownOffsetDelay] =
    React.useState(devPros.alarmTempDownOffsetDelay);
  const [frostingTemperature, setFrostingTemperature] = React.useState(
    devPros.frostingTemperature,
  );
  const [stopDefrostingTemperature, setStopDefrostingTemperature] =
    React.useState(devPros.stopDefrostingTemperature);
  const [maxDefrostingTimer, setMaxDefrostingTimer] = React.useState(
    devPros.maxDefrostingTimer,
  );
  const [lowTempAccumulatedTime, setLowTempAccumulatedTime] = React.useState(
    devPros.lowTempAccumulatedTime,
  );
  const [defrostingDisplayDelay, setDefrostingDisplayDelay] = React.useState(
    devPros.defrostingDisplayDelay,
  );
  const [defrostingCycle, setDefrostingCycle] = React.useState(
    devPros.defrostingCycle,
  );
  const [drippingTime, setDrippingTime] = React.useState(devPros.drippingTime);
  const [defrostingMode, setDefrostingMode] = React.useState(
    devPros.defrostingMode,
  );
  const [fanFirstStartTimer, setFanFirstStartTimer] = React.useState(
    devPros.fanFirstStartTimer,
  );
  const [fanOperatingMode, setFanOperatingMode] = React.useState(
    devPros.fanOperatingMode,
  );
  const [highTempAlarmValue, setHighTempAlarmValue] = React.useState(
    devPros.highTempAlarmValue,
  );
  const [highTempProtectionValue, setHighTempProtectionValue] = React.useState(
    devPros.highTempProtectionValue,
  );
  const [highTempReturnDifference, setHighTempReturnDifference] =
    React.useState(devPros.highTempReturnDifference);
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
      key: 'setTemperature',
      name: '设置柜温(°C)',
      setter: text => {
        let value = textToInt(text);
        setSetTemperature(value);
        if (value < minTempSetting || value > maxTempSetting) {
          showDialogErrorInfo('设置柜温介于最大与最小值之间');
          updateSettingsVarRefrgSensor('setTemperature', value, true);
        } else {
          showDialogErrorInfo('');
          updateSettingsVarRefrgSensor('setTemperature', value, false);
        }
      },
    },
    {
      key: 'maxTempSetting',
      name: '最大柜温',
      setter: text => {
        let value = textToInt(text);
        setMaxTempSetting(value);
        updateSettingsVarRefrgSensor('maxTempSetting', textToInt(text));
      },
    },
    {
      key: 'minTempSetting',
      name: '最小柜温',
      setter: text => {
        let value = textToInt(text);
        setMinTempSetting(value);
        updateSettingsVarRefrgSensor('minTempSetting', textToInt(text));
      },
    },
    {
      key: 'tempReturnDifference',
      name: '温控回差',
      setter: text => {
        let value = textToInt(text);
        setTempReturnDifference(value);
        if (value < 1 || value > 15) {
          showDialogErrorInfo('温控回差应介于1与15之间');
          updateSettingsVarRefrgSensor('tempReturnDifference', value, true);
        } else {
          showDialogErrorInfo('');
          updateSettingsVarRefrgSensor('tempReturnDifference', value, false);
        }
      },
    },
    {
      key: 'delayRunTime',
      name: '压缩机启动延时',
      setter: text => {
        let value = textToInt(text);
        setDelayRunTime(value);
        if (value < 1 || value > 60) {
          showDialogErrorInfo('压缩机启动延时应介于1与60之间');
          updateSettingsVarRefrgSensor('delayRunTime', value, true);
        } else {
          showDialogErrorInfo('');
          updateSettingsVarRefrgSensor('delayRunTime', value, false);
        }
      },
    },
    {
      key: 'faultStartTime',
      name: '故障开机时间',
      setter: text => {
        let value = textToInt(text);
        setFaultStartTime(value);
        if (value < 1 || value > 120) {
          showDialogErrorInfo('故障开机时间应介于1与120之间');
          updateSettingsVarRefrgSensor('faultStartTime', value, true);
        } else {
          showDialogErrorInfo('');
          updateSettingsVarRefrgSensor('faultStartTime', value, false);
        }
      },
    },
    {
      key: 'faultStopTime',
      name: '故障停机时间',
      setter: text => {
        let value = textToInt(text);
        setFaultStopTime(value);
        if (value < 1 || value > 120) {
          showDialogErrorInfo('故障停机时间应介于1与120之间');
          updateSettingsVarRefrgSensor('faultStopTime', value, true);
        } else {
          showDialogErrorInfo('');
          updateSettingsVarRefrgSensor('faultStopTime', value, false);
        }
      },
    },
    {
      key: 'alarmTempUpOffset',
      name: '报警上限偏移',
      setter: text => {
        let value = textToInt(text);
        setAlarmTempUpOffset(value);
        if (value < 0 || value > 25) {
          showDialogErrorInfo('报警上限偏移应介于0与25之间');
          updateSettingsVarRefrgSensor('alarmTempUpOffset', value, true);
        } else {
          showDialogErrorInfo('');
          updateSettingsVarRefrgSensor('alarmTempUpOffset', value, false);
        }
      },
    },
    {
      key: 'alarmTempDownOffset',
      name: '报警下限偏移',
      setter: text => {
        let value = textToInt(text);
        setAlarmTempDownOffset(value);
        if (value < 0 || value > 25) {
          showDialogErrorInfo('报警下限偏移应介于0与25之间');
          updateSettingsVarRefrgSensor('alarmTempDownOffset', value, true);
        } else {
          showDialogErrorInfo('');
          updateSettingsVarRefrgSensor('alarmTempDownOffset', value, false);
        }
      },
    },
    {
      key: 'alarmTempUpOffsetDelay',
      name: '报警上限延时',
      setter: text => {
        let value = textToInt(text);
        setAlarmTempUpOffsetDelay(value);
        if (value < 0 || value > 125) {
          showDialogErrorInfo('报警上限延时应介于0与125之间');
          updateSettingsVarRefrgSensor('alarmTempUpOffsetDelay', value, true);
        } else {
          showDialogErrorInfo('');
          updateSettingsVarRefrgSensor('alarmTempUpOffsetDelay', value, false);
        }
      },
    },
    {
      key: 'alarmTempDownOffsetDelay',
      name: '报警下限延时',
      setter: text => {
        let value = textToInt(text);
        setAlarmTempDownOffsetDelay(value);
        if (value < 0 || value > 125) {
          showDialogErrorInfo('报警下限延时应介于0与125之间');
          updateSettingsVarRefrgSensor('alarmTempDownOffsetDelay', value, true);
        } else {
          showDialogErrorInfo('');
          updateSettingsVarRefrgSensor(
            'alarmTempDownOffsetDelay',
            value,
            false,
          );
        }
      },
    },
    {
      key: 'frostingTemperature',
      name: '结霜温度',
      setter: text => {
        let value = textToInt(text);
        setFrostingTemperature(value);
        if (value < -40 || value > 0) {
          showDialogErrorInfo('结霜温度应介于-40与0之间');
          updateSettingsVarRefrgSensor('frostingTemperature', value, true);
        } else {
          showDialogErrorInfo('');
          updateSettingsVarRefrgSensor('frostingTemperature', value, false);
        }
      },
    },
    {
      key: 'stopDefrostingTemperature',
      name: '结霜终止温度',
      setter: text => {
        let value = textToInt(text);
        setStopDefrostingTemperature(value);
        if (value < -40 || value > 50) {
          showDialogErrorInfo('结霜终止温度应介于-40与50之间');
          updateSettingsVarRefrgSensor(
            'stopDefrostingTemperature',
            value,
            true,
          );
        } else {
          showDialogErrorInfo('');
          updateSettingsVarRefrgSensor(
            'stopDefrostingTemperature',
            value,
            false,
          );
        }
      },
    },
    {
      key: 'maxDefrostingTimer',
      name: '最长化霜时间',
      setter: text => {
        let value = textToInt(text);
        setMaxDefrostingTimer(value);
        if (value < 1 || value > 60) {
          showDialogErrorInfo('最长化霜时间应介于1与60之间');
          updateSettingsVarRefrgSensor('maxDefrostingTimer', value, true);
        } else {
          showDialogErrorInfo('');
          updateSettingsVarRefrgSensor('maxDefrostingTimer', value, false);
        }
      },
    },
    {
      key: 'lowTempAccumulatedTime',
      name: '蒸发器低温累积',
      setter: text => {
        let value = textToInt(text);
        setLowTempAccumulatedTime(value);
        if (value < 20 || value > 360) {
          showDialogErrorInfo('蒸发器低温累积应介于20与360之间');
          updateSettingsVarRefrgSensor('lowTempAccumulatedTime', value, true);
        } else {
          showDialogErrorInfo('');
          updateSettingsVarRefrgSensor('lowTempAccumulatedTime', value, false);
        }
      },
    },
    {
      key: 'defrostingDisplayDelay',
      name: '化霜显示延时',
      setter: text => {
        let value = textToInt(text);
        setDefrostingDisplayDelay(value);
        if (value < 0 || value > 60) {
          showDialogErrorInfo('化霜显示延时应介于0与60之间');
          updateSettingsVarRefrgSensor('defrostingDisplayDelay', value, true);
        } else {
          showDialogErrorInfo('');
          updateSettingsVarRefrgSensor('defrostingDisplayDelay', value, false);
        }
      },
    },
    {
      key: 'defrostingCycle',
      name: '化霜周期',
      setter: text => {
        let value = textToInt(text);
        setDefrostingCycle(value);
        if (value < 20 || value > 360) {
          showDialogErrorInfo('化霜周期应介于20与360之间');
          updateSettingsVarRefrgSensor('defrostingCycle', value, true);
        } else {
          showDialogErrorInfo('');
          updateSettingsVarRefrgSensor('defrostingCycle', value, false);
        }
      },
    },
    {
      key: 'drippingTime',
      name: '化霜滴水',
      setter: text => {
        let value = textToInt(text);
        setDrippingTime(value);
        if (value < 0 || value > 60) {
          showDialogErrorInfo('化霜滴水应介于0与60之间');
          updateSettingsVarRefrgSensor('drippingTime', value, true);
        } else {
          showDialogErrorInfo('');
          updateSettingsVarRefrgSensor('drippingTime', value, false);
        }
      },
    },
    {
      key: 'defrostingMode',
      name: '化霜模式',
      setter: text => {
        let value = textToInt(text);
        setDefrostingMode(value);
        if (value !== 0 && value !== 1) {
          showDialogErrorInfo('化霜模式必须为0或者1');
          updateSettingsVarRefrgSensor('defrostingMode', value, true);
        } else {
          showDialogErrorInfo('');
          updateSettingsVarRefrgSensor('defrostingMode', value, false);
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
    {
      key: 'highTempAlarmValue',
      name: '冷凝高温报警',
      setter: text => {
        let value = textToInt(text);
        setHighTempAlarmValue(value);
        if (value < 50 || value > 110) {
          showDialogErrorInfo('冷凝高温报警应介于50与110之间');
          updateSettingsVarRefrgSensor('highTempAlarmValue', value, true);
        } else {
          showDialogErrorInfo('');
          updateSettingsVarRefrgSensor('highTempAlarmValue', value, false);
        }
      },
    },
    {
      key: 'highTempProtectionValue',
      name: '冷凝高温保护',
      setter: text => {
        let value = textToInt(text);
        setHighTempProtectionValue(value);
        if (value < highTempAlarmValue || value > 115) {
          showDialogErrorInfo('冷凝高温保护应介于高温报警值与115之间');
          updateSettingsVarRefrgSensor('highTempProtectionValue', value, true);
        } else {
          showDialogErrorInfo('');
          updateSettingsVarRefrgSensor('highTempProtectionValue', value, false);
        }
      },
    },
    {
      key: 'highTempReturnDifference',
      name: '冷凝高温回差',
      setter: text => {
        let value = textToInt(text);
        setHighTempReturnDifference(value);
        if (value < 0 || value > 45) {
          showDialogErrorInfo('冷凝高温回差应介于0与45之间');
          updateSettingsVarRefrgSensor('highTempReturnDifference', value, true);
        } else {
          showDialogErrorInfo('');
          updateSettingsVarRefrgSensor(
            'highTempReturnDifference',
            value,
            false,
          );
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
    setTemperature: { value: intToText(setTemperature), error: false },
    maxTempSetting: {
      value: intToText(maxTempSetting),
      error: false,
    },
    minTempSetting: {
      value: intToText(minTempSetting),
      error: false,
    },
    tempReturnDifference: {
      value: intToText(tempReturnDifference),
      error: false,
    },
    delayRunTime: { value: intToText(delayRunTime), error: false },
    faultStartTime: { value: intToText(faultStartTime), error: false },
    faultStopTime: { value: intToText(faultStopTime), error: false },
    alarmTempUpOffset: { value: intToText(alarmTempUpOffset), error: false },
    alarmTempDownOffset: {
      value: intToText(alarmTempDownOffset),
      error: false,
    },
    alarmTempUpOffsetDelay: {
      value: intToText(alarmTempUpOffsetDelay),
      error: false,
    },
    alarmTempDownOffsetDelay: {
      value: intToText(alarmTempDownOffsetDelay),
      error: false,
    },
    frostingTemperature: {
      value: intToText(frostingTemperature),
      error: false,
    },
    stopDefrostingTemperature: {
      value: intToText(stopDefrostingTemperature),
      error: false,
    },
    maxDefrostingTimer: {
      value: intToText(maxDefrostingTimer),
      error: false,
    },
    lowTempAccumulatedTime: {
      value: intToText(lowTempAccumulatedTime),
      error: false,
    },
    defrostingDisplayDelay: {
      value: intToText(defrostingDisplayDelay),
      error: false,
    },
    defrostingCycle: {
      value: intToText(defrostingCycle),
      error: false,
    },
    drippingTime: {
      value: intToText(drippingTime),
      error: false,
    },
    defrostingMode: {
      value: intToText(defrostingMode),
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
    highTempAlarmValue: {
      value: intToText(highTempAlarmValue),
      error: false,
    },
    highTempProtectionValue: {
      value: intToText(highTempProtectionValue),
      error: false,
    },
    highTempReturnDifference: {
      value: intToText(highTempReturnDifference),
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
      netType: null,
      cabinetTemp: null,
      evaporatorTempe: null,
      condenserTempe: null,
      ntcTempe: null,
      sht30OneTempe: null,
      sht30OneHumi: null,
      sht30TwoTempe: null,
      sht30TwoHumi: null,
      doorDetection1: null,
      doorDetection2: null,
      doorStatusOut: null,
      relay1Status: null,
      relay2Status: null,
    };
    dispatch(syncDevice(newDevice));
    sendCommand(devCmdTopic, JSON.stringify(cmdJson));
  }

  const refreshDevInfos = () => {
    setDevName(devPros.name);
    setSceneName(devPros.sceneName);
    setSceneId(devPros.sceneId);
    setComFirstStartTimer(devPros.comFirstStartTimer);
    setSetTemperature(devPros.setTemperature);
    setMaxTempSetting(devPros.maxTempSetting);
    setMinTempSetting(devPros.minTempSetting);
    setTempReturnDifference(devPros.tempReturnDifference);
    setDelayRunTime(devPros.delayRunTime);
    setFaultStartTime(devPros.faultStartTime);
    setFaultStopTime(devPros.faultStopTime);
    setAlarmTempUpOffset(devPros.alarmTempUpOffset);
    setAlarmTempDownOffset(devPros.alarmTempDownOffset);
    setAlarmTempUpOffsetDelay(devPros.alarmTempUpOffsetDelay);
    setAlarmTempDownOffsetDelay(devPros.alarmTempDownOffsetDelay);
    setFrostingTemperature(devPros.frostingTemperature);
    setStopDefrostingTemperature(devPros.stopDefrostingTemperature);
    setMaxDefrostingTimer(devPros.maxDefrostingTimer);
    setLowTempAccumulatedTime(devPros.lowTempAccumulatedTime);
    setDefrostingDisplayDelay(devPros.defrostingDisplayDelay);
    setDefrostingCycle(devPros.defrostingCycle);
    setDrippingTime(devPros.drippingTime);
    setDefrostingMode(devPros.defrostingMode);
    setFanFirstStartTimer(devPros.fanFirstStartTimer);
    setFanOperatingMode(devPros.fanOperatingMode);
    setHighTempAlarmValue(devPros.highTempAlarmValue);
    setHighTempProtectionValue(devPros.highTempProtectionValue);
    setHighTempReturnDifference(devPros.highTempReturnDifference);

    setSettingsVarRefrgSensor({
      comFirstStartTimer: {
        value: intToText(comFirstStartTimer),
        error: false,
      },
      setTemperature: { value: intToText(setTemperature), error: false },
      maxTempSetting: {
        value: intToText(maxTempSetting),
        error: false,
      },
      minTempSetting: {
        value: intToText(minTempSetting),
        error: false,
      },
      tempReturnDifference: {
        value: intToText(tempReturnDifference),
        error: false,
      },
      delayRunTime: { value: intToText(delayRunTime), error: false },
      faultStartTime: { value: intToText(faultStartTime), error: false },
      faultStopTime: { value: intToText(faultStopTime), error: false },
      alarmTempUpOffset: { value: intToText(alarmTempUpOffset), error: false },
      alarmTempDownOffset: {
        value: intToText(alarmTempDownOffset),
        error: false,
      },
      alarmTempUpOffsetDelay: {
        value: intToText(alarmTempUpOffsetDelay),
        error: false,
      },
      alarmTempDownOffsetDelay: {
        value: intToText(alarmTempDownOffsetDelay),
        error: false,
      },
      frostingTemperature: {
        value: intToText(frostingTemperature),
        error: false,
      },
      stopDefrostingTemperature: {
        value: intToText(stopDefrostingTemperature),
        error: false,
      },
      maxDefrostingTimer: {
        value: intToText(maxDefrostingTimer),
        error: false,
      },
      lowTempAccumulatedTime: {
        value: intToText(lowTempAccumulatedTime),
        error: false,
      },
      defrostingDisplayDelay: {
        value: intToText(defrostingDisplayDelay),
        error: false,
      },
      defrostingCycle: {
        value: intToText(defrostingCycle),
        error: false,
      },
      drippingTime: {
        value: intToText(drippingTime),
        error: false,
      },
      defrostingMode: {
        value: intToText(defrostingMode),
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
      highTempAlarmValue: {
        value: intToText(highTempAlarmValue),
        error: false,
      },
      highTempProtectionValue: {
        value: intToText(highTempProtectionValue),
        error: false,
      },
      highTempReturnDifference: {
        value: intToText(highTempReturnDifference),
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
    if (setTemperature < minTempSetting || setTemperature > maxTempSetting) {
      showDialogErrorInfo('设置柜温介于最大与最小值之间');
      return false;
    }
    if (tempReturnDifference < 1 || tempReturnDifference > 15) {
      showDialogErrorInfo('温控回差应介于1与15之间');
      return false;
    }
    if (delayRunTime < 1 || delayRunTime > 60) {
      showDialogErrorInfo('压缩机启动延时应介于1与60之间');
      return false;
    }
    if (faultStartTime < 1 || faultStartTime > 120) {
      showDialogErrorInfo('故障开机时间应介于1与120之间');
      return false;
    }
    if (faultStopTime < 1 || faultStopTime > 120) {
      showDialogErrorInfo('故障停机时间应介于1与120之间');
      return false;
    }
    if (alarmTempUpOffset < 0 || alarmTempUpOffset > 25) {
      showDialogErrorInfo('报警上限偏移应介于0与25之间');
      return false;
    }
    if (alarmTempDownOffset < 0 || alarmTempDownOffset > 25) {
      showDialogErrorInfo('报警下限偏移应介于0与25之间');
      return false;
    }
    if (alarmTempUpOffsetDelay < 0 || alarmTempUpOffsetDelay > 125) {
      showDialogErrorInfo('报警上限延时应介于0与125之间');
      return false;
    }
    if (alarmTempDownOffsetDelay < 0 || alarmTempDownOffsetDelay > 125) {
      showDialogErrorInfo('报警下限延时应介于0与125之间');
      return false;
    }
    if (frostingTemperature < -40 || frostingTemperature > 0) {
      showDialogErrorInfo('结霜温度应介于-40与0之间');
      return false;
    }
    if (stopDefrostingTemperature < -40 || stopDefrostingTemperature > 50) {
      showDialogErrorInfo('结霜终止温度应介于-40与50之间');
      return false;
    }
    if (maxDefrostingTimer < 1 || maxDefrostingTimer > 60) {
      showDialogErrorInfo('最长化霜时间应介于1与60之间');
      return false;
    }
    if (lowTempAccumulatedTime < 20 || lowTempAccumulatedTime > 360) {
      showDialogErrorInfo('蒸发器低温累积应介于20与360之间');
      return false;
    }
    if (defrostingDisplayDelay < 0 || defrostingDisplayDelay > 60) {
      showDialogErrorInfo('化霜显示延时应介于0与60之间');
      return false;
    }
    if (defrostingCycle < 20 || defrostingCycle > 360) {
      showDialogErrorInfo('化霜周期应介于20与360之间');
      return false;
    }
    if (drippingTime < 0 || drippingTime > 60) {
      showDialogErrorInfo('化霜滴水应介于0与60之间');
      return false;
    }
    if (defrostingMode !== 0 && defrostingMode !== 1) {
      showDialogErrorInfo('化霜模式必须为0或者1');
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
    if (highTempAlarmValue < 50 || highTempAlarmValue > 110) {
      showDialogErrorInfo('冷凝高温报警应介于50与110之间');
      return false;
    }
    if (
      highTempProtectionValue < highTempAlarmValue ||
      highTempProtectionValue > 115
    ) {
      showDialogErrorInfo('冷凝高温保护应介于高温报警值与115之间');
      return false;
    }
    if (highTempReturnDifference < 0 || highTempReturnDifference > 45) {
      showDialogErrorInfo('冷凝高温回差应介于0与45之间');
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
      <View style={styles.item}>
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
      </View>
      <Portal>
        <Dialog
          visible={dlgDevInfoVisible}
          onDismiss={hideDialogDevInfo}
          style={styles.dialog}>
          <Dialog.Title style={styles.dialogTitle}>设备信息</Dialog.Title>
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
                    <Text style={styles.tableCellKey}>{'  固件版本:  '}</Text>
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
          <Dialog.Title style={styles.dialogTitle}>设备配置</Dialog.Title>
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
                  devices: item.data,
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
  const { sceneId, sceneName, devices } = route.params;
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
        data={devices}
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
  item: {
    marginVertical: 5,
    borderRadius: 8,
    backgroundColor: 'white',
    shadowColor: 'black',
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 10,
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
