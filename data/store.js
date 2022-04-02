import { configureStore } from '@reduxjs/toolkit';
import sceneReducer from './device-slice';

import { enableMapSet } from 'immer';
enableMapSet();

export default configureStore({
  reducer: {
    scene: sceneReducer,
  },
});
