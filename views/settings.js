import React, { Component } from 'react';
import { View, StyleSheet, Text, TextInput } from 'react-native';
import { Button } from 'react-native-paper';
import { button } from '../constants/button';
import { colors } from '../constants/colors';

class Settings extends Component {
  constructor(props) {
    super(props);
    this.state = {
      mqtt_broker: '118.24.201.167',
      mqtt_user: 'tkt_iot_user',
      mqtt_password: 'tkt1qazm,./',
      mqtt_port: '1883',
      mqtt_client_id: 'app-12sw322',
      securePass: true,
    };

    this.setMqttBroker = this.setMqttBroker.bind(this);
    this.setMqttUser = this.setMqttUser.bind(this);
    this.setMqttPassword = this.setMqttPassword.bind(this);
    this.setMqttPort = this.setMqttPort.bind(this);
    this.setMqttClientId = this.setMqttClientId.bind(this);
    this.setSecurePass = this.setSecurePass.bind(this);
  }

  setMqttBroker(value) {
    this.setState({ mqtt_broker: value });
  }

  setMqttUser(value) {
    this.setState({ mqtt_user: value });
  }

  setMqttPassword(value) {
    this.setState({ mqtt_password: value });
  }

  setMqttPort(value) {
    this.setState({ mqtt_port: value });
  }

  setMqttClientId(value) {
    this.setState({ mqtt_client_id: value });
  }

  setSecurePass(value) {
    this.setState({ securePass: value });
  }

  render() {
    return (
      <View style={styles.topView}>
        <View style={styles.inputContainer}>
          <Text style={styles.labelText}>MQTT Server:</Text>
          <TextInput
            style={styles.input}
            value={this.state.mqtt_broker}
            onChangeText={this.setMqttBroker}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.labelText}>MQTT User Name:</Text>
          <TextInput
            style={styles.input}
            value={this.state.mqtt_user}
            onChangeText={this.setMqttUser}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.labelText}>MQTT User Password:</Text>
          <TextInput
            style={styles.input}
            value={this.state.mqtt_password}
            secureTextEntry={true}
            onChangeText={this.setMqttPassword}
            // right={
            //   <TextInput.Icon
            //     name="eye"
            //     onPress={() => {
            //       this.setSecurePass(!securePass);
            //     }}
            //   />
            // }
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.labelText}>MQTT Client Id:</Text>
          <TextInput
            style={styles.input}
            value={this.state.mqtt_client_id}
            onChangeText={this.setMqttClientId}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.labelText}>MQTT Port:</Text>
          <TextInput
            style={styles.input}
            value={this.state.mqtt_port}
            keyboardType="numeric"
            onChangeText={this.setMqttPort}
          />
        </View>

        <Button
          mode="contained"
          color={button.color}
          onPress={() => console.log('Pressed')}
          contentStyle={button.contentStyle}
          labelStyle={button.labelStyle}
          style={styles.confirmButton}>
          确认
        </Button>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  topView: {
    fontSize: 20,
    margin: 8,
  },
  input: {
    fontSize: 20,
    height: 60,
    marginTop: 5,
    borderRadius: 10,
    color: '#009FFC',
    backgroundColor: colors.inputBackground,
  },
  confirmButton: {
    marginLeft: 45,
    marginRight: 45,
    marginTop: 20,
    borderRadius: 10,
  },
  inputContainer: {
    borderRadius: 10,
    marginHorizontal: 5,
    marginVertical: 8,
    fontSize: 20,
  },
  labelText: {
    color: '#9AAAAA',
  },
});

export default Settings;
