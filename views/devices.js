import React from 'react';
import {
  StyleSheet,
  Text,
  SafeAreaView,
  SectionList,
  StatusBar,
  View,
} from 'react-native';
import { Button, Dialog, Portal, TextInput, Switch } from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
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
  return value === 1 ? '超声波' : '传统';
};

//TODO: Using state not props in this component, the sstate and name may always change,
//which cannot be reflected while using props
const SaleTableItem = ({ devPros }) => {
  const [dlgDevInfoVisible, setDlgDevInfoVisible] = React.useState(false);
  const [dlgSettingVisible, setDlgSettingVisible] = React.useState(false);
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
  const [waterStopOut, setWaterStopOut] = React.useState(devPros.waterStopOut);
  const [tempRetDiff, setTempRetDiff] = React.useState(devPros.tempRetDiff);
  const [waterRetDiff, setWaterRetDiff] = React.useState(devPros.waterRetDiff);
  const [tempOutDelay, setTempOutDelay] = React.useState(devPros.tempOutDelay);

  const [devName, setDevName] = React.useState(devPros.name);
  const [sceneName, setSceneName] = React.useState(devPros.sceneName);
  const [sceneId, setSceneId] = React.useState(devPros.sceneId);
  const [tempMessageShow, setTempMessageShow] = React.useState(false);
  const [waterMessageShow, setWaterMessageShow] = React.useState(false);

  const dispatch = useDispatch();

  const showDialogDevInfo = () => setDlgDevInfoVisible(true);
  const hideDialogDevInfo = () => setDlgDevInfoVisible(false);

  const showDialogSettingDevInfo = () => setDlgSettingVisible(true);
  const hideDialogSettingDevInfo = () => setDlgSettingVisible(false);

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
    //Check if setting meet conditions
    let skipSet = false;
    if (devPros.lowTempAlarm < maxTemp - tempRetDiff) {
      setTempMessageShow(true);
      skipSet = true;
    }

    if (devPros.lowWaterLevelAlarm < maxWaterLevel - waterRetDiff) {
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

    hideDialogSettingDevInfo();
    let cmdJson = {
      device_id: devPros.id,
      method: 'control',
      params: {
        Temp_Max: maxTemp,
        Water_Level_Max: maxWaterLevel,
        Temp_Ret_diff: tempRetDiff,
        water_Ret_diff: waterRetDiff,
        Water_Stop_Out: waterStopOut,
        Water_Start_Out: waterStartOut,
        Temp_Out_Delay: tempOutDelay,
        Lowest_water_Level: lowestWaterLevel,
      },
    };
    sendCommand(devCmdTopic, JSON.stringify(cmdJson));
  }

  return (
    <>
      <View style={styles.item}>
        <View>
          <Text
            style={styles.title}
            onPress={() => {
              console.log(
                'Item Clicked, setting device info',
                devName,
                ', ',
                sceneName,
                ', ',
                sceneId,
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
        </View>
        <View style={styles.itemSetTempWaterLevel}>
          <Text
            style={styles.itemSetTempWaterLevelText}
            onPress={() => {
              console.log('Item Clicked, setting temperature', devPros);
              showDialogSettingDevInfo();
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
                intToText(devPros.tempRetDiff) +
                ',\t水位回差： ' +
                intToText(devPros.waterRetDiff)}
            </Text>
            <Text
              style={devPros.waterSensorType === 1 ? styles.show : styles.hide}>
              {'设置水位： ' +
                intToText(devPros.maxWaterLevel) +
                'mm' +
                ',\t\t\t当前水位： ' +
                intToText(devPros.waterLevelDetection) +
                'mm' +
                ',\t\t\t最低水位值： ' +
                intToText(devPros.lowestWaterLevel) +
                'mm'}
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
              {'网卡类型：' +
                netTypeToText(devPros.netType) +
                ',\t固件版本：' +
                devPros.firmwareVersion +
                ',\t传感器类型：' +
                waterSensorType(devPros.waterSensorType)}
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
            <Button onPress={hideDialogDevInfo}>关闭</Button>
            <Button onPress={onDialogDevInfoOk}>设置</Button>
          </Dialog.Actions>
        </Dialog>
        <Dialog
          visible={dlgSettingVisible}
          onDismiss={hideDialogSettingDevInfo}>
          <Dialog.Title>设置</Dialog.Title>
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
            <View
              style={
                devPros.waterSensorType === 1
                  ? styles.inputColumnTwo
                  : styles.hide
              }>
              <TextInput
                style={styles.inputColumnItem}
                label="设置水位(mm)"
                value={intToText(maxWaterLevel)}
                onChangeText={text => setMaxWaterLevel(textToInt(text))}
                keyboardType="numeric"
              />
              <TextInput
                style={styles.inputColumnItem}
                label="最低水位值(mm)"
                value={intToText(lowestWaterLevel)}
                onChangeText={text => setLowestWaterLevel(textToInt(text))}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.inputColumnTwo}>
              <TextInput
                style={styles.inputColumnItem}
                label="水位回差(mm)"
                value={intToText(waterRetDiff)}
                onChangeText={text => setWaterRetDiff(textToInt(text))}
                keyboardType="numeric"
              />
              <TextInput
                style={styles.inputColumnItem}
                label="加热输出延时"
                value={intToText(tempOutDelay)}
                onChangeText={text => setTempOutDelay(textToInt(text))}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.inputColumnTwo}>
              <TextInput
                style={styles.inputColumnItem}
                label="上水输出延时"
                value={intToText(waterStartOut)}
                onChangeText={text => setWaterStartOut(textToInt(text))}
                keyboardType="numeric"
              />
              <TextInput
                style={styles.inputColumnItem}
                label="停止上水延时"
                value={intToText(waterStopOut)}
                onChangeText={text => setWaterStopOut(textToInt(text))}
                keyboardType="numeric"
              />
            </View>
            <Text style={styles.errorMessage}>
              {tempMessageShow ? '温度设置值不得高于报警值！' : ''}
            </Text>
            <Text style={styles.errorMessage}>
              {waterMessageShow ? '水位设置值不得高于报警值！' : ''}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={hideDialogSettingDevInfo}>取消</Button>
            <Button onPress={onDialogSettingOk}>确定</Button>
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
        </View>
        <View style={styles.itemSetTempWaterLevel}>
          <Text
            style={styles.itemSetTempWaterLevelText}
            onPress={() => {
              console.log('Item Clicked, setting temperature', devPros);
              showDialogRelay1();
            }}>
            设置继电器1
          </Text>
          <Text
            style={styles.itemSetTempWaterLevelText}
            onPress={() => {
              console.log('Item Clicked, setting water level', devPros);
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
            <Button onPress={hideDialogDevInfo}>关闭</Button>
            <Button onPress={onDialogDevInfoOk}>设置</Button>
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
            <Button onPress={hideDialogRelay1}>取消</Button>
            <Button onPress={onDialogSetRelay1StatusOk}>确定</Button>
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
            <Button onPress={hideDialogRelay2}>取消</Button>
            <Button onPress={onDialogSetRelay2StatusOk}>确定</Button>
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

  //Make a copy, and remove the empty scenes
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
        sections={renderScenes} //scenes
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
    flexDirection: 'row',
    marginHorizontal: 30,
  },
  itemSetTempWaterLevelText: {
    fontSize: 17,
    color: '#2805f2',
    paddingHorizontal: 5,
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
  hide: {
    display: 'none',
  },
  show: {
    display: 'flex',
  },
});

export default Devices;
