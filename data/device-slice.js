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
    const keys = Object.keys(devData);
    console.log('updateDeviceInScene: incoming', devData);
    for (let key of keys) {
      if (devData[key] === undefined || devData[key] === null) {
        continue;
      }
      scenes[sceneIndex].data[devIndex][key] = devData[key];
    }
  }
};

export const DEV_TYPE_REFRIGERATOR = 'refrgtor';
export const DEV_TYPE_DC_REFRIGERATOR = 'dc_refrgtor';
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
          id: device.sceneId,
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
