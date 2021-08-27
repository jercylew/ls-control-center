import MQTT from 'sp-react-native-mqtt';

function saveMqttSettings(settings) {
  const {
    mqtt_broker_address,
    mqtt_user,
    mqtt_password,
    mqtt_client_id,
    mqtt_port,
    callback_on_message,
  } = settings;
  console.log(settings);

  //Sync to local storage
}

class MqttUtility {
  constructor(options) {
    // const {
    //   mqtt_broker_address,
    //   mqtt_user,
    //   mqtt_password,
    //   mqtt_client_id,
    //   mqtt_port,
    //   callback_on_message,
    // } = options;

    // this.mqtt_broker_address = mqtt_broker_address;
    // this.mqtt_user = mqtt_user;
    // this.mqtt_password = mqtt_password;
    // this.mqtt_client_id = mqtt_client_id;
    // this.mqtt_port = mqtt_port;
    // this.callback_on_message = callback_on_message;
    // this.mqtt_client = null;
  }

  init() {
    // this.mqtt_client = MQTT.createClient({
    //   port: this.mqtt_port,
    //   host: this.mqtt_broker_address,
    //   user: this.mqtt_user,
    //   pass: this.mqtt_password,
    //   clientId: this.mqtt_client_id,
    // });

    // this.mqtt_client.on('closed', function () {
    //   console.log('mqtt.event.closed');
    // });

    // this.mqtt_client.on('error', function (msg) {
    //   console.log('mqtt.event.error', msg);
    // });

    // this.mqtt_client.on('message', function (msg) {
    //   console.log('mqtt.event.message', msg);
    // });

    // this.mqtt_client.on('connect', function () {
    //   console.log('connected');
    //   this.mqtt_client.subscribe('/data', 0);
    //   this.mqtt_client.publish('/data', 'test', 0, false);
    // });

    // this.mqtt_client.connect();
  }

  publish(topic, payload) {}

  close() {
    // if (this.mqtt_client === null) {
    //   return;
    // }
    // this.mqtt_client.disconnect();
  }
}

export {saveMqttSettings, MqttUtility};
