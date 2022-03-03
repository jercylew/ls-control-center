# ls-control-center

The mobile APP manage and control LS devices

## Supported devices
1. **Sale Table**
- View sale table status, water level, pumping status, temperature
- Set max temperature, max water level

2. **Refrigetor Controller**
- View controller status, temperature, door status, relay status
- Turn on / off relay

3. **Config network via ESP touch chip**
- Connect device to the specified network

4. **Settings (TODO)**
- Set the MQTT client info
- Account settings

## Run this APP
1. Run the metro server

`npx react-native start`

2.  Run in Android emulator

`npx react-native run-android`

3.  Create apk for realse

- Android
`cd android`

`./gradlew assembleRelease`

The signed apk for release is at `app/build/outputs/apk/release/app-release.apk`


- iOS
To be done
