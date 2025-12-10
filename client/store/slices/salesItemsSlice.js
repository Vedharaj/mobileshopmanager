import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import api from '../api/axiosClient';
import AsyncStorage from "@react-native-async-storage/async-storage";

// Local cart helpers
let cartIdCounter = 1;
const nextCartId = () => `cart-${Date.now()}-${cartIdCounter++}`;

const createEmptyCartItem = () => ({
  id: nextCartId(),
  product_id: '',
  product_name: '',
  quantity: '1',
  unit_price: '',
  subtotal: 0,
});

const createCartItem = ({ product_id, product_name, unit_price }) => ({
  id: nextCartId(),
  product_id,
  product_name: product_name || 'Item',
  quantity: '1',
  unit_price: String(unit_price || 0),
  subtotal: computeSubtotal('1', unit_price),
});

const computeSubtotal = (qty, price) => {
  const q = parseFloat(qty) || 0;
  const p = parseFloat(price) || 0;
  return q * p;
};

// Fetch all items for a specific sale
export const fetchSalesItems = createAsyncThunk(
  'salesItems/fetch',
  async (salesId, thunkAPI) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await api.get(`/sales-items/${salesId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data.items;
    } catch (error) {
      const msg = error.response?.data?.msg || error.message || 'Failed to fetch sales items';
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

// Fetch a single sales item by ID
export const fetchSalesItemById = createAsyncThunk(
  'salesItems/fetchById',
  async (itemId, thunkAPI) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await api.get(`/sales-items/item/${itemId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data.item;
    } catch (error) {
      const msg = error.response?.data?.msg || error.message || 'Failed to fetch sales item';
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

// Create a new sales item
export const createSalesItem = createAsyncThunk(
  'salesItems/create',
  async (payload, thunkAPI) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await api.post('/sales-items', payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data.items;
    } catch (error) {
      const msg = error.response?.data?.msg || error.message || 'Failed to create sales item';
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

// Create multiple sales items at once
export const createSalesItemsBulk = createAsyncThunk(
  'salesItems/createBulk',
  async ({ salesId, items }, thunkAPI) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await api.post(`/sales-items/bulk/${salesId}`, { items }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data.items;
    } catch (error) {
      const msg = error.response?.data?.msg || error.message || 'Failed to create sales items';
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

// Update a sales item
export const updateSalesItem = createAsyncThunk(
  'salesItems/update',
  async ({ itemId, itemData }, thunkAPI) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await api.put(`/sales-items/${itemId}`, itemData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data.items;
    } catch (error) {
      const msg = error.response?.data?.msg || error.message || 'Failed to update sales item';
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

// Delete a sales item
export const deleteSalesItem = createAsyncThunk(
  'salesItems/delete',
  async (itemId, thunkAPI) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await api.delete(`/sales-items/${itemId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data.items;
    } catch (error) {
      const msg = error.response?.data?.msg || error.message || 'Failed to delete sales item';
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

// Delete all items for a sale
export const deleteSalesItemsBulk = createAsyncThunk(
  'salesItems/deleteBulk',
  async (salesId, thunkAPI) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await api.delete(`/sales-items/bulk/${salesId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data.items;
    } catch (error) {
      const msg = error.response?.data?.msg || error.message || 'Failed to delete sales items';
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

const initialState = {
  items: [],
  currentItem: null,
  status: 'idle',
  error: null,
  // Local cart state (for POS/Sales form)
  cartItems: [createEmptyCartItem()],
  lastScanId: null,
  duplicateScan: false,
};

const salesItemsSlice = createSlice({
  name: 'salesItems',
  initialState,
  reducers: {
    // --- Local cart reducers ---
    setCartItems(state, action) {
      state.cartItems = action.payload || [createEmptyCartItem()];
    },
    addOrUpdateFromScan(state, action) {
      const { product_id, product_name, unit_price, scanId } = action.payload || {};
      if (!product_id) return;

      const price = unit_price ?? '';
      const existingIdx = state.cartItems.findIndex((item) => item.product_id === product_id);

      if (existingIdx > -1) {
        // Item already in cart - set duplicate flag (will be cleared by scanner after alert)
        state.lastScanId = scanId || null;
        state.duplicateScan = true;
      } else {
        const emptyIdx = state.cartItems.findIndex((item) => item.product_id === '');
        const newItem = createCartItem({ product_id, product_name, unit_price: price });

        if (emptyIdx > -1) {
          state.cartItems[emptyIdx] = newItem;
          state.cartItems.push(createEmptyCartItem());
        } else {
          state.cartItems.push(newItem);
        }
        
        state.lastScanId = scanId || null;
        state.duplicateScan = false;
      }
    },
    updateCartItem(state, action) {
      const { id, changes } = action.payload || {};
      state.cartItems = state.cartItems.map((item) => {
        if (item.id !== id) return item;
        const merged = { ...item, ...changes };
        merged.subtotal = computeSubtotal(merged.quantity, merged.unit_price);
        return merged;
      });
    },
    addCartRow(state) {
      state.cartItems.push(createEmptyCartItem());
    },
    removeCartItem(state, action) {
      const id = action.payload;
      const remaining = state.cartItems.filter((item) => item.id !== id);
      state.cartItems = remaining.length > 0 ? remaining : [createEmptyCartItem()];
    },
    clearCart(state) {
      state.cartItems = [createEmptyCartItem()];
      state.lastScanId = null;
      state.duplicateScan = false;
    },
    setLastScanId(state, action) {
      state.lastScanId = action.payload || null;
    },
    clearDuplicateFlag(state) {
      state.duplicateScan = false;
    },

    // --- Remote CRUD reducers (existing) ---
    setItems(state, action) {
      state.items = action.payload || [];
    },
    setCurrentItem(state, action) {
      state.currentItem = action.payload;
    },
    clearItems(state) {
      state.items = [];
      state.currentItem = null;
      state.status = 'idle';
      state.error = null;
    },
    resetError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSalesItems.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchSalesItems.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
        state.error = null;
      })
      .addCase(fetchSalesItems.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })

      .addCase(fetchSalesItemById.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchSalesItemById.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.currentItem = action.payload;
        state.error = null;
      })
      .addCase(fetchSalesItemById.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })

      .addCase(createSalesItem.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(createSalesItem.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
        state.error = null;
      })
      .addCase(createSalesItem.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })

      .addCase(createSalesItemsBulk.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(createSalesItemsBulk.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
        state.error = null;
      })
      .addCase(createSalesItemsBulk.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })

      .addCase(updateSalesItem.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(updateSalesItem.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
        state.error = null;
      })
      .addCase(updateSalesItem.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })

      .addCase(deleteSalesItem.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(deleteSalesItem.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
        state.error = null;
      })
      .addCase(deleteSalesItem.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })

      .addCase(deleteSalesItemsBulk.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(deleteSalesItemsBulk.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
        state.error = null;
      })
      .addCase(deleteSalesItemsBulk.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  }
});

export const {
  setCartItems,
  addOrUpdateFromScan,
  updateCartItem,
  addCartRow,
  removeCartItem,
  clearCart,
  setLastScanId,
  clearDuplicateFlag,
  setItems,
  setCurrentItem,
  clearItems,
  resetError,
} = salesItemsSlice.actions;
export default salesItemsSlice.reducer;

// Selectors
export const selectCartItems = (state) => state.salesItems.cartItems;
export const selectLastScanId = (state) => state.salesItems.lastScanId;
export const selectDuplicateScan = (state) => state.salesItems.duplicateScan;

export const selectCartTotals = createSelector([selectCartItems], (cartItems) => {
  const total = cartItems.reduce((sum, item) => sum + (parseFloat(item.subtotal) || 0), 0);
  const hasProducts = cartItems.some((item) => item.product_id);
  return {
    total,
    hasProducts,
  };
});
