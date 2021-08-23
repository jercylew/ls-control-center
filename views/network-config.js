import React from 'react';
import {SafeAreaView, StyleSheet, TextInput, Text, Switch} from 'react-native';

const NetworkConfig = () => {
  const [text, onChangeText] = React.useState('Password');

  const [number, onChangeNumber] = React.useState(null);

  const [isEnabled, setIsEnabled] = React.useState(false);

  const toggleSwitch = () => setIsEnabled(previousState => !previousState);

  return (
    <SafeAreaView>
      <Text style={styles.label}>SSID:</Text>

      <Text style={styles.label}>BSSID:</Text>

      <TextInput
        style={styles.input}
        onChangeText={onChangeText}
        placeholder="密码"
        secureTextEntry={true}
        value={text}
        label="密码"
      />

      <TextInput
        style={styles.input}
        onChangeText={onChangeNumber}
        value={number}
        placeholder="设备数量"
        keyboardType="numeric"
      />

      <Switch
        style={styles.label}
        trackColor={{false: '#767577', true: '#81b0ff'}}
        thumbColor={isEnabled ? '#f5dd4b' : '#f4f3f4'}
        ios_backgroundColor="#3e3e3e"
        onValueChange={toggleSwitch}
        value={isEnabled}
      />

      <Switch
        style={styles.label}
        trackColor={{false: '#767577', true: '#81b0ff'}}
        thumbColor={isEnabled ? '#f5dd4b' : '#f4f3f4'}
        ios_backgroundColor="#3e3e3e"
        onValueChange={toggleSwitch}
        value={isEnabled}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  input: {
    height: 40,
    margin: 12,
    borderWidth: 1,
    padding: 10,
  },

  label: {
    height: 20,
    margin: 12,
    padding: 2,
  },
});

export default NetworkConfig;