import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/axiosClient';
import AsyncStorage from "@react-native-async-storage/async-storage";

// Fetch authenticated user's staff
export const fetchStaff = createAsyncThunk(
  'staff/fetch',
  async (_, thunkAPI) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await api.get('/staff', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data.staff;
    } catch (error) {
      const msg = error.response?.data?.msg || error.message || 'Failed to fetch staff';
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

// Create a new staff member
export const createStaff = createAsyncThunk(
  'staff/create',
  async (payload, thunkAPI) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await api.post('/staff', payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data.staff;
    } catch (error) {
      const msg = error.response?.data?.msg || error.message || 'Failed to create staff';
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

// Delete a staff member
export const deleteStaff = createAsyncThunk(
  'staff/delete',
  async (staffId, thunkAPI) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await api.delete(`/staff/${staffId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data.staff;
    } catch (error) {
      const msg = error.response?.data?.msg || error.message || 'Failed to delete staff';
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

// Update an existing staff member
export const updateStaff = createAsyncThunk(
  'staff/update',
  async ({ staffId, staffData }, thunkAPI) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await api.put(`/staff/${staffId}`, staffData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data.staff;
    } catch (error) {
      const msg = error.response?.data?.msg || error.message || 'Failed to update staff';
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

const initialState = {
  staff: [],
  status: 'idle',
  error: null,
};

const staffSlice = createSlice({
  name: 'staff',
  initialState,
  reducers: {
    setStaff(state, action) {
      state.staff = action.payload || [];
    },
    clearStaff(state) {
      state.staff = [];
      state.status = 'idle';
      state.error = null;
    },
    resetError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStaff.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchStaff.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.staff = action.payload;
        state.error = null;
      })
      .addCase(fetchStaff.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })

      .addCase(createStaff.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(createStaff.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.staff = action.payload;
        state.error = null;
      })
      .addCase(createStaff.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })

      .addCase(deleteStaff.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(deleteStaff.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.staff = action.payload;
        state.error = null;
      })
      .addCase(deleteStaff.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })

      .addCase(updateStaff.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(updateStaff.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.staff = action.payload;
        state.error = null;
      })
      .addCase(updateStaff.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  }
});

export const { setStaff, clearStaff, resetError } = staffSlice.actions;
export default staffSlice.reducer;
