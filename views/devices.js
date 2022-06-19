import React, { useState } from 'react';
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
  ScrollView,
} from 'react-native';
import { RadialGradient, Svg, Defs, Stop, Circle } from 'react-native-svg';
import { Button, Dialog, Portal, Switch, DataTable } from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { Picker } from '@react-native-picker/picker';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
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

const TOPIC_DEV_CMD_PREFIX = '$thing/down/control/sale_table/';
const TOPIC_REFRGTOR_CMD_PREFIX = '$thing/down/control/refrigerator/';
const TOPIC_SALE_TABLE_GET_STATUS = '$thing/up/status/sale_table';
const TOPIC_REFRGTOR_GET_STATUS = '$thing/up/status/refrigerator';

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
const dialogTextInputPadStr = '';

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

  return (
    <>
      <View style={styles.item}>
        <View>
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
              sendCommand(TOPIC_SALE_TABLE_GET_STATUS, JSON.stringify(cmdJson));

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
        <View style={styles.itemAlarmMessage}>
          <Text
            style={
              isWaterLeverError()
                ? styles.itemAlarmMessageText
                : styles.itemAlarmMessageTextHide
            }>
            水位异常
          </Text>
          <Text
            style={
              isTempError()
                ? styles.itemAlarmMessageText
                : styles.itemAlarmMessageTextHide
            }>
            温度异常
          </Text>
        </View>
        <View style={styles.itemSetTempWaterLevel}>
          <Svg
            height="40"
            width="40"
            style={styles.itemStatusIcon}
            onPress={() => {
              console.log('Item Clicked, setting temperature', devPros);
              refreshDevInfos();
              if (devPros.waterSensorType === WATER_SENSOR_TYPE_TRADITIONAL) {
                showDialogSettingTraditionalDevInfo();
              } else if (
                devPros.waterSensorType === WATER_SENSOR_TYPE_ULTRASOUND
              ) {
                showDialogSettingUltrasoundDevInfo();
              } else {
                Alert.alert('未知水位传感器类型！');
              }
            }}>
            <Defs>
              <RadialGradient
                id="grad"
                cx="50%"
                cy="50%"
                r="50%"
                fx="50%"
                fy="50%"
                gradientUnits="userSpaceOnUse">
                <Stop offset="0" stopColor="#ffffff" stopOpacity="1" />
                <Stop
                  offset="1"
                  stopColor={devPros.onlineStatus ? '#00ff00' : '#789166'}
                  stopOpacity="1"
                />
              </RadialGradient>
            </Defs>
            <Circle cx="20" cy="20" r="15" fill="url(#grad)" />
          </Svg>
          <Button
            icon="restore"
            mode="text"
            color="#62D6FF"
            compact={true}
            labelStyle={{ fontWeight: 'bold', fontSize: 16 }}
            onPress={showDialogFactoryResetWarning}>
            重置
          </Button>
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
                    {intToText(devPros.highTempAlarm)}
                  </Text>
                </DataTable.Cell>
                <DataTable.Cell>
                  <Text style={styles.tableCellKey}>{' 低温报警: '}</Text>
                  <Text style={styles.tableCellValue}>
                    {intToText(devPros.lowTempAlarm)}
                  </Text>
                </DataTable.Cell>
              </DataTable.Row>
              <DataTable.Row style={styles.tableRow}>
                <DataTable.Cell>
                  <Text style={styles.tableCellKey}>{'报警延时:  '}</Text>
                  <Text style={styles.tableCellValue}>
                    {intToText(devPros.alarmDelay)}
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
                      value={
                        dialogTextInputPadStr +
                        settingsVarTradSensor[item.key].value
                      }
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
                      value={
                        dialogTextInputPadStr +
                        settingsVarUltrSndSensor[item.key].value
                      }
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
          style={styles.dialog}>
          <Dialog.Title style={styles.warningTitle}>
            <View style={styles.textContainer}>
              <MaterialCommunityIcons name="alert" color="#ff0000" size={45} />
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
  const [dlgFactoryResetWarning, setDlgFactoryResetWarning] =
    React.useState(false);

  const [devName, setDevName] = React.useState(devPros.name);
  const [sceneName, setSceneName] = React.useState(devPros.sceneName);
  const [sceneId, setSceneId] = React.useState(devPros.sceneId);

  const dispatch = useDispatch();

  const showDialogDevInfo = () => setDlgDevInfoVisible(true);
  const hideDialogDevInfo = () => setDlgDevInfoVisible(false);

  const showDialogFactoryResetWarning = () => setDlgFactoryResetWarning(true);
  const hideDialogFactoryResetWarning = () => setDlgFactoryResetWarning(false);

  const showDialogDevConfig = () => setDlgDevConfVisible(true);
  const hideDialogDevConfig = () => setDlgDevConfVisible(false);

  const devCmdTopic = TOPIC_REFRGTOR_CMD_PREFIX + devPros.id;
  const { sendCommand } = useMqttClient();

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

  return (
    <>
      <View style={styles.item}>
        <View>
          <Text
            style={styles.title}
            onPress={() => {
              console.log('Item Clicked, setting device info', devPros);

              let cmdJson = {
                device_id: devPros.id,
                method: 'get_status',
              };
              sendCommand(TOPIC_REFRGTOR_GET_STATUS, JSON.stringify(cmdJson));
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
        <View style={styles.itemAlarmMessage}>
          <Text
            style={
              devPros.highTempAlarmFlag
                ? styles.itemAlarmMessageText
                : styles.itemAlarmMessageTextHide
            }>
            高温报警
          </Text>
          <Text
            style={
              devPros.highTempProtectionFlag
                ? styles.itemAlarmMessageText
                : styles.itemAlarmMessageTextHide
            }>
            高温保护
          </Text>
        </View>
        <View style={styles.itemSetTempWaterLevel}>
          <Svg
            height="40"
            width="40"
            style={styles.itemStatusIcon}
            onPress={() => {
              console.log('Item Clicked, setting temperature', devPros);
              refreshDevInfos();
              //Setting
            }}>
            <Defs>
              <RadialGradient
                id="grad"
                cx="50%"
                cy="50%"
                r="50%"
                fx="50%"
                fy="50%"
                gradientUnits="userSpaceOnUse">
                <Stop offset="0" stopColor="#ffffff" stopOpacity="1" />
                <Stop
                  offset="1"
                  stopColor={devPros.onlineStatus ? '#00ff00' : '#789166'}
                  stopOpacity="1"
                />
              </RadialGradient>
            </Defs>
            <Circle cx="20" cy="20" r="15" fill="url(#grad)" />
          </Svg>
          <Button
            icon="restore"
            mode="text"
            color="#62D6FF"
            compact={true}
            labelStyle={{ fontWeight: 'bold', fontSize: 16 }}
            onPress={showDialogFactoryResetWarning}>
            重置
          </Button>
          {/* <Text
            style={styles.itemSetRefrgRelayText}
            onPress={() => {
              console.log('Item Clicked, setting temperature', devPros);
              refreshDevInfos();
              showDialogRelay1();
            }}>
            设置继电器1
          </Text>
          <Text
            style={styles.itemSetRefrgRelayText}
            onPress={() => {
              console.log('Item Clicked, setting water level', devPros);
              refreshDevInfos();
              showDialogRelay2();
            }}>
            设置继电器2
          </Text> */}
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
                      {intToText(devPros.comDetectiontemperature)}
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
              </DataTable>
            </ScrollView>
            {/* <DataTable style={styles.settingDialogContent}>
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
                    {intToText(devPros.highTempAlarm)}
                  </Text>
                </DataTable.Cell>
                <DataTable.Cell>
                  <Text style={styles.tableCellKey}>{' 低温报警: '}</Text>
                  <Text style={styles.tableCellValue}>
                    {intToText(devPros.lowTempAlarm)}
                  </Text>
                </DataTable.Cell>
              </DataTable.Row>
              <DataTable.Row style={styles.tableRow}>
                <DataTable.Cell>
                  <Text style={styles.tableCellKey}>{'报警延时:  '}</Text>
                  <Text style={styles.tableCellValue}>
                    {intToText(devPros.alarmDelay)}
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
            </DataTable> */}
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
          visible={dlgFactoryResetWarning}
          onDismiss={hideDialogFactoryResetWarning}
          style={styles.dialog}>
          <Dialog.Title style={styles.warningTitle}>
            <View style={styles.textContainer}>
              <MaterialCommunityIcons name="alert" color="#ff0000" size={45} />
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
  }
};

const Devices = () => {
  const scenes = useSelector(selectScenes);

  let renderScenes = [];
  for (let scene of scenes) {
    if (scene.data.length > 0) {
      let copyScene = JSON.parse(JSON.stringify(scene));
      renderScenes.push(copyScene);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <SectionList
        sections={renderScenes}
        keyExtractor={(item, index) => item.id + index}
        renderItem={({ item }) => <Item devPros={item} />}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.header}>{title}</Text>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: StatusBar.currentHeight,
    marginHorizontal: 16,
  },
  item: {
    flexDirection: 'row',
    marginVertical: 8,
    borderRadius: 10,
    backgroundColor: '#00A2FF',
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#839795',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    paddingLeft: 30,
    paddingTop: 25,
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
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 5,
    paddingLeft: 30,
    color: '#62D6FF',
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
  },
  dialogButton: {
    borderRadius: 10,
    width: 120,
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
    fontWeight: 'bold',
    color: '#949D9F',
  },
  tableCellValue: {
    fontSize: 15,
    fontWeight: 'bold',
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
    fontWeight: 'bold',
  },
  textValue: {
    width: 150,
    fontSize: 15,
    fontWeight: 'bold',
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
    paddingTop: 20,
    borderRadius: 15,
    height: 300,
  },
});

export default Devices;
