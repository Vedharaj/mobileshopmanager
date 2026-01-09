import { registerRootComponent } from 'expo';
import { LogBox } from 'react-native';

import App from './App';

// Suppress specific warnings (if needed)
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
  'ViewPropTypes will be removed',
  'AsyncStorage has been extracted',
]);

// Global error handler for unhandled promise rejections
const originalUnhandledRejectionHandler = () => {
  // Will be set in app root
};

if (!global.ErrorUtils) {
  console.warn('⚠️ ErrorUtils not available');
} else {
  // Wrap the global error handler
  const setErrorHandler = (errorHandler) => {
    const originalHandler = global.ErrorUtils.getGlobalHandler();
    global.ErrorUtils.setGlobalHandler((error, isFatal) => {
      try {
        console.error('🔴 Global Error:', error);
        console.error('Fatal:', isFatal);
      } catch (logErr) {
        console.error('Failed to log error:', logErr);
      }
      
      try {
        if (originalHandler) {
          originalHandler(error, isFatal);
        }
      } catch (handlerErr) {
        console.error('Error in original handler:', handlerErr);
      }
    });
  };

  try {
    setErrorHandler(originalUnhandledRejectionHandler);
  } catch (err) {
    console.warn('⚠️ Failed to setup global error handler:', err);
  }
}

// Handle unhandled promise rejections
const promiseRejectionHandler = (reason, promise) => {
  try {
    console.error('🔴 Unhandled Promise Rejection:', reason);
    console.error('Promise:', promise);
  } catch (err) {
    console.error('Failed to log promise rejection:', err);
  }
};

if (global.addEventListener) {
  try {
    global.addEventListener('unhandledrejection', promiseRejectionHandler);
  } catch (err) {
    console.warn('⚠️ Failed to setup unhandled rejection handler:', err);
  }
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
