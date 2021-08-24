function getWifiState() {
  let wifiState = {
    ssid: '',
    bssid: '',
  };
  //Invoke Java api
  return wifiState;
}

function connectESPDevice(devPros) {
  const {ssid, bssid, password, transmission} = devPros;
  //Invoke Java api
  return true;
}

export default {getWifiState, connectESPDevice};
