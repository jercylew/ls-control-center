import React, { useEffect } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
  NativeEventEmitter,
  NativeModules,
} from 'react-native';
import { RadioButton, Button } from 'react-native-paper';
import ESPTouchModule from '../api/esptouch-wrapper';
import { button } from '../constants/button';
import { colors } from '../constants/colors';

const { ReactNativeLoading } = NativeModules;

const NetworkConfig = () => {
  const [ssid, setSsid] = React.useState('');
  const [bssid, setBssid] = React.useState('');
  const [password, onChangePassword] = React.useState('');
  const [numDev, onChangeNumDev] = React.useState(1);
  const [broadcast, onChangeBroadcast] = React.useState('broadcast');
  const [securePass, setSecurePass] = React.useState(true);
  const [connStatus, setConnStatus] = React.useState('');
  const [connSucc, setConnSucc] = React.useState(false);
  const [connBtnEnabled, setConnBtnEnabled] = React.useState(true);

  const onConfirmConnEspDev = () => {
    setConnStatus('');
    setConnBtnEnabled(false);
    ESPTouchModule.connectESPDevice(
      ssid,
      bssid,
      password,
      numDev,
      broadcast,
      (error, resp) => {
        if (error) {
          setConnStatus('连接失败！');
          setConnSucc(false);
          setConnBtnEnabled(true);
        }
      },
    );
  };

  useEffect(() => {
    ESPTouchModule.getSSID((error, retSsid) => {
      if (error) {
        console.error(`Error found! ${error}`);
      }
      console.log(`SSID ${retSsid} returned`);
      setSsid(retSsid);
    });

    ESPTouchModule.getBSSID((error, retBssid) => {
      if (error) {
        console.error(`Error found! ${error}`);
      }
      console.log(`BSSID ${retBssid} returned`);
      setBssid(retBssid);
    });

    const loadingManagerEmitter = new NativeEventEmitter(ReactNativeLoading);
    const subscription = loadingManagerEmitter.addListener(
      'esp_conn_update',
      updateMsg => {
        console.log(updateMsg);
        let respJson = JSON.parse(updateMsg);
        if (respJson.is_succeed) {
          if (respJson.exec_status === 0) {
            setConnStatus('正在连接...');
            setConnBtnEnabled(false);
          } else if (respJson.exec_status === 1) {
            setConnStatus('连接成功!');
            setConnSucc(true);
            setConnBtnEnabled(true);
          } else if (respJson.exec_status === -1) {
            setConnStatus('连接失败！');
            setConnBtnEnabled(true);
          } else {
            setConnStatus('');
          }
        } else {
          setConnStatus('连接失败！');
          setConnBtnEnabled(true);
        }
      },
    );

    return function cleanup() {
      subscription.remove();
    };
  });

  return (
    <SafeAreaView style={styles.topView}>
      <View style={styles.textContainer}>
        <Text style={styles.textPrefix}>SSID:</Text>
        <Text style={styles.text}>{ssid}</Text>
      </View>

      <View style={styles.textContainer}>
        <Text style={styles.textPrefix}>BSSID:</Text>
        <Text style={styles.text}>{bssid}</Text>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputPrefix}>密码:</Text>
        <TextInput
          secureTextEntry={true}
          onChangeText={onChangePassword}
          value={password}
          keyboardType={'default'}
          autoComplete={'password'}
          style={styles.input}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputPrefix}>设备数量:</Text>
        <TextInput
          onChangeText={onChangeNumDev}
          value={numDev.toString()}
          keyboardType={'numeric'}
          autoComplete={'password'}
          style={styles.input}
        />
      </View>

      <RadioButton.Group
        onValueChange={newValue => onChangeBroadcast(newValue)}
        value={broadcast}>
        <View style={styles.radiosGroup}>
          <View style={styles.radioItem}>
            <Text
              style={
                broadcast === 'broadcast'
                  ? styles.labelTexChecked
                  : styles.labelText
              }>
              广播
            </Text>
            <RadioButton
              style={styles.labelRadio}
              value="broadcast"
              color="#009FFC"
            />
          </View>
          <View style={styles.radioItem}>
            <Text
              style={
                broadcast === 'multicast'
                  ? styles.labelTexChecked
                  : styles.labelText
              }>
              组播
            </Text>
            <RadioButton
              style={styles.labelRadio}
              value="multicast"
              color="#009FFC"
            />
          </View>
        </View>
      </RadioButton.Group>

      <Text
        style={
          connSucc ? styles.statusOkText : styles.statusFailureText
        }>{`${connStatus}`}</Text>

      <Button
        mode="contained"
        disabled={!connBtnEnabled}
        onPress={onConfirmConnEspDev}
        color={button.color}
        contentStyle={button.contentStyle}
        labelStyle={button.labelStyle}
        style={styles.confirmButton}>
        确认
      </Button>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  topView: {
    flex: 1,
    fontSize: 20,
    backgroundColor: colors.pageBackground,
  },
  headerText: {
    margin: 8,
    padding: 2,
    fontSize: 20,
  },
  input: {
    width: 1000,
    fontSize: 20,
  },
  text: {
    width: 1000,
    fontSize: 20,
    color: '#009FFC',
  },
  radioItem: {
    flexDirection: 'row',
    margin: 8,
    padding: 2,
  },
  radiosGroup: {
    flexDirection: 'row',
  },
  labelText: {
    margin: 5,
    fontSize: 20,
    color: '#9AAAAA',
  },
  labelTexChecked: {
    margin: 5,
    fontSize: 20,
    color: '#009FFC',
  },
  labelRadio: {
    margin: 5,
    fontSize: 20,
  },
  confirmButton: {
    marginLeft: 35,
    marginRight: 35,
    marginTop: 50,
    borderRadius: 10,
  },
  statusOkText: {
    marginBottom: 20,
    marginTop: 20,
    marginLeft: 8,
    padding: 2,
    fontSize: 20,
    color: '#07f026',
  },
  statusFailureText: {
    marginBottom: 20,
    marginTop: 20,
    marginLeft: 8,
    padding: 2,
    fontSize: 20,
    color: '#f01707',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
    borderRadius: 10,
    height: 60,
    margin: 12,
    padding: 10,
    fontSize: 20,
    backgroundColor: colors.inputBackground,
  },
  inputPrefix: {
    paddingHorizontal: 5,
    fontSize: 20,
    color: '#9AAAAA',
  },
  textContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
    borderRadius: 10,
    height: 60,
    fontSize: 20,
    backgroundColor: colors.backgroundColor,
  },
  textPrefix: {
    paddingHorizontal: 5,
    fontSize: 20,
    color: '#9AAAAA',
  },
});

export default NetworkConfig;
