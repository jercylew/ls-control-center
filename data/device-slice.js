import { createSlice } from '@reduxjs/toolkit';

const UNKNOWN_SCENE_NAME = '未知场地';
const UNKNOWN_SCENE_ID = '00000-0000000000';

const getDevSceneName = (deviceId, devSceneMap) => {
  let sceneName = '';
  for (let item of devSceneMap) {
    if (item.deviceId === deviceId) {
      sceneName = item.sceneName;
    }
  }

  return sceneName;
};

const setDevSceneName = (devIdScene, devSceneMap) => {
  let found = false;
  for (let item of devSceneMap) {
    if (devIdScene.deviceId === item.deviceId) {
      item.sceneName = devIdScene.sceneName;
      found = true;
    }
  }

  if (!found) {
    devSceneMap.push(devIdScene);
  }
};

const updateDeviceInScene = (devData, scenes, sceneIndex, devIndex) => {
  if (devData) {
    if (devData.name) {
      scenes[sceneIndex].data[devIndex].name = devData.name;
    }
    if (devData.sceneId) {
      scenes[sceneIndex].data[devIndex].sceneId = devData.sceneId;
    }
    if (devData.netType) {
      scenes[sceneIndex].data[devIndex].netType = devData.netType;
    }
    scenes[sceneIndex].data[devIndex].onlineStatus = devData.onlineStatus;

    if (devData.devType === DEV_TYPE_SALE_TABLE) {
      if (devData.isHeating) {
        scenes[sceneIndex].data[devIndex].isHeating = devData.isHeating;
      }
      if (devData.isUpWater) {
        scenes[sceneIndex].data[devIndex].isUpWater = devData.isUpWater;
      }
      if (devData.detectionTemperature) {
        scenes[sceneIndex].data[devIndex].detectionTemperature =
          devData.detectionTemperature;
      }
      if (devData.waterLevelDetection) {
        scenes[sceneIndex].data[devIndex].waterLevelDetection =
          devData.waterLevelDetection;
      }
      if (devData.errorWaterLevel) {
        scenes[sceneIndex].data[devIndex].errorWaterLevel =
          devData.errorWaterLevel;
      }
      if (devData.errorTemperature) {
        scenes[sceneIndex].data[devIndex].errorTemperature =
          devData.errorTemperature;
      }
      if (devData.maxWaterLevel) {
        scenes[sceneIndex].data[devIndex].maxWaterLevel = devData.maxWaterLevel;
      }
      if (devData.maxTemperature) {
        scenes[sceneIndex].data[devIndex].maxTemperature =
          devData.maxTemperature;
      }
      if (devData.firmwareVersion) {
        scenes[sceneIndex].data[devIndex].firmwareVersion =
          devData.firmwareVersion;
      }
      if (devData.lowestWaterLevel) {
        scenes[sceneIndex].data[devIndex].lowestWaterLevel =
          devData.lowestWaterLevel;
      }
      if (devData.waterStartOut) {
        scenes[sceneIndex].data[devIndex].waterStartOut = devData.waterStartOut;
      }
      if (devData.waterStopOut) {
        scenes[sceneIndex].data[devIndex].waterStopOut = devData.waterStopOut;
      }
      if (devData.tempRetDiff) {
        scenes[sceneIndex].data[devIndex].tempRetDiff = devData.tempRetDiff;
      }
      if (devData.waterRetDiff) {
        scenes[sceneIndex].data[devIndex].waterRetDiff = devData.waterRetDiff;
      }
      if (devData.tempOutDelay) {
        scenes[sceneIndex].data[devIndex].tempOutDelay = devData.tempOutDelay;
      }
      if (devData.waterSensorType) {
        scenes[sceneIndex].data[devIndex].waterSensorType =
          devData.waterSensorType;
      }
      if (devData.highTempAlarm) {
        scenes[sceneIndex].data[devIndex].highTempAlarm = devData.highTempAlarm;
      }
      if (devData.lowTempAlarm) {
        scenes[sceneIndex].data[devIndex].lowTempAlarm = devData.lowTempAlarm;
      }
      if (devData.lowWaterLevelAlarm) {
        scenes[sceneIndex].data[devIndex].lowWaterLevelAlarm =
          devData.lowWaterLevelAlarm;
      }
      if (devData.alarmDelay) {
        scenes[sceneIndex].data[devIndex].alarmDelay = devData.alarmDelay;
      }
    }

    if (devData.devType === DEV_TYPE_REFRIGERATOR) {
      if (devData.cabinetTemp) {
        scenes[sceneIndex].data[devIndex].cabinetTemp = devData.cabinetTemp;
      }
      if (devData.evaporatorTempe) {
        scenes[sceneIndex].data[devIndex].evaporatorTempe =
          devData.evaporatorTempe;
      }
      if (devData.condenserTempe) {
        scenes[sceneIndex].data[devIndex].condenserTempe =
          devData.condenserTempe;
      }
      if (devData.ntcTempe) {
        scenes[sceneIndex].data[devIndex].ntcTempe = devData.ntcTempe;
      }
      if (devData.sht30OneTempe) {
        scenes[sceneIndex].data[devIndex].sht30OneTempe = devData.sht30OneTempe;
      }
      if (devData.sht30OneHumi) {
        scenes[sceneIndex].data[devIndex].sht30OneHumi = devData.sht30OneHumi;
      }
      if (devData.sht30TwoTempe) {
        scenes[sceneIndex].data[devIndex].sht30TwoTempe = devData.sht30TwoTempe;
      }
      if (devData.sht30TwoHumi) {
        scenes[sceneIndex].data[devIndex].sht30TwoHumi = devData.sht30TwoHumi;
      }
      if (devData.doorDetection1) {
        scenes[sceneIndex].data[devIndex].doorDetection1 =
          devData.doorDetection1;
      }
      if (devData.doorDetection2) {
        scenes[sceneIndex].data[devIndex].doorDetection2 =
          devData.doorDetection2;
      }
      if (devData.doorStatusOut) {
        scenes[sceneIndex].data[devIndex].doorStatusOut = devData.doorStatusOut;
      }
      if (devData.relay1Status) {
        scenes[sceneIndex].data[devIndex].relay1Status = devData.relay1Status;
      }
      if (devData.relay2Status) {
        scenes[sceneIndex].data[devIndex].relay2Status = devData.relay2Status;
      }
    }
  }
};

