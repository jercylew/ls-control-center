import React, {Component} from 'react';
import {
  StyleSheet,
  Text,
  SafeAreaView,
  SectionList,
  StatusBar,
  TouchableOpacity,
  View,
} from 'react-native';
import {Button, Dialog, Portal, TextInput} from 'react-native-paper';
import {useSelector, useDispatch} from 'react-redux';
import {saveDeviceInfo, selectScenes} from '../data/device-slice';

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
  const [visible, setVisible] = React.useState(false);
  const [max_temp, setMaxTemp] = React.useState(100);
  const [max_water_level, setMaxWaterLevel] = React.useState(600);
  const [dev_name, setDevName] = React.useState(devPros.name);
  const [scene_name, setSceneName] = React.useState(devPros.scene_name);
  const [scene_id, setSceneId] = React.useState(devPros.scene_id);

  const showDialog = () => setVisible(true);
  const hideDialog = () => setVisible(false);

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

  function onDialogOk() {
    if (scene_name !== devPros.scene_name) {
      console.log(
        'Device with id `' +
          devPros.id +
          '` changed to new scene ' +
          scene_name,
      );
    }

    devPros.scene_name = scene_name;
    devPros.name = dev_name;

    //TODO: Not allowed to edit scene_id
    //If it is the new created device(scene_name: NA, scene_id: NA, scene_name: NA),
    //auto-generate a scene_id and set it editable for the user
    //Otherwise set it readonly
    //Require: a backend server to store the device_id and scene map table,
    //1) HTTP: GET /api/scene/device/LS_100002
    devPros.scene_id = scene_id;

    //Save to local
    //dispatch(saveDeviceInfo(devPros))

    //Via MQTT command: saveDeviceInfo
    //{scene_id, scene_name, device_name, remote_address, remote_port,
    // mqtt_user_name, mqtt_user_password, mqtt_port, mqtt_client_id, wifi_ssid, wifi_password}

    //Via MQTT command: saveMaxTemp(), saveMaxWaterLevel()

    hideDialog();
  }

  return (
    <>
      <TouchableOpacity
        style={styles.item}
        onPress={() => {
          console.log('Item Clicked', devPros);
          showDialog();
        }}>
        <Text style={styles.title}>{devPros.name}</Text>
        <Text style={styles.info}>{devPros.id}</Text>
      </TouchableOpacity>
      <Portal>
        <Dialog visible={visible} onDismiss={hideDialog}>
          <Dialog.Title>设备信息</Dialog.Title>
          <Dialog.Content>
            <Text>
              {'加热中： ' +
                boolToText(devPros.is_heating) +
                ',\t\t\t\t上水中： ' +
                boolToText(devPros.is_up_water)}
            </Text>
            <Text>
              {'温度：' +
                devPros.detection_temperature +
                ',\t\t\t\t水位： ' +
                devPros.water_level_detection}
            </Text>
            <Text>网卡类型： {netTypeToText(devPros.net_type)}</Text>
            <View style={styles.input}>
              <TextInput
                label="设备名称"
                value={dev_name}
                onChangeText={text => setDevName(text)}
              />
              <TextInput
                label="场地名称"
                value={scene_name}
                onChangeText={text => setSceneName(text)}
              />
              <TextInput
                label="场地ID"
                value={scene_id}
                onChangeText={text => setSceneId(text)}
              />
              <TextInput
                label="最高温度"
                value={max_temp.toString()}
                onChangeText={text => setMaxTemp(textToInt(text))}
                keyboardType="numeric"
              />
              <TextInput
                label="最高水位"
                value={max_water_level.toString()}
                onChangeText={text => setMaxWaterLevel(textToInt(text))}
                keyboardType="numeric"
              />
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={hideDialog}>关闭</Button>
            <Button onPress={onDialogOk}>设置</Button>
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
        sections={scenes} //{DATA}
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
  },
  info: {
    fontSize: 15,
    marginTop: 5,
  },
  input: {
    fontSize: 18,
    marginTop: 5,
  },
});

export default Devices;
