/**
 * Error Handling Configuration
 * Customize error handling behavior here
 */

// Development mode - show detailed errors
export const IS_DEV = __DEV__ || true;

// Error logging configuration
export const ERROR_LOG_CONFIG = {
  // Maximum errors to keep in memory
  maxLogs: 50,
  
  // Auto-export logs to file (if enabled)
  autoExport: false,
  
  // Log level (0: all, 1: warn+error, 2: error only)
  level: 0,
  
  // Include stack traces
  includeStack: IS_DEV,
  
  // Timestamp format
  timestampFormat: 'iso', // 'iso' | 'local' | 'unix'
};

// Error Boundary configuration
export const ERROR_BOUNDARY_CONFIG = {
  // Show error details to user
  showDetails: IS_DEV,
  
  // Auto-recover after this many milliseconds (0 = never)
  autoRecoverDelay: 0,
  
  // Maximum errors before critical state
  criticalErrorThreshold: 5,
  
  // Show error boundary UI
  showUI: true,
};

// Global error handler configuration
export const GLOBAL_ERROR_CONFIG = {
  // Log uncaught exceptions
  logExceptions: true,
  
  // Log unhandled promise rejections
  logRejections: true,
  
  // Ignore specific error patterns (regex)
  ignorePatterns: [
    /Network error/i,
    /timeout/i,
  ],
  
  // Continue execution after error
  continueExecution: true,
};

// Safe operations configuration
export const SAFE_OPS_CONFIG = {
  // Log failed safe operations
  logFailures: IS_DEV,
  
  // Show warnings for fallback usage
  warnOnFallback: IS_DEV,
  
  // Track operation metrics
  trackMetrics: false,
};

// Toast configuration
export const TOAST_CONFIG = {
  // Default duration (ms)
  duration: 3000,
  
  // Max concurrent toasts
  maxToasts: 3,
  
  // Auto-hide on error
  autoHide: true,
  
  // Show error stack in dev
  showStack: IS_DEV,
};

// Redux configuration
export const REDUX_CONFIG = {
  // Log rejected actions
  logRejections: IS_DEV,
  
  // Log fulfilled actions
  logFulfilled: false,
  
  // Include action payloads
  includePayload: IS_DEV,
};

// API configuration
export const API_CONFIG = {
  // Log all requests
  logRequests: IS_DEV,
  
  // Log all responses
  logResponses: false,
  
  // Log request errors
  logErrors: true,
  
  // Request timeout (ms)
  timeout: 30000,
  
  // Retry failed requests
  retryAttempts: 3,
  
  // Retry delay (ms)
  retryDelay: 1000,
};

// Socket configuration
export const SOCKET_CONFIG = {
  // Log connection events
  logEvents: IS_DEV,
  
  // Auto-reconnect
  reconnect: true,
  
  // Reconnect attempts
  reconnectAttempts: 5,
  
  // Reconnect delay (ms)
  reconnectDelay: 1000,
  
  // Log socket errors
  logErrors: true,
};

// Performance monitoring
export const PERF_CONFIG = {
  // Enable performance tracking
  enabled: IS_DEV,
  
  // Log slow operations (ms threshold)
  slowOperationThreshold: 100,
  
  // Track memory usage
  trackMemory: false,
  
  // Log metrics interval (ms, 0 = disabled)
  metricsInterval: 0,
};

/**
 * Development only: Debug helpers
 */
if (IS_DEV && typeof window !== 'undefined') {
  // Expose error utilities to window for debugging
  window.__DEBUG__ = {
    get config() {
      return {
        errorLog: ERROR_LOG_CONFIG,
        errorBoundary: ERROR_BOUNDARY_CONFIG,
        globalError: GLOBAL_ERROR_CONFIG,
        safeOps: SAFE_OPS_CONFIG,
        toast: TOAST_CONFIG,
        redux: REDUX_CONFIG,
        api: API_CONFIG,
        socket: SOCKET_CONFIG,
        perf: PERF_CONFIG,
      };
    },
  };
}

export default {
  IS_DEV,
  ERROR_LOG_CONFIG,
  ERROR_BOUNDARY_CONFIG,
  GLOBAL_ERROR_CONFIG,
  SAFE_OPS_CONFIG,
  TOAST_CONFIG,
  REDUX_CONFIG,
  API_CONFIG,
  SOCKET_CONFIG,
  PERF_CONFIG,
};
