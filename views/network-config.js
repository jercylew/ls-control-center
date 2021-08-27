import React from 'react';
import {SafeAreaView, StyleSheet, Text, View} from 'react-native';
import {RadioButton, Button, TextInput} from 'react-native-paper';

const NetworkConfig = () => {
  const [txtPassword, onChangePassword] = React.useState('');
  const [number, onChangeNumber] = React.useState('1');
  const [value, setValue] = React.useState('broadcast');
  const [securePass, setSecurePass] = React.useState(true);

  return (
    <SafeAreaView style={styles.topView}>
      <Text style={styles.headerText}>SSID:</Text>
      <Text style={styles.headerText}>BSSID:</Text>

      <TextInput
        style={styles.input}
        label="密码"
        onChangeText={onChangePassword}
        secureTextEntry={securePass}
        value={txtPassword}
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
        onChangeText={onChangeNumber}
        value={number.toString()}
        label="设备数量"
        keyboardType="numeric"
      />

      <RadioButton.Group
        onValueChange={newValue => setValue(newValue)}
        value={value}>
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
        onPress={() => console.log('Pressed')}
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
    // borderWidth: 1,
    // padding: 10,
    borderRadius: 10,
    // fontSize: 20,
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
