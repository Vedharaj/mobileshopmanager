import { store } from "../store/store";
import { fetchShops } from "../store/slices/shopsSlice";

/**
 * Wait for shops data to be fetched
 * Useful to call before navigation or operations that need shops data
 * 
 * @param {number} timeout - Maximum time to wait in milliseconds (default: 30000)
 * @returns {Promise<Array>} - Resolves with shops array when available
 * 
 * Usage:
 * await waitForShopsData();
 * // Now shops data is loaded
 */
export const waitForShopsData = async (timeout = 30000) => {
  const startTime = Date.now();

  const checkShops = () => {
    const state = store.getState();
    const shops = state.shops?.shops || [];
    const status = state.shops?.status;

    // If shops are loaded or loading, return them
    if (shops.length > 0) {
      return Promise.resolve(shops);
    }

    // If still loading, wait and check again
    if (status === "loading") {
      if (Date.now() - startTime > timeout) {
        return Promise.reject(
          new Error(
            `Timeout waiting for shops data (${timeout}ms exceeded)`
          )
        );
      }
      return new Promise((resolve) => {
        setTimeout(() => resolve(checkShops()), 100);
      });
    }

    // If not loading and no shops, try to fetch
    if (status !== "loading") {
      return store.dispatch(fetchShops()).then(() => {
        const state = store.getState();
        return state.shops?.shops || [];
      });
    }
  };

  return checkShops();
};

/**
 * Wait for shops to be in a ready state (loaded or not loading)
 * This is useful when you just need the data to be available, not necessarily loaded
 * 
 * @param {number} timeout - Maximum time to wait in milliseconds (default: 30000)
 * @returns {Promise<Array>} - Resolves with shops array
 */
export const waitForShopsReady = async (timeout = 30000) => {
  const startTime = Date.now();

  const checkReady = () => {
    const state = store.getState();
    const shops = state.shops?.shops || [];
    const status = state.shops?.status;

    // If not loading anymore, return what we have
    if (status !== "loading") {
      return Promise.resolve(shops);
    }

    if (Date.now() - startTime > timeout) {
      return Promise.reject(
        new Error(`Timeout waiting for shops ready (${timeout}ms exceeded)`)
      );
    }

    return new Promise((resolve) => {
      setTimeout(() => resolve(checkReady()), 100);
    });
  };

  return checkReady();
};
