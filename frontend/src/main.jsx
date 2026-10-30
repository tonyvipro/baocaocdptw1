import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './store/index.js';
import App from './App.jsx';
import AppErrorBoundary from './components/AppErrorBoundary.jsx';
import StaleEditNotice from './components/StaleEditNotice.jsx';
import ConfirmProvider from './components/forms/ConfirmProvider.jsx';
import { installInputPolicy } from './utils/inputPolicy.js';
import { installApiSessionGuard } from './utils/apiSessionGuard.js';
import { installNumericInputGuard } from './utils/numericInputGuard.js';
import './index.css';
import './styles/giang-forms.css';

const removeNumericInputGuard = installNumericInputGuard(document);
const removeInputPolicy = installInputPolicy(document);
const removeApiSessionGuard = installApiSessionGuard();
if (import.meta.hot) import.meta.hot.dispose(() => { removeInputPolicy(); removeApiSessionGuard(); });
if (import.meta.hot) import.meta.hot.dispose(removeNumericInputGuard);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <AppErrorBoundary>
        <ConfirmProvider>
        <App />
        <StaleEditNotice />
        </ConfirmProvider>
      </AppErrorBoundary>
    </Provider>
  </React.StrictMode>,
);
