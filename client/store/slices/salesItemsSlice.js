import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/axiosClient';
import AsyncStorage from "@react-native-async-storage/async-storage";

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
};

const salesItemsSlice = createSlice({
  name: 'salesItems',
  initialState,
  reducers: {
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

export const { setItems, setCurrentItem, clearItems, resetError } = salesItemsSlice.actions;
export default salesItemsSlice.reducer;
