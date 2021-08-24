function saveMqttSettings(settings) {
  const {
    mqtt_broker_address,
    mqtt_user,
    mqtt_password,
    mqtt_client_id,
    mqtt_port,
  } = settings;
  console.log(settings);

  //Sync to local storage
}

function sendDevCommand(command) {
  //Mqtt publish
}

class MqttUtility {
  constructor(settings) {
    const {
      mqtt_broker_address,
      mqtt_user,
      mqtt_password,
      mqtt_client_id,
      mqtt_port,
      callback_on_message,
    } = settings;

    this.mqtt_broker_address = mqtt_broker_address;
    this.mqtt_user = mqtt_user;
    this.mqtt_password = mqtt_password;
    this.mqtt_client_id = mqtt_client_id;
    this.mqtt_port = mqtt_port;
    this.callback_on_message = callback_on_message;
  }

  init() {
    //Connect to broker
  }

  publish(topic, payload) {}

  close() {}
}

export {saveMqttSettings, sendDevCommand, MqttUtility};
