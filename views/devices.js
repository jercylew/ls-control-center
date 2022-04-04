import React from 'react';
import {
  StyleSheet,
  Text,
  SafeAreaView,
  SectionList,
  StatusBar,
  View,
} from 'react-native';
import { RadialGradient, Svg, Defs, Stop, Circle } from 'react-native-svg';
import { Button, Dialog, Portal, TextInput, Switch } from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { Picker } from '@react-native-picker/picker';
import {
  syncDevice,
  selectScenes,
  DEV_TYPE_SALE_TABLE,
  DEV_TYPE_REFRIGERATOR,
} from '../data/device-slice';
import { useMqttClient } from '../api/mqtt-hooks';
import { strToUnicode } from '../api/unicode';

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

const SaleTableItem = ({ devPros }) => {
  const [dlgDevInfoVisible, setDlgDevInfoVisible] = React.useState(false);
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

  const [devName, setDevName] = React.useState(devPros.name);
  const [sceneName, setSceneName] = React.useState(devPros.sceneName);
  const [sceneId, setSceneId] = React.useState(devPros.sceneId);

  const [tempMessageShow, setTempMessageShow] = React.useState(false);
  const [waterMessageShow, setWaterMessageShow] = React.useState(false);
  const [alarmMessage, setAlarmMessage] = React.useState('');

  const dispatch = useDispatch();

  const showDialogDevInfo = () => setDlgDevInfoVisible(true);
  const hideDialogDevInfo = () => setDlgDevInfoVisible(false);

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
  };

  const devCmdTopic = TOPIC_DEV_CMD_PREFIX + devPros.id;
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
        Water_Sen_Type: selectedSensorType,
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

              setTimeout(() => {
                showDialogDevInfo();
              }, 200);
            }}>
            {devPros.name}
          </Text>
          <Text style={styles.info}>{devPros.id}</Text>
          <Button
            icon="restore"
            mode="text"
            color="red"
            compact={true}
            onPress={showDialogFactoryResetWarning}>
            重置
          </Button>
        </View>
        <View style={styles.itemAlarmMessage}>
          <Svg height="20" width="20" style={styles.itemStatusIcon}>
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
            <Circle cx="10" cy="10" r="10" fill="url(#grad)" />
          </Svg>
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
          <Text
            style={styles.itemSetTempWaterLevelText}
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
                console.error('Unknown water sensor type');
              }
            }}>
            设置
          </Text>
        </View>
      </View>
      <Portal>
        <Dialog visible={dlgDevInfoVisible} onDismiss={hideDialogDevInfo}>
          <Dialog.Title>设备信息</Dialog.Title>
          <Dialog.Content>
            <Text>
              {'加热中： ' +
                boolToText(devPros.isHeating) +
                ',\t\t\t上水中：' +
                boolToText(devPros.isUpWater) +
                ',\t设置温度： ' +
                intToText(devPros.maxTemperature) +
                '°C'}
            </Text>
            <Text>
              {'当前温度：' +
                intToText(devPros.detectionTemperature) +
                '°C, 温度回差：' +
                intToText(devPros.tempRetDiff)}
            </Text>
            <Text
              style={devPros.waterSensorType === 1 ? styles.show : styles.hide}>
              {'设置水位： ' +
                intToText(devPros.maxWaterLevel) +
                'mm' +
                ',\t\t当前水位： ' +
                intToText(devPros.waterLevelDetection) +
                'mm' +
                ',\t\t最低水位值： ' +
                intToText(devPros.lowestWaterLevel) +
                'mm,\t水位回差： ' +
                intToText(devPros.waterRetDiff)}
            </Text>
            <Text>
              {'加热输出延时：' +
                intToText(devPros.tempOutDelay) +
                '秒' +
                ',\t上水输出延时： ' +
                intToText(devPros.waterStartOut) +
                '秒' +
                ',\t停止上水延时： ' +
                intToText(devPros.waterStopOut) +
                '秒'}
            </Text>
            <Text>
              {'高温报警：' +
                intToText(devPros.highTempAlarm) +
                ',\t低温报警：' +
                intToText(devPros.lowTempAlarm) +
                ',\t报警延时：' +
                intToText(devPros.alarmDelay)}
            </Text>
            <Text>
              {'网卡类型：' +
                netTypeToText(devPros.netType) +
                ',\t固件版本：' +
                devPros.firmwareVersion}
            </Text>
            <View style={styles.input}>
              <View style={styles.sensorTypePicker}>
                <Text>传感器类型</Text>
                <Picker
                  selectedValue={selectedSensorType}
                  mode={'dropdown'}
                  style={styles.inputPicker}
                  onValueChange={(itemValue, itemIndex) =>
                    setSelectedSensorType(itemValue)
                  }>
                  <Picker.Item
                    label={waterSensorType(WATER_SENSOR_TYPE_TRADITIONAL)}
                    value={WATER_SENSOR_TYPE_TRADITIONAL}
                  />
                  <Picker.Item
                    label={waterSensorType(WATER_SENSOR_TYPE_ULTRASOUND)}
                    value={WATER_SENSOR_TYPE_ULTRASOUND}
                  />
                </Picker>
              </View>
              <TextInput
                label="设备名称"
                value={devName}
                onChangeText={text => setDevName(text)}
              />
              <TextInput
                label="场地名称"
                value={sceneName}
                onChangeText={text => setSceneName(text)}
              />
              <TextInput
                label="场地ID"
                value={sceneId}
                onChangeText={text => setSceneId(text)}
              />
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              icon="close"
              mode="contained"
              color="#e3e3e3"
              style={styles.dialogButton}
              onPress={hideDialogDevInfo}>
              关闭
            </Button>
            <Button
              icon="send"
              mode="contained"
              style={styles.dialogButton}
              onPress={onDialogDevInfoOk}>
              设置
            </Button>
          </Dialog.Actions>
        </Dialog>
        <Dialog
          visible={dlgSettingTraditionalVisible}
          onDismiss={hideDialogSettingTraditionalDevInfo}>
          <Dialog.Title>设置 - 传统水位传感器</Dialog.Title>
          <Dialog.Content>
            <View style={styles.inputColumnTwo}>
              <TextInput
                style={styles.inputColumnItem}
                label="设置温度(°C)"
                value={intToText(maxTemp)}
                onChangeText={text => setMaxTemp(textToInt(text))}
                keyboardType="numeric"
              />
              <TextInput
                style={styles.inputColumnItem}
                label="温度回差(°C)"
                value={intToText(tempRetDiff)}
                onChangeText={text => setTempRetDiff(textToInt(text))}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.inputColumnTwo}>
              <TextInput
                style={styles.inputColumnItem}
                label="高温报警"
                value={intToText(highTempAlarm)}
                onChangeText={text => {
                  let temp = textToInt(text);
                  setHighTempAlarm(temp);
                  if (temp >= 0 && temp <= 120) {
                    setHighTempAlarmError(false);
                  } else {
                    setHighTempAlarmError(true);
                  }
                }}
                keyboardType="numeric"
                error={highTempAlarmError}
              />
              <TextInput
                style={styles.inputColumnItem}
                label="低温报警"
                value={intToText(lowTempAlarm)}
                onChangeText={text => {
                  let temp = textToInt(text);
                  setLowTempAlarm(temp);
                  if (temp >= 0 && temp <= 120) {
                    setLowTempAlarmError(false);
                  } else {
                    setLowTempAlarmError(true);
                  }
                }}
                keyboardType="numeric"
                error={lowTempAlarmError}
              />
            </View>
            <View style={styles.inputColumnTwo}>
              <TextInput
                style={styles.inputColumnItem}
                label="加热输出延时"
                value={intToText(tempOutDelay)}
                onChangeText={text => setTempOutDelay(textToInt(text))}
                keyboardType="numeric"
              />
              <TextInput
                style={styles.inputColumnItem}
                label="上水输出延时"
                value={intToText(waterStartOut)}
                onChangeText={text => setWaterStartOut(textToInt(text))}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.inputColumnTwo}>
              <TextInput
                style={styles.inputColumnItem}
                label="停止上水延时"
                value={intToText(waterStopOut)}
                onChangeText={text => setWaterStopOut(textToInt(text))}
                keyboardType="numeric"
              />
              <TextInput
                style={styles.inputColumnItem}
                label="报警延时"
                value={intToText(alarmDelay)}
                onChangeText={text => setAlarmDelay(textToInt(text))}
                keyboardType="numeric"
              />
            </View>
            <Text style={styles.errorMessage}>
              {tempMessageShow ? '温度设置值不得高于报警值！' : ''}
            </Text>
            <Text style={styles.errorMessage}>
              {waterMessageShow ? '水位设置值不得高于报警值！' : ''}
            </Text>
            <Text style={styles.errorMessage}>{alarmMessage}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              icon="close"
              mode="contained"
              color="#e3e3e3"
              style={styles.dialogButton}
              onPress={hideDialogSettingTraditionalDevInfo}>
              取消
            </Button>
            <Button
              icon="send"
              mode="contained"
              style={styles.dialogButton}
              onPress={onDialogSettingOk}>
              确定
            </Button>
          </Dialog.Actions>
        </Dialog>
        <Dialog
          visible={dlgSettingUltrasoundVisible}
          onDismiss={hideDialogSettingUltrasoundDevInfo}>
          <Dialog.Title>设置 - 超声波水位传感器</Dialog.Title>
          <Dialog.Content>
            <View style={styles.inputColumnTwo}>
              <TextInput
                style={styles.inputColumnItem}
                label="设置温度(°C)"
                value={intToText(maxTemp)}
                onChangeText={text => setMaxTemp(textToInt(text))}
                keyboardType="numeric"
              />
              <TextInput
                style={styles.inputColumnItem}
                label="温度回差(°C)"
                value={intToText(tempRetDiff)}
                onChangeText={text => setTempRetDiff(textToInt(text))}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.inputColumnTwo}>
              <TextInput
                style={styles.inputColumnItem}
                label="高温报警"
                value={intToText(highTempAlarm)}
                onChangeText={text => {
                  let temp = textToInt(text);
                  setHighTempAlarm(temp);
                  if (temp >= 0 && temp <= 120) {
                    setHighTempAlarmError(false);
                  } else {
                    setHighTempAlarmError(true);
                  }
                }}
                keyboardType="numeric"
                error={highTempAlarmError}
              />
              <TextInput
                style={styles.inputColumnItem}
                label="低温报警"
                value={intToText(lowTempAlarm)}
                onChangeText={text => {
                  let temp = textToInt(text);
                  setLowTempAlarm(temp);
                  if (temp >= 0 && temp <= 120) {
                    setLowTempAlarmError(false);
                  } else {
                    setLowTempAlarmError(true);
                  }
                }}
                keyboardType="numeric"
                error={lowTempAlarmError}
              />
            </View>
            <View style={styles.inputColumnTwo}>
              <TextInput
                style={styles.inputColumnItem}
                label="加热输出延时"
                value={intToText(tempOutDelay)}
                onChangeText={text => setTempOutDelay(textToInt(text))}
                keyboardType="numeric"
              />
              <TextInput
                style={styles.inputColumnItem}
                label="上水输出延时"
                value={intToText(waterStartOut)}
                onChangeText={text => setWaterStartOut(textToInt(text))}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.inputColumnTwo}>
              <TextInput
                style={styles.inputColumnItem}
                label="停止上水延时"
                value={intToText(waterStopOut)}
                onChangeText={text => setWaterStopOut(textToInt(text))}
                keyboardType="numeric"
              />
              <TextInput
                style={styles.inputColumnItem}
                label="报警延时"
                value={intToText(alarmDelay)}
                onChangeText={text => setAlarmDelay(textToInt(text))}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.inputColumnTwo}>
              <TextInput
                style={styles.inputColumnItem}
                label="设置水位(mm)"
                value={intToText(maxWaterLevel)}
                onChangeText={text => setMaxWaterLevel(textToInt(text))}
                keyboardType="numeric"
              />
              <TextInput
                style={styles.inputColumnItem}
                label="水位回差(mm)"
                value={intToText(waterRetDiff)}
                onChangeText={text => setWaterRetDiff(textToInt(text))}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.inputColumnTwo}>
              <TextInput
                style={styles.inputColumnItem}
                label="最低水位值(mm)"
                value={intToText(lowestWaterLevel)}
                onChangeText={text => setLowestWaterLevel(textToInt(text))}
                keyboardType="numeric"
              />
            </View>
            <Text style={styles.errorMessage}>
              {tempMessageShow ? '温度设置值不得高于报警值！' : ''}
            </Text>
            <Text style={styles.errorMessage}>
              {waterMessageShow ? '水位设置值不得高于报警值！' : ''}
            </Text>
            <Text style={styles.errorMessage}>{alarmMessage}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              icon="close"
              mode="contained"
              color="#e3e3e3"
              style={styles.dialogButton}
              onPress={hideDialogSettingUltrasoundDevInfo}>
              取消
            </Button>
            <Button
              icon="send"
              mode="contained"
              style={styles.dialogButton}
              onPress={onDialogSettingOk}>
              确定
            </Button>
          </Dialog.Actions>
        </Dialog>
        <Dialog
          visible={dlgFactoryResetWarning}
          onDismiss={hideDialogFactoryResetWarning}>
          <Dialog.Title>警告!</Dialog.Title>
          <Dialog.Content>
            <Text>
              您将进行恢复出厂设置操作，之前的所有设置即将被擦除，是否继续？
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              icon="close"
              mode="contained"
              color="#e3e3e3"
              style={styles.dialogButton}
              onPress={hideDialogFactoryResetWarning}>
              取消
            </Button>
            <Button
              icon="send"
              mode="contained"
              style={styles.dialogButton}
              onPress={onDialogFactoryResetOk}>
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
  const [dlgRelay1Visible, setDlgRelay1Visible] = React.useState(false);
  const [dlgRelay2Visible, setDlgRelay2Visible] = React.useState(false);
  const [dlgFactoryResetWarning, setDlgFactoryResetWarning] =
    React.useState(false);

  const [relay1Status, setRelay1Status] = React.useState(
    devPros.relay1Status === 1,
  );
  const [relay2Status, setRelay2Status] = React.useState(
    devPros.relay2Status === 1,
  );
  const [devName, setDevName] = React.useState(devPros.name);
  const [sceneName, setSceneName] = React.useState(devPros.sceneName);
  const [sceneId, setSceneId] = React.useState(devPros.sceneId);

  const dispatch = useDispatch();

  const showDialogDevInfo = () => setDlgDevInfoVisible(true);
  const hideDialogDevInfo = () => setDlgDevInfoVisible(false);

  const showDialogRelay1 = () => setDlgRelay1Visible(true);
  const hideDialogRelay1 = () => setDlgRelay1Visible(false);

  const showDialogRelay2 = () => setDlgRelay2Visible(true);
  const hideDialogRelay2 = () => setDlgRelay2Visible(false);

  const showDialogFactoryResetWarning = () => setDlgFactoryResetWarning(true);
  const hideDialogFactoryResetWarning = () => setDlgFactoryResetWarning(false);

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

  function onDialogSetRelay1StatusOk() {
    hideDialogRelay1();

    let cmdJson = {
      device_id: devPros.id,
      method: 'control',
      params: {
        Relay1_Status: relay1Status ? 1 : 0,
      },
    };
    sendCommand(devCmdTopic, JSON.stringify(cmdJson));
  }

  function onDialogSetRelay2StatusOk() {
    hideDialogRelay2();

    let cmdJson = {
      device_id: devPros.id,
      method: 'control',
      params: {
        Relay2_Status: relay2Status ? 1 : 0,
      },
    };
    sendCommand(devCmdTopic, JSON.stringify(cmdJson));
  }

  const refreshDevInfos = () => {
    setRelay1Status(devPros.relay1Status === 1);
    setRelay2Status(devPros.relay2Status === 1);
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

              setTimeout(() => {
                showDialogDevInfo();
              }, 200);
            }}>
            {devPros.name}
          </Text>
          <Text style={styles.info}>{devPros.id}</Text>
          <Button
            icon="restore"
            mode="text"
            color="red"
            compact={true}
            onPress={showDialogFactoryResetWarning}>
            重置
          </Button>
        </View>
        <View style={styles.itemAlarmMessage}>
          <Svg height="20" width="20" style={styles.itemStatusIcon}>
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
            <Circle cx="10" cy="10" r="10" fill="url(#grad)" />
          </Svg>
        </View>
        <View style={styles.itemSetTempWaterLevel}>
          <Text
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
          </Text>
        </View>
      </View>
      <Portal>
        <Dialog visible={dlgDevInfoVisible} onDismiss={hideDialogDevInfo}>
          <Dialog.Title>设备信息</Dialog.Title>
          <Dialog.Content>
            <Text>
              {'柜温： ' +
                intToText(devPros.cabinetTemp) +
                '°C' +
                ',\t\t\t\t蒸发器温度： ' +
                intToText(devPros.evaporatorTempe) +
                '°C' +
                ',\t\t\t冷凝器温度: ' +
                intToText(devPros.condenserTempe) +
                '°C'}
            </Text>
            <Text>
              {'NTC温度：' +
                intToText(devPros.ntcTempe) +
                '°C' +
                ',\t\t\t\t数字温度1： ' +
                floatToText(devPros.sht30OneTempe) +
                '°C' +
                ',\t\t\t\t数字湿度1： ' +
                floatToText(devPros.sht30OneHumi) +
                '%'}
            </Text>
            <Text>
              {'数字温度2： ' +
                floatToText(devPros.sht30TwoTempe) +
                '°C' +
                ',\t\t\t\t数字湿度2: ' +
                floatToText(devPros.sht30TwoHumi) +
                '%' +
                ',\t\t\t\t门检测1： ' +
                binStateToText(devPros.doorDetection1)}
            </Text>
            <Text>
              {'门检测2： ' +
                binStateToText(devPros.doorDetection2) +
                ',\t\t\t门输出: ' +
                binStateToText(devPros.doorStatusOut) +
                ',\t\t\t\t继电器1： ' +
                binStateToText(devPros.relay1Status)}
            </Text>
            <Text>
              {'继电器2： ' +
                binStateToText(devPros.relay2Status) +
                ',\t\t\t网卡类型: ' +
                netTypeToText(devPros.netType)}
            </Text>
            <View style={styles.input}>
              <TextInput
                label="设备名称"
                value={devName}
                onChangeText={text => setDevName(text)}
              />
              <TextInput
                label="场地名称"
                value={sceneName}
                onChangeText={text => setSceneName(text)}
              />
              <TextInput
                label="场地ID"
                value={sceneId}
                onChangeText={text => setSceneId(text)}
              />
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              icon="close"
              mode="contained"
              color="#e3e3e3"
              style={styles.dialogButton}
              onPress={hideDialogDevInfo}>
              关闭
            </Button>
            <Button
              icon="send"
              mode="contained"
              style={styles.dialogButton}
              onPress={onDialogDevInfoOk}>
              设置
            </Button>
          </Dialog.Actions>
        </Dialog>
        <Dialog visible={dlgRelay1Visible} onDismiss={hideDialogRelay1}>
          <Dialog.Title>设置继电器1</Dialog.Title>
          <Dialog.Content>
            <View style={styles.switchItem}>
              <Text style={styles.labelSwitchText}>
                {relay1Status ? '打开' : '关闭'}
              </Text>
              <Switch
                value={relay1Status}
                color="#e303fc"
                onValueChange={() => setRelay1Status(!relay1Status)}
              />
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              icon="close"
              mode="contained"
              color="#e3e3e3"
              style={styles.dialogButton}
              onPress={hideDialogRelay1}>
              取消
            </Button>
            <Button
              icon="send"
              mode="contained"
              style={styles.dialogButton}
              onPress={onDialogSetRelay1StatusOk}>
              确定
            </Button>
          </Dialog.Actions>
        </Dialog>
        <Dialog visible={dlgRelay2Visible} onDismiss={hideDialogRelay2}>
          <Dialog.Title>设置继电器2</Dialog.Title>
          <Dialog.Content>
            <View style={styles.switchItem}>
              <Text style={styles.labelSwitchText}>
                {relay2Status ? '打开' : '关闭'}
              </Text>
              <Switch
                value={relay2Status}
                color="#e303fc"
                onValueChange={() => setRelay2Status(!relay2Status)}
              />
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              icon="close"
              mode="contained"
              color="#e3e3e3"
              style={styles.dialogButton}
              onPress={hideDialogRelay2}>
              取消
            </Button>
            <Button
              icon="send"
              mode="contained"
              style={styles.dialogButton}
              onPress={onDialogSetRelay2StatusOk}>
              确定
            </Button>
          </Dialog.Actions>
        </Dialog>
        <Dialog
          visible={dlgFactoryResetWarning}
          onDismiss={hideDialogFactoryResetWarning}>
          <Dialog.Title>警告!</Dialog.Title>
          <Dialog.Content>
            <Text>
              您将进行恢复出厂设置操作，之前的所有设置即将被擦除，是否继续？
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              icon="close"
              mode="contained"
              color="#e3e3e3"
              style={styles.dialogButton}
              onPress={hideDialogFactoryResetWarning}>
              取消
            </Button>
            <Button
              icon="send"
              mode="contained"
              style={styles.dialogButton}
              onPress={onDialogFactoryResetOk}>
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
    backgroundColor: '#f9c2ff',
    padding: 20,
    marginVertical: 8,
    borderRadius: 5,
  },
  header: {
    fontSize: 32,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    color: '#2805f2',
  },
  errorMessage: {
    fontSize: 18,
    color: '#ff0000',
  },
  info: {
    fontSize: 15,
    marginTop: 5,
  },
  input: {
    fontSize: 18,
    marginTop: 5,
  },
  itemSetTempWaterLevel: {
    alignContent: 'flex-end',
    paddingVertical: 30,
    // flexDirection: 'row',
    marginHorizontal: 30,
  },
  itemAlarmMessage: {
    alignContent: 'center',
    paddingVertical: 30,
    flexDirection: 'row',
    marginHorizontal: 15,
  },
  itemSetTempWaterLevelText: {
    fontSize: 17,
    color: '#2805f2',
    paddingHorizontal: 5,
  },
  itemSetRefrgRelayText: {
    fontSize: 17,
    color: '#2805f2',
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
  sensorTypePicker: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputPicker: {
    width: '70%',
    marginHorizontal: 2,
  },
  dialogButton: {
    marginHorizontal: 10,
  },
  hide: {
    display: 'none',
  },
  show: {
    display: 'flex',
  },
});

export default Devices;
