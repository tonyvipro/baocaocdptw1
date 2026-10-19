import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import AppErrorBoundary from './components/AppErrorBoundary.jsx';
import { installNumericInputGuard } from './utils/numericInputGuard.js';
import './index.css';

const removeNumericInputGuard = installNumericInputGuard(document);
if (import.meta.hot) import.meta.hot.dispose(removeNumericInputGuard);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </React.StrictMode>,
);
