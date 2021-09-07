import React from 'react';
import {
  StyleSheet,
  Text,
  SafeAreaView,
  SectionList,
  StatusBar,
  View,
} from 'react-native';
import {Button, Dialog, Portal, TextInput} from 'react-native-paper';
import {useSelector, useDispatch} from 'react-redux';
import {saveDeviceInfo, selectScenes} from '../data/device-slice';
import {useMqttClient} from '../api/mqtt-hooks';

const TOPIC_DEV_CMD_PREFIX = '$thing/down/control/sale_table/';

const DATA = [
  {
    title: '广电开源名都酒店',
    data: [
      {
        name: '保温售菜台1',
        scene_id: '1a2e34-65fd31ea03',
        scene_name: '广电开源名都酒店',
        id: 'LS_100001',
        is_heating: 1,
        is_up_water: 0,
        net_type: 1,
        detection_temperature: 105,
        water_level_detection: 1000,
        error: '',
      },
      {
        name: '保温售菜台2',
        id: 'LS_100002',
        scene_id: '1a2e34-65fd31ea03',
        scene_name: '广电开源名都酒店',
        is_heating: 0,
        is_up_water: 1,
        net_type: 1,
        detection_temperature: 0,
        water_level_detection: 1000,
        error: '',
      },
    ],
  },
  {
    title: '金迪酒店',
    data: [
      {
        name: '保温售菜台1',
        id: 'LS_100003',
        scene_id: '1b203f-01edf1ebc7',
        scene_name: '金迪酒店',
        is_heating: 0,
        is_up_water: 0,
        net_type: 1,
        detection_temperature: 0,
        water_level_detection: 1000,
        error: '',
      },
      {
        name: '保温售菜台',
        id: 'LS_100004',
        scene_id: '1b203f-01edf1ebc7',
        scene_name: '金迪酒店',
        is_heating: 0,
        is_up_water: 0,
        net_type: 1,
        detection_temperature: 0,
        water_level_detection: 1000,
        error: '',
      },
    ],
  },
];

