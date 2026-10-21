import { configureStore } from '@reduxjs/toolkit';
import contractExtensionReducer from './slices/contractExtensionSlice';

export const store = configureStore({
  reducer: {
    contractExtension: contractExtensionReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store;
