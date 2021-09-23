import React, {useEffect} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  NativeEventEmitter,
  NativeModules,
} from 'react-native';
import {RadioButton, Button, TextInput} from 'react-native-paper';
import ESPTouchModule from '../api/esptouch-wrapper';

const {ReactNativeLoading} = NativeModules;

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
      <Text style={styles.headerText}>{`SSID: ${ssid}`}</Text>
      <Text style={styles.headerText}>{`BSSID: ${bssid}`}</Text>

      <TextInput
        style={styles.input}
        label="密码"
        onChangeText={onChangePassword}
        secureTextEntry={securePass}
        value={password}
        right={
          <TextInput.Icon
            name="eye"
            onPress={() => {
              setSecurePass(!securePass);
            }}
          />
        }
      />

      <TextInput
        style={styles.input}
        onChangeText={onChangeNumDev}
        value={numDev.toString()}
        label="设备数量"
        keyboardType="numeric"
      />

      <RadioButton.Group
        onValueChange={newValue => onChangeBroadcast(newValue)}
        value={broadcast}>
        <View style={styles.radiosGroup}>
          <View style={styles.radioItem}>
            <Text style={styles.labelText}>广播</Text>
            <RadioButton style={styles.labelRadio} value="broadcast" />
          </View>
          <View style={styles.radioItem}>
            <Text style={styles.labelText}>组播</Text>
            <RadioButton style={styles.labelRadio} value="multicast" />
          </View>
        </View>
      </RadioButton.Group>

      <Text
        style={
          connSucc ? styles.statusOkText : styles.statusFailureText
        }>{`${connStatus}`}</Text>

      <Button
        mode="contained"
        icon="set-center"
        disabled={!connBtnEnabled}
        onPress={onConfirmConnEspDev}
        style={styles.confirmButton}>
        确认
      </Button>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  topView: {
    fontSize: 20,
    margin: 8,
  },
  headerText: {
    margin: 8,
    padding: 2,
    fontSize: 20,
  },
  input: {
    margin: 5,
    borderRadius: 10,
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
  },
  labelRadio: {
    margin: 5,
    fontSize: 20,
  },
  confirmButton: {
    // height: 50,
    margin: 5,
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
});

export default NetworkConfig;
