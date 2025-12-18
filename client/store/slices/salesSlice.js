import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/axiosClient';
import AsyncStorage from "@react-native-async-storage/async-storage";

// Fetch all sales
export const fetchSales = createAsyncThunk(
  'sales/fetch',
  async (params = {}, thunkAPI) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await api.get('/sales', {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      return res.data.sales;
    } catch (error) {
      const msg = error.response?.data?.msg || error.message || 'Failed to fetch sales';
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

// Fetch a single sale by ID
export const fetchSaleById = createAsyncThunk(
  'sales/fetchById',
  async (saleId, thunkAPI) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await api.get(`/sales/${saleId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data.sale;
    } catch (error) {
      const msg = error.response?.data?.msg || error.message || 'Failed to fetch sale';
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

// Create sale
export const createSale = createAsyncThunk(
  'sales/create',
  async (payload, thunkAPI) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await api.post('/sales', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Return the newly created sale (backend should return res.data.sale or first item from res.data.sales)
      return res.data.sale || res.data.sales?.[0] || res.data.sales;
    } catch (error) {
      const msg = error.response?.data?.msg || error.message || 'Failed to create sale';
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

// Update sale
export const updateSale = createAsyncThunk(
  'sales/update',
  async ({ saleId, saleData }, thunkAPI) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await api.put(`/sales/${saleId}`, saleData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data.sale || res.data.sales?.[0];
    } catch (error) {
      const msg = error.response?.data?.msg || error.message || 'Failed to update sale';
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

// Delete sale
export const deleteSale = createAsyncThunk(
  'sales/delete',
  async (saleId, thunkAPI) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await api.delete(`/sales/${saleId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data.id || saleId;
    } catch (error) {
      const msg = error.response?.data?.msg || error.message || 'Failed to delete sale';
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

const initialState = {
  sales: [],
  currentSale: null,
  status: 'idle',
  error: null,
};

const salesSlice = createSlice({
  name: 'sales',
  initialState,
  reducers: {
    setSales(state, action) {
      state.sales = action.payload || [];
    },
    setCurrentSale(state, action) {
      state.currentSale = action.payload;
    },
    clearSales(state) {
      state.sales = [];
      state.currentSale = null;
      state.status = 'idle';
      state.error = null;
    },
    resetError(state) {
      state.error = null;
    }
  },

  extraReducers: (builder) => {
    builder
      // Fetch all sales
      .addCase(fetchSales.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchSales.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.sales = Array.isArray(action.payload) ? action.payload : [];
        state.error = null;
      })
      .addCase(fetchSales.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })

      // Single sale fetch
      .addCase(fetchSaleById.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchSaleById.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.currentSale = action.payload;
        state.error = null;
      })
      .addCase(fetchSaleById.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })

      // Create sale - add new sale to list
      .addCase(createSale.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(createSale.fulfilled, (state, action) => {
        state.status = 'succeeded';
        // If payload is array, add all items; if single, add it
        if (Array.isArray(action.payload)) {
          state.sales = action.payload;
        } else if (action.payload) {
          state.sales.push(action.payload);
        }
        state.error = null;
      })
      .addCase(createSale.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })

      // Update sale - replace only updated item
      .addCase(updateSale.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(updateSale.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const updated = action.payload;
        if (Array.isArray(updated)) {
          state.sales = updated;
        } else if (updated) {
          const index = state.sales.findIndex(s => s._id === updated._id);
          if (index !== -1) {
            state.sales[index] = updated;
          }
        }
        state.error = null;
      })
      .addCase(updateSale.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })

      // Delete sale - remove from list
      .addCase(deleteSale.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(deleteSale.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const deletedId = action.payload;
        state.sales = state.sales.filter(s => s._id !== deletedId);
        state.error = null;
      })
      .addCase(deleteSale.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  }
});

export const { setSales, setCurrentSale, clearSales, resetError } = salesSlice.actions;
export default salesSlice.reducer;

