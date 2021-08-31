import {createSlice} from '@reduxjs/toolkit';

export const slice = createSlice({
  name: 'scene',
  initialState: {
    // value: 0,
    scenes: [], //see DATA at devices.js
    mapDeviceScene: new Map(),
  },
  reducers: {
    syncDevice: (state, action) => {
      //From status report from device
      let device = action.payload;

      if (device.id === null || device.id === '') {
        console.log('Error, device id is missing');
        return;
      }

      let scene_found = false;
      for (let i = 0; i < state.scenes.length; i++) {
        if (state.scenes[i].title === device.scene_name) {
          scene_found = true;
          let device_found = false;
          for (let j = 0; j < state.scenes[i].data.length; j++) {
            if (state.scenes[i].data[j].id === device.id) {
              if (device.name !== null) {
                state.scenes[i].data[j].name = device.name;
              }
              if (device.scene_id !== null) {
                state.scenes[i].data[j].scene_id = device.scene_id;
              }
              if (device.is_heating !== null) {
                state.scenes[i].data[j].is_heating = device.is_heating;
              }
              if (device.is_up_water !== null) {
                state.scenes[i].data[j].is_up_water = device.is_up_water;
              }
              if (device.net_type !== null) {
                state.scenes[i].data[j].net_type = device.net_type;
              }
              if (device.detection_temperature !== null) {
                state.scenes[i].data[j].detection_temperature =
                  device.detection_temperature;
              }
              if (device.water_level_detection !== null) {
                state.scenes[i].data[j].water_level_detection =
                  device.water_level_detection;
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

      if (!scene_found) {
        let new_scene = {
          title: device.scene_name,
          data: [],
        };
        new_scene.data.push(device);
        state.scenes.push(new_scene);
      }
      state.mapDeviceScene.set(device.id, device.scene_name);
    },

    saveDeviceInfo: (state, action) => {
      //From user update via APP
      let device = action.payload;

      if (
        !state.mapDeviceScene.has(device.id) &&
        state.mapDeviceScene.get(device.id) !== device.scene_name
      ) {
        //Remove from old scene
        let old_scene_name = state.mapDeviceScene.get(device.id);
        for (let i = 0; i < state.scenes.length; i++) {
          if (old_scene_name === state.scenes[i].title) {
            state.scenes[i].data = state.scenes[i].data.filter(
              item => item.id !== device.id,
            );
          }
        }
      }

      //Add to new scene
      let scene_found = false;
      for (let i = 0; i < state.scenes.length; i++) {
        if (device.scene_name === state.scenes[i].title) {
          let device_found = false;
          for (let j = 0; j < state.scenes[i].data.length; j++) {
            if (state.scenes[i].data[j].id === device.id) {
              state.scenes[i].data[j].name = device.name;
              state.scenes[i].data[j].scene_id = device.scene_id;
              state.scenes[i].data[j].is_heating = device.is_heating;
              state.scenes[i].data[j].is_up_water = device.is_up_water;
              state.scenes[i].data[j].net_type = device.net_type;
              state.scenes[i].data[j].detection_temperature =
                device.detection_temperature;
              state.scenes[i].data[j].water_level_detection =
                device.water_level_detection;
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
        let new_scene = {
          title: device.scene_name,
          data: [],
        };
        new_scene.data.push(device);
        state.scenes.push(new_scene);
      }
      state.scene.mapDeviceScene.set(device.id, device.scene_name);
    },
  },
});

export const {syncDevice, saveDeviceInfo} = slice.actions;

// export const incrementAsync = amount => dispatch => {
//   setTimeout(() => {
//     dispatch(incrementByAmount(amount));
//   }, 1000);
// };

// export const selectCount = state => state.counter.value;
export const selectScenes = state => state.scene.scenes;

export default slice.reducer;
