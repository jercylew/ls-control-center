import {configureStore} from '@reduxjs/toolkit';
import sceneReducer from './device-slice';

export default configureStore({
  reducer: {
    scene: sceneReducer,
  },
});
