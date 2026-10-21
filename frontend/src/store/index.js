import { configureStore } from '@reduxjs/toolkit';
import contractExtensionReducer from './slices/contractExtensionSlice';
import contractDocumentReducer from './slices/contractDocumentSlice';
import customerContractReducer from './slices/customerContractSlice';

export const store = configureStore({
  reducer: {
    contractExtension: contractExtensionReducer,
    contractDocument: contractDocumentReducer,
    customerContract: customerContractReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store;
