/**
 * Safe async operation wrapper
 * Wraps async operations with try-catch and error logging
 */
export const safeAsync = async (operation, fallback = null, context = '') => {
  try {
    const result = await operation();
    return result;
  } catch (error) {
    console.error(`❌ Safe async error${context ? ` (${context})` : ''}:`, error);
    return fallback;
  }
};

/**
 * Safe function wrapper
 * Wraps sync operations with try-catch
 */
export const safeCall = (operation, fallback = null, context = '') => {
  try {
    return operation();
  } catch (error) {
    console.error(`❌ Safe call error${context ? ` (${context})` : ''}:`, error);
    return fallback;
  }
};

/**
 * Safe dispatch wrapper
 * Safely dispatches Redux actions
 */
export const safeDispatch = async (dispatch, action, context = '') => {
  try {
    const result = await dispatch(action);
    return result;
  } catch (error) {
    console.error(`❌ Safe dispatch error${context ? ` (${context})` : ''}:`, error);
    return null;
  }
};

/**
 * Safe state update wrapper
 * Prevents update on unmounted component
 */
export const createSafeStateUpdater = (setterFn, isMountedRef) => {
  return (value) => {
    if (isMountedRef && isMountedRef.current) {
      try {
        setterFn(value);
      } catch (error) {
        console.error('❌ Safe state update error:', error);
      }
    }
  };
};

/**
 * Safe parse JSON
 */
export const safeParseJSON = (json, fallback = null) => {
  try {
    return JSON.parse(json);
  } catch (error) {
    console.error('❌ JSON parse error:', error);
    return fallback;
  }
};

/**
 * Safe property access
 */
export const safeGet = (obj, path, fallback = null) => {
  try {
    const keys = path.split('.');
    let current = obj;
    for (const key of keys) {
      if (current == null) return fallback;
      current = current[key];
    }
    return current != null ? current : fallback;
  } catch (error) {
    console.error('❌ Safe get error:', error);
    return fallback;
  }
};

/**
 * Safe array operations
 */
export const safeMap = (array, callback, fallback = []) => {
  try {
    if (!Array.isArray(array)) return fallback;
    return array.map(callback);
  } catch (error) {
    console.error('❌ Safe map error:', error);
    return fallback;
  }
};

export const safeFilter = (array, predicate, fallback = []) => {
  try {
    if (!Array.isArray(array)) return fallback;
    return array.filter(predicate);
  } catch (error) {
    console.error('❌ Safe filter error:', error);
    return fallback;
  }
};

export const safeFindIndex = (array, predicate, fallback = -1) => {
  try {
    if (!Array.isArray(array)) return fallback;
    return array.findIndex(predicate);
  } catch (error) {
    console.error('❌ Safe findIndex error:', error);
    return fallback;
  }
};

/**
 * Safe render wrapper
 */
export const safeRender = (renderFn, fallback = null) => {
  try {
    return renderFn();
  } catch (error) {
    console.error('❌ Safe render error:', error);
    return fallback;
  }
};