const Item = ({devPros}) => {
  const [dlgDevInfoVisible, setDlgDevInfoVisible] = React.useState(false);
  const [dlgMaxTempVisible, seDlgMaxTempVisible] = React.useState(false);
  const [dlgMaxWaterLevelVisible, seDlgMaxWaterLevelVisible] =
    React.useState(false);
  const [maxTemp, setMaxTemp] = React.useState(100);
  const [maxWaterLevel, setMaxWaterLevel] = React.useState(600);
  const [devName, setDevName] = React.useState(devPros.name);
  const [sceneName, setSceneName] = React.useState(devPros.sceneName);
  const [sceneId, setSceneId] = React.useState(devPros.sceneId);

  const showDialogDevInfo = () => setDlgDevInfoVisible(true);
  const hideDialogDevInfo = () => setDlgDevInfoVisible(false);

  const showDialogMaxTemp = () => seDlgMaxTempVisible(true);
  const hideDialogMaxTemp = () => seDlgMaxTempVisible(false);

  const showDialogMaxWaterLevel = () => seDlgMaxWaterLevelVisible(true);
  const hideDialogMaxWaterLevel = () => seDlgMaxWaterLevelVisible(false);

  const devCmdTopic = TOPIC_DEV_CMD_PREFIX + devPros.id;
  const {sendCommand} = useMqttClient();

  function boolToText(value) {
    return value ? '是' : '否';
  }

  function netTypeToText(value) {
    if (value === 1) {
      return 'Wifi';
    } else if (value === 2) {
      return '4G';
    } else {
      return '未设置';
    }
  }

  function textToInt(value) {
    if (/^[-+]?(\d+|Infinity)$/.test(value)) {
      return Number(value);
    } else {
      return 0;
    }
  }

  function onDialogDevInfoOk() {
    if (sceneName !== devPros.sceneName) {
      console.log(
        'Device with id `' + devPros.id + '` changed to new scene ' + sceneName,
      );
    }

    devPros.sceneName = sceneName;
    devPros.name = devName;

    //TODO: Not allowed to edit scene_id
    //If it is the new created device(scene_name: NA, scene_id: NA, scene_name: NA),
    //auto-generate a scene_id and set it editable for the user
    //Otherwise set it readonly
    //Require: a backend server to store the device_id and scene map table,
    //1) HTTP: GET /api/scene/device/LS_100002
    devPros.sceneId = sceneId;

    //Save to local
    //dispatch(saveDeviceInfo(devPros))

    //Via MQTT command: saveDeviceInfo
    //{scene_id, scene_name, device_name, remote_address, remote_port,
    // mqtt_user_name, mqtt_user_password, mqtt_port, mqtt_client_id, wifi_ssid, wifi_password}

    //Via MQTT command: saveMaxTemp(), saveMaxWaterLevel()
    let cmdJson = {
      device_id: devPros.id,
      method: 'configure',
      params: {
        Scene_Name: devPros.sceneName,
        Scene_Id: devPros.sceneId,
        Device_Name: devPros.name,
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
    sendCommand(devCmdTopic, JSON.stringify(cmdJson));
  }

  function onDialogSetMaxTempOk() {
    hideDialogMaxTemp();

    let cmdJson = {
      device_id: devPros.id,
      method: 'control',
      params: {
        Temp_Max: maxTemp,
      },
    };
    sendCommand(devCmdTopic, JSON.stringify(cmdJson));
  }

  function onDialogSetMaxWaterLevelOk() {
    hideDialogMaxWaterLevel();
    let cmdJson = {
      device_id: devPros.id,
      method: 'control',
      params: {
        Water_Level_Max: maxWaterLevel,
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
              showDialogDevInfo();
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
              showDialogMaxTemp();
            }}>
            设置温度
          </Text>
          <Text
            style={styles.itemSetTempWaterLevelText}
            onPress={() => {
              console.log('Item Clicked, setting water level', devPros);
              showDialogMaxWaterLevel();
            }}>
            设置水位
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
                ',\t\t\t\t上水中： ' +
                boolToText(devPros.isUpWater)}
            </Text>
            <Text>
              {'温度：' +
                devPros.detectionTemperature +
                ',\t\t\t\t水位： ' +
                devPros.waterLevelDetection}
            </Text>
            <Text>网卡类型： {netTypeToText(devPros.netType)}</Text>
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
              <TextInput
                label="最高温度"
                value={maxTemp.toString()}
                onChangeText={text => setMaxTemp(textToInt(text))}
                keyboardType="numeric"
                disabled={true}
              />
              <TextInput
                label="最高水位"
                value={maxWaterLevel.toString()}
                onChangeText={text => setMaxWaterLevel(textToInt(text))}
                keyboardType="numeric"
                disabled={true}
              />
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={hideDialogDevInfo}>关闭</Button>
            <Button onPress={onDialogDevInfoOk}>设置</Button>
          </Dialog.Actions>
        </Dialog>
        <Dialog visible={dlgMaxTempVisible} onDismiss={hideDialogMaxTemp}>
          <Dialog.Title>设置温度</Dialog.Title>
          <Dialog.Content>
            <View>
              <TextInput
                label="温度"
                value={maxTemp.toString()}
                onChangeText={text => setMaxTemp(textToInt(text))}
                keyboardType="numeric"
              />
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={hideDialogMaxTemp}>取消</Button>
            <Button onPress={onDialogSetMaxTempOk}>确定</Button>
          </Dialog.Actions>
        </Dialog>
        <Dialog
          visible={dlgMaxWaterLevelVisible}
          onDismiss={hideDialogMaxWaterLevel}>
          <Dialog.Title>设置水位</Dialog.Title>
          <Dialog.Content>
            <View>
              <TextInput
                label="水位"
                value={maxWaterLevel.toString()}
                onChangeText={text => setMaxWaterLevel(textToInt(text))}
                keyboardType="numeric"
              />
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={hideDialogMaxWaterLevel}>取消</Button>
            <Button onPress={onDialogSetMaxWaterLevelOk}>确定</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
};

const Devices = () => {
  const scenes = useSelector(selectScenes);
  const dispatch = useDispatch();

  return (
    <SafeAreaView style={styles.container}>
      <SectionList
        sections={scenes}
        keyExtractor={(item, index) => item.id + index}
        renderItem={({item}) => <Item devPros={item} />}
        renderSectionHeader={({section: {title}}) => (
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
  },
  header: {
    fontSize: 32,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    color: '#2805f2',
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
    paddingHorizontal: 100,
    paddingVertical: 30,
    flexDirection: 'row',
  },
  itemSetTempWaterLevelText: {
    fontSize: 17,
    color: '#2805f2',
    paddingHorizontal: 5,
  },
});

export default Devices;
