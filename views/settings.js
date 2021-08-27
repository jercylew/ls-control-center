import React, {Component} from 'react';
import {View, StyleSheet} from 'react-native';
import {TextInput, Button} from 'react-native-paper';

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
    this.setState({mqtt_broker: value});
  }

  setMqttUser(value) {
    this.setState({mqtt_user: value});
  }

  setMqttPassword(value) {
    this.setState({mqtt_password: value});
  }

  setMqttPort(value) {
    this.setState({mqtt_port: value});
  }

  setMqttClientId(value) {
    this.setState({mqtt_client_id: value});
  }

  setSecurePass(value) {
    this.setState({securePass: value});
  }

  render() {
    const {
      mqtt_broker,
      mqtt_user,
      mqtt_password,
      mqtt_port,
      mqtt_client_id,
      securePass,
    } = this.state;

    return (
      <View style={styles.topView}>
        <TextInput
          style={styles.input}
          label="MQTT Server"
          value={mqtt_broker}
          onChangeText={this.setMqttBroker}
        />
        <TextInput
          style={styles.input}
          label="MQTT User Name"
          value={mqtt_user}
          onChangeText={this.setMqttUser}
        />
        <TextInput
          style={styles.input}
          label="MQTT User Password"
          value={mqtt_password}
          secureTextEntry={securePass}
          right={
            <TextInput.Icon
              name="eye"
              onPress={() => {
                this.setSecurePass(!securePass);
              }}
            />
          }
          onChangeText={this.setMqttPassword}
        />
        <TextInput
          style={styles.input}
          label="MQTT Client Id"
          value={mqtt_client_id}
          onChangeText={this.setMqttClientId}
        />
        <TextInput
          style={styles.input}
          label="MQTT Port"
          value={mqtt_port}
          keyboardType="numeric"
          onChangeText={this.setMqttPort}
        />
        <Button
          mode="contained"
          icon="star"
          onPress={() => console.log('Pressed')}
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
    margin: 5,
    borderRadius: 10,
  },
  confirmButton: {
    margin: 5,
    borderRadius: 10,
  },
});

export default Settings;
