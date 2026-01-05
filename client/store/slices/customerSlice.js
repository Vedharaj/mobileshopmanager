import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/axiosClient';
import AsyncStorage from "@react-native-async-storage/async-storage";

// Fetch authenticated user's customers (optionally by shop)
export const fetchCustomers = createAsyncThunk(
  'customers/fetch',
  async (shopId = null, thunkAPI) => {
    try {
      const token = await AsyncStorage.getItem('token');
      let url = '/customers';
      if (shopId) url += `?shop_id=${shopId}`;
      const res = await api.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data.customers;
    } catch (error) {
      const msg = error.response?.data?.msg || error.message || 'Failed to fetch customers';
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

// Create a new customer
export const createCustomer = createAsyncThunk(
  'customers/create',
  async (payload, thunkAPI) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await api.post('/customers', payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data.customers;
    } catch (error) {
      const msg = error.response?.data?.msg || error.message || 'Failed to create customer';
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

// Delete a customer
export const deleteCustomer = createAsyncThunk(
  'customers/delete',
  async (customerId, thunkAPI) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await api.delete(`/customers/${customerId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data.customers;
    } catch (error) {
      const msg = error.response?.data?.msg || error.message || 'Failed to delete customer';
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

// Update an existing customer
export const updateCustomer = createAsyncThunk(
  'customers/update',
  async ({ customerId, customerData }, thunkAPI) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await api.put(`/customers/${customerId}`, customerData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data.customers;
    } catch (error) {
      const msg = error.response?.data?.msg || error.message || 'Failed to update customer';
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

const initialState = {
  customers: [],
  status: 'idle',
  error: null,
};

const customerSlice = createSlice({
  name: 'customers',
  initialState,
  reducers: {
    setCustomers(state, action) {
      state.customers = action.payload || [];
    },
    clearCustomers(state) {
      state.customers = [];
      state.status = 'idle';
      state.error = null;
    },
    resetError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCustomers.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.customers = action.payload;
        state.error = null;
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })

      .addCase(createCustomer.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(createCustomer.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.customers = action.payload;
        state.error = null;
      })
      .addCase(createCustomer.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })

      .addCase(deleteCustomer.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(deleteCustomer.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.customers = action.payload;
        state.error = null;
      })
      .addCase(deleteCustomer.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })

      .addCase(updateCustomer.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(updateCustomer.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.customers = action.payload;
        state.error = null;
      })
      .addCase(updateCustomer.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  }
});

export const { setCustomers, clearCustomers, resetError } = customerSlice.actions;
export default customerSlice.reducer;

