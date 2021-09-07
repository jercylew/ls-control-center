import {createSlice} from '@reduxjs/toolkit';

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
  devSceneMap = devSceneMap.filter(
    item => item.deviceId !== devIdScene.deviceId,
  );
  devSceneMap.push(devIdScene);
};

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
      if (oldSceneName === '') {
        //Not found
        device.sceneName = UNKNOWN_SCENE_NAME;
        device.sceneId = UNKNOWN_SCENE_ID;
      } else {
        device.sceneName = oldSceneName;
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
              if (device.name !== null) {
                state.scenes[i].data[j].name = device.name;
              }
              if (device.sceneId !== null) {
                state.scenes[i].data[j].sceneId = device.sceneId;
              }
              if (device.isHeating !== null) {
                state.scenes[i].data[j].isHeating = device.isHeating;
              }
              if (device.isUpWater !== null) {
                state.scenes[i].data[j].isUpWater = device.isUpWater;
              }
              if (device.netType !== null) {
                state.scenes[i].data[j].netType = device.netType;
              }
              if (device.detectionTemperature !== null) {
                state.scenes[i].data[j].detectionTemperature =
                  device.detectionTemperature;
              }
              if (device.waterLevelDetection !== null) {
                state.scenes[i].data[j].waterLevelDetection =
                  device.waterLevelDetection;
              }
              if (device.error !== null) {
                state.scenes[i].data[j].error = device.error;
              }
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
        {deviceId: device.id, sceneName: newSceneName},
        state.mapDeviceScene,
      );
    },

    saveDeviceInfo: (state, action) => {
      //From user update via APP
      let device = action.payload;

      let oldSceneName = getDevSceneName(device.id, state.mapDeviceScene);
      if (oldSceneName !== device.sceneName) {
        //Remove from old scene
        for (let i = 0; i < state.scenes.length; i++) {
          if (oldSceneName === state.scenes[i].title) {
            state.scenes[i].data = state.scenes[i].data.filter(
              item => item.id !== device.id,
            );
          }
        }
      }

      //Add to new scene
      let scene_found = false;
      for (let i = 0; i < state.scenes.length; i++) {
        if (device.sceneName === state.scenes[i].title) {
          let device_found = false;
          for (let j = 0; j < state.scenes[i].data.length; j++) {
            if (state.scenes[i].data[j].id === device.id) {
              state.scenes[i].data[j].name = device.name;
              state.scenes[i].data[j].sceneId = device.sceneId;
              state.scenes[i].data[j].isHeating = device.isHeating;
              state.scenes[i].data[j].isUpWater = device.isUpWater;
              state.scenes[i].data[j].netType = device.netType;
              state.scenes[i].data[j].detectionTemperature =
                device.detectionTemperature;
              state.scenes[i].data[j].waterLevelDetection =
                device.waterLevelDetection;
              state.scenes[i].data[j].error = device.error;
              device_found = true;
            }
          }

          if (!device_found) {
            state.scenes[i].data.push(device);
          }
          scene_found = true;
        }
      }

      if (!scene_found) {
        let newSceneName = device.sceneName;
        if (
          device.sceneName === null ||
          device.sceneName === '' ||
          device.sceneName === 'NA'
        ) {
          newSceneName = UNKNOWN_SCENE_NAME;
        }

        let new_scene = {
          title: newSceneName,
          data: [],
        };
        new_scene.data.push(device);
        state.scenes.push(new_scene);
      }

      setDevSceneName(
        {deviceId: device.id, sceneName: device.sceneName},
        state.mapDeviceScene,
      );
    },
  },
});

export const {syncDevice, saveDeviceInfo} = slice.actions;

// export const incrementAsync = amount => dispatch => {
//   setTimeout(() => {
//     dispatch(incrementByAmount(amount));
//   }, 1000);
// };

export const selectScenes = state => state.scene.scenes;
export default slice.reducer;
