//home.js View for displaying device status
import React, {Component} from 'react';
import {View, StyleSheet} from 'react-native';
import {TextInput, Button} from 'react-native-paper';
import {saveMqttSettings} from '../api/mqtt-wrapper';

class Settings extends Component {
  constructor(props) {
    super(props);

    this.state = {
      mqtt_broker_address: '118.24.201.167',
      mqtt_user: 'tkt_iot_user',
      mqtt_password: 'tkt1qazm,./',
      mqtt_client_id: 'app-12sw322',
      mqtt_port: 1883,
      securePass: true,
    };

    this.handleSaveSettings = this.handleSaveSettings.bind(this);
  }

  handleSaveSettings() {
    saveMqttSettings(this.state);
  }

  toggleSecurePass() {
    const secure = this.state.securePass;
    this.setState({securePass: !secure});
    console.log(this.state);
  }

  render() {
    const {
      mqtt_broker_address,
      mqtt_user,
      mqtt_password,
      mqtt_client_id,
      mqtt_port,
      securePass,
    } = this.state;

    return (
      <View style={styles.topView}>
        <TextInput
          style={styles.input}
          label="MQTT Server"
          value={mqtt_broker_address}
          onChangeText={text => this.setState({mqtt_broker_address: text})}
        />
        <TextInput
          style={styles.input}
          label="MQTT User Name"
          value={mqtt_user}
          onChangeText={text => this.setState({mqtt_user: text})}
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
                this.toggleSecurePass();
              }}
            />
          }
          onChangeText={text => this.setState({mqtt_password: text})}
        />
        <TextInput
          style={styles.input}
          label="MQTT Client Id"
          value={mqtt_client_id}
          onChangeText={text => this.setState({mqtt_client_id: text})}
        />
        <TextInput
          style={styles.input}
          label="MQTT Port"
          value={mqtt_port.toString()}
          keyboardType="numeric"
          onChangeText={text => this.setState({mqtt_port: parseInt(text, 10)})}
        />
        <Button
          mode="contained"
          icon="star"
          onPress={this.handleSaveSettings}
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
    // borderWidth: 1,
    // padding: 10,
    borderRadius: 10,
    // borderColor: '#0786ed',
  },
  confirmButton: {
    // height: 50,
    // paddingTop: 15,
    margin: 5,
    borderRadius: 10,
  },
});

export default Settings;
