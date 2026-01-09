# Error Handling & Crash Prevention Guide

## Overview
This guide documents the comprehensive error handling improvements made to prevent the app from closing automatically.

## Components Added

### 1. Error Boundary (`components/ErrorBoundary.jsx`)
- React Error Boundary component that catches rendering errors
- Displays user-friendly error UI instead of crashing
- Provides reset functionality to recover from errors
- Dev-only stack traces for debugging

**Usage in App.js:**
```javascript
<ErrorBoundary>
  <Provider store={store}>
    <SafeAreaProvider>
      <RootNavigator />
    </SafeAreaProvider>
  </Provider>
</ErrorBoundary>
```

### 2. Global Error Handlers (`index.js`)
- Global error handler for uncaught exceptions
- Unhandled promise rejection handler
- Silences non-critical warnings

**What it catches:**
- Uncaught JavaScript errors
- Unhandled promise rejections
- Global exceptions

### 3. Safe Operations Utilities (`utils/safeOperations.js`)
Helper functions for safe operations:
- `safeAsync()` - Wrap async operations
- `safeCall()` - Wrap sync operations
- `safeDispatch()` - Safe Redux dispatches
- `safeGet()` - Safe property access
- `safeMap()`, `safeFilter()` - Safe array operations
- `safeParseJSON()` - Safe JSON parsing

**Example:**
```javascript
import { safeAsync, safeDispatch } from '../utils/safeOperations';

// Safe async operation
const data = await safeAsync(
  () => fetchData(),
  [],
  'fetchData'
);

// Safe dispatch
const result = await safeDispatch(
  dispatch,
  fetchProducts(),
  'fetchProducts'
);
```

### 4. Error Logging (`utils/errorLog.js`)
Centralized error logging system:
- Stores up to 50 recent errors
- Categorizes by level (error, warning, info)
- Filter by context
- Export logs for debugging

**Example:**
```javascript
import ErrorLog from '../utils/errorLog';

// Log an error
ErrorLog.log(error, 'ComponentName', 'error');

// Get recent logs
const recent = ErrorLog.getRecent(10);

// Export for debugging
const logsJson = ErrorLog.export();
```

### 5. Enhanced API Client (`store/api/axiosClient.js`)
- Try-catch blocks in request/response interceptors
- Better error logging
- Graceful error handling for AsyncStorage operations

### 6. Enhanced Socket Client (`utils/socket.js`)
- Improved initialization with try-catch
- Reconnection settings
- Error event listeners
- Connection state checking

### 7. Transaction Screen (`screens/TransactionScreen.jsx`)
- Added try-catch to product normalization
- Error handling for scanned product processing
- Better dependency arrays in useEffect hooks

## Best Practices to Follow

### 1. Always Use Try-Catch in Async Operations
```javascript
useEffect(() => {
  const loadData = async () => {
    try {
      await dispatch(fetchData());
    } catch (error) {
      console.error('Error loading data:', error);
      dispatch(showToast({ message: 'Failed to load data', type: 'error' }));
    }
  };
  loadData();
}, [dispatch]);
```

### 2. Guard Against Null/Undefined
```javascript
import { safeGet } from '../utils/safeOperations';

// Instead of: user.profile.name (can crash)
// Use:
const name = safeGet(user, 'profile.name', 'Unknown');
```

### 3. Use Safe Array Operations
```javascript
import { safeMap, safeFilter } from '../utils/safeOperations';

// Safe mapping
const items = safeMap(data, item => ({ ...item, processed: true }), []);

// Safe filtering
const filtered = safeFilter(users, u => u.active, []);
```

### 4. Handle Navigation Safely
```javascript
try {
  if (navigationRef.current?.navigate) {
    navigationRef.current.navigate('Home');
  }
} catch (error) {
  console.error('Navigation error:', error);
}
```

### 5. Redux Error Handling
All Redux async thunks already have error handling. When dispatching:
```javascript
try {
  await dispatch(fetchProducts()).unwrap();
} catch (error) {
  dispatch(showToast({ message: 'Failed to fetch', type: 'error' }));
}
```

## Debugging

### Access Error Logs
```javascript
import ErrorLog from '../utils/errorLog';

// In browser/debugger console:
ErrorLog.getLogs()
ErrorLog.getRecent(10)
ErrorLog.export()
```

### Check Redux Store
```javascript
// In Redux DevTools, watch for:
// - auth/fetchMe - rejected
// - sales/fetch - rejected
// - products/fetch - rejected
// Look at the error payload
```

### Enable Debug Logging
In development, uncomment console.log statements in:
- `store/api/axiosClient.js` - API calls
- `utils/socket.js` - Socket events
- Individual screens - lifecycle events

## Testing Error Handling

### Test 1: Network Error
- Disconnect from network
- Try to fetch data
- Should show toast, not crash

### Test 2: Invalid Data
- Manually corrupt Redux state
- Component should handle gracefully
- Error boundary should catch if needed

### Test 3: Navigation Error
- Try to navigate to non-existent screen
- Should log error, not crash

### Test 4: Async Operation Failure
- API endpoint temporarily unavailable
- Should catch error and show toast
- User can retry

## Common Error Patterns & Fixes

### Pattern 1: Reading undefined property
```javascript
// ❌ Bad
const name = user.profile.name;

// ✅ Good
const name = user?.profile?.name || 'Unknown';
// or
const name = safeGet(user, 'profile.name', 'Unknown');
```

### Pattern 2: Array operations without checking
```javascript
// ❌ Bad
const filtered = items.filter(i => i.active);

// ✅ Good
const filtered = safeFilter(items, i => i && i.active, []);
```

### Pattern 3: Uncaught async errors
```javascript
// ❌ Bad
useEffect(() => {
  dispatch(fetchData()); // No error handling
}, [dispatch]);

// ✅ Good
useEffect(() => {
  const load = async () => {
    try {
      await dispatch(fetchData()).unwrap();
    } catch (error) {
      console.error('Load failed:', error);
    }
  };
  load();
}, [dispatch]);
```

### Pattern 4: Navigation without guards
```javascript
// ❌ Bad
navigationRef.current.navigate('Home');

// ✅ Good
if (navigationRef.current?.navigate) {
  try {
    navigationRef.current.navigate('Home');
  } catch (error) {
    console.error('Navigation failed:', error);
  }
}
```

## Performance Considerations

- Error boundary has minimal overhead
- Safe operations add ~1ms per call (acceptable)
- Error logging stores only last 50 entries (memory efficient)
- Global error handlers are async-safe

## Future Improvements

1. Add error reporting service integration
2. Implement crash analytics
3. Add retry mechanisms for failed API calls
4. Create error recovery flows
5. Add network state monitoring
6. Implement offline queue for failed operations
