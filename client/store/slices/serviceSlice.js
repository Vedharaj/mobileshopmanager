import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/axiosClient';
import AsyncStorage from "@react-native-async-storage/async-storage";

// Fetch authenticated user's services
export const fetchServices = createAsyncThunk(
  'services/fetch',
  async (_, thunkAPI) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await api.get('/services', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data.services;
    } catch (error) {
      const msg = error.response?.data?.msg || error.message || 'Failed to fetch services';
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

// Create a new service
export const createService = createAsyncThunk(
  'services/create',
  async (payload, thunkAPI) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await api.post('/services', payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data.services;
    } catch (error) {
      const msg = error.response?.data?.msg || error.message || 'Failed to create service';
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

// Delete a service
export const deleteService = createAsyncThunk(
  'services/delete',
  async (serviceId, thunkAPI) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await api.delete(`/services/${serviceId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data.services;
    } catch (error) {
      const msg = error.response?.data?.msg || error.message || 'Failed to delete service';
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

// Update an existing service
export const updateService = createAsyncThunk(
  'services/update',
  async ({ serviceId, serviceData }, thunkAPI) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await api.put(`/services/${serviceId}`, serviceData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data.services;
    } catch (error) {
      const msg = error.response?.data?.msg || error.message || 'Failed to update service';
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

const initialState = {
  services: [],
  status: 'idle',
  error: null,
};

const serviceSlice = createSlice({
  name: 'services',
  initialState,
  reducers: {
    setServices(state, action) {
      state.services = action.payload || [];
    },
    clearServices(state) {
      state.services = [];
      state.status = 'idle';
      state.error = null;
    },
    resetError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchServices.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchServices.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.services = action.payload;
        state.error = null;
      })
      .addCase(fetchServices.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })

      .addCase(createService.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(createService.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.services = action.payload;
        state.error = null;
      })
      .addCase(createService.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })

      .addCase(deleteService.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(deleteService.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.services = action.payload;
        state.error = null;
      })
      .addCase(deleteService.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })

      .addCase(updateService.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(updateService.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.services = action.payload;
        state.error = null;
      })
      .addCase(updateService.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  }
});

export const { setServices, clearServices, resetError } = serviceSlice.actions;
export default serviceSlice.reducer;

