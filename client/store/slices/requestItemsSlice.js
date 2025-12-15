import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/axiosClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const fetchRequestItems = createAsyncThunk('requestItems/fetch', async (_, thunkAPI) => {
  try {
    const token = await AsyncStorage.getItem('token');
    const res = await api.get('/request-items', { headers: { Authorization: `Bearer ${token}` } });
    return res.data.items || [];
  } catch (error) {
    const msg = error.response?.data?.msg || error.message || 'Failed to fetch request items';
    return thunkAPI.rejectWithValue(msg);
  }
});

export const createRequestItem = createAsyncThunk('requestItems/create', async (payload, thunkAPI) => {
  try {
    const token = await AsyncStorage.getItem('token');
    const res = await api.post('/request-items', payload, { headers: { Authorization: `Bearer ${token}` } });
    return res.data.items || [];
  } catch (error) {
    const msg = error.response?.data?.msg || error.message || 'Failed to create request item';
    return thunkAPI.rejectWithValue(msg);
  }
});

export const updateRequestItem = createAsyncThunk('requestItems/update', async ({ id, data }, thunkAPI) => {
  try {
    const token = await AsyncStorage.getItem('token');
    const res = await api.put(`/request-items/${id}`, data, { headers: { Authorization: `Bearer ${token}` } });
    return res.data.items || [];
  } catch (error) {
    const msg = error.response?.data?.msg || error.message || 'Failed to update request item';
    return thunkAPI.rejectWithValue(msg);
  }
});

export const deleteRequestItem = createAsyncThunk('requestItems/delete', async (id, thunkAPI) => {
  try {
    const token = await AsyncStorage.getItem('token');
    const res = await api.delete(`/request-items/${id}`, { headers: { Authorization: `Bearer ${token}` } });
    return res.data.items || [];
  } catch (error) {
    const msg = error.response?.data?.msg || error.message || 'Failed to delete request item';
    return thunkAPI.rejectWithValue(msg);
  }
});

const initialState = { items: [], status: 'idle', error: null };

const requestItemsSlice = createSlice({
  name: 'requestItems',
  initialState,
  reducers: {
    clearRequestItems(state) {
      state.items = [];
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRequestItems.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchRequestItems.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchRequestItems.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })

      .addCase(createRequestItem.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(createRequestItem.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(createRequestItem.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })

      .addCase(updateRequestItem.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(updateRequestItem.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(updateRequestItem.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })

      .addCase(deleteRequestItem.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(deleteRequestItem.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(deleteRequestItem.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  },
});

export const { clearRequestItems } = requestItemsSlice.actions;
export default requestItemsSlice.reducer;
