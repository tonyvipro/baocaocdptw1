import { configureStore } from '@reduxjs/toolkit';
import contractExtensionReducer from './slices/contractExtensionSlice';
import contractDocumentReducer from './slices/contractDocumentSlice';
import customerContractReducer from './slices/customerContractSlice';
import invoiceReducer from './slices/invoiceSlice';
import rentPaymentsReducer from './slices/rentPaymentsSlice';

export const store = configureStore({
  reducer: {
    contractExtension: contractExtensionReducer,
    contractDocument: contractDocumentReducer,
    customerContract: customerContractReducer,
    invoice: invoiceReducer,
    rentPayments: rentPaymentsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store;