export const DEV_TYPE_REFRIGERATOR = 'refrgtor';
export const DEV_TYPE_SALE_TABLE = 'sale_table';

export const slice = createSlice({
  name: 'scene',
  initialState: {
    scenes: [], //see DATA at devices.js
    mapDeviceScene: [], //Map cannot be serilized in Redux
  },
  reducers: {
    syncDevice: (state, action) => {
      let device = action.payload;

      if (device.id === null || device.id === '') {
        console.log('Error, device id is missing');
        return;
      }

      //Found if exist in a scene group, ie., updated from `device property` report
      //NOTE: status report does not contain scene info (null scene name and scene id)
      let oldSceneName = getDevSceneName(device.id, state.mapDeviceScene);

      if (
        oldSceneName !== '' &&
        oldSceneName !== UNKNOWN_SCENE_NAME &&
        !device.sceneName
      ) {
        device.sceneName = oldSceneName;
      } else {
        if (
          oldSceneName === '' || //Scene not exist
          !device.sceneName ||
          device.sceneName === '' || //From status report
          device.sceneName === 'NA' //From property, but not set
        ) {
          //Not found, just put into the unknown scene group
          device.sceneName = UNKNOWN_SCENE_NAME;
          device.sceneId = UNKNOWN_SCENE_ID;
        } else {
          console.log('Old scene found:', oldSceneName);
        }
      }

      let oldDevItem = null;
      if (device.sceneName !== oldSceneName) {
        console.log(
          'Device scene changed, old:',
          oldSceneName,
          ', new:',
          device.sceneName,
        );

        //move this device from the unknown group
        let foundSceneIndex = -1;
        for (let i = 0; i < state.scenes.length; i++) {
          if (state.scenes[i].title === oldSceneName) {
            foundSceneIndex = i;

            let foundIndex = -1;
            for (let j = 0; j < state.scenes[i].data.length; j++) {
              if (state.scenes[i].data[j].id === device.id) {
                foundIndex = j;
                oldDevItem = state.scenes[i].data[j];
              }
            }
            if (foundIndex >= 0) {
              state.scenes[i].data.splice(foundIndex, 1);
            }
          }
        }
      }

      //if not exist creat a new scene and push this device
      //else update the device info in the existing group
      let scene_found = false;
      for (let i = 0; i < state.scenes.length; i++) {
        if (state.scenes[i].title === device.sceneName) {
          //Status report may earlier then property report
          scene_found = true;
          let device_found = false;
          for (let j = 0; j < state.scenes[i].data.length; j++) {
            if (state.scenes[i].data[j].id === device.id) {
              //update from old data
              updateDeviceInScene(oldDevItem, state.scenes, i, j);
              updateDeviceInScene(device, state.scenes, i, j);
              device_found = true;
            }
          }

          if (!device_found) {
            state.scenes[i].data.push(device);
          }
        }
      }

      let newSceneName = device.sceneName;
      if (!scene_found) {
        console.log(
          'Scene `' + device.sceneName + '` not found, create a new one',
        );
        if (
          device.sceneName === null ||
          device.sceneName === '' ||
          device.sceneName === 'NA'
        ) {
          newSceneName = UNKNOWN_SCENE_NAME;
        }

        let newScene = {
          title: newSceneName,
          data: [],
        };
        newScene.data.push(device);
        state.scenes.push(newScene);
      }

      setDevSceneName(
        { deviceId: device.id, sceneName: newSceneName },
        state.mapDeviceScene,
      );
    },
  },
});

export const { syncDevice, syncDeviceReportTimer } = slice.actions;

export const selectScenes = state => state.scene.scenes;
export default slice.reducer;
