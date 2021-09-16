import React, {useEffect} from 'react';
import {SafeAreaView, StyleSheet, Text, View} from 'react-native';
import {RadioButton, Button, TextInput} from 'react-native-paper';

import ESPTouchModule from '../api/esptouch-wrapper';

const NetworkConfig = () => {
  const [ssid, setSsid] = React.useState('');
  const [bssid, setBssid] = React.useState('');
  const [password, onChangePassword] = React.useState('');
  const [numDev, onChangeNumDev] = React.useState(1);
  const [broadcast, onChangeBroadcast] = React.useState('broadcast');
  const [securePass, setSecurePass] = React.useState(true);

  const onConfirmConnEspDev = () => {
    ESPTouchModule.connectESPDevice(
      ssid,
      bssid,
      password,
      numDev,
      broadcast,
      (error, bSucceed) => {
        if (error) {
          console.error(`Error found! ${error}`);
        }

        if (bSucceed) {
          console.log('Connecting ESP device succeed!');
        } else {
          console.log('Failed to connect ESP device');
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

      <Button
        mode="contained"
        icon="set-center"
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
});

export default NetworkConfig;
