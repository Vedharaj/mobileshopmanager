import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/axiosClient';
import AsyncStorage from "@react-native-async-storage/async-storage";

// Fetch authenticated user's shops
export const fetchShops = createAsyncThunk(
  'shops/fetch',
  async (_, thunkAPI) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await api.get('/shops', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    //   console.log(res.data.shops);
      return res.data.shops;
    } catch (error) {
      const msg = error.response?.data?.msg || error.message || 'Failed to fetch shops';
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

// Create a new shop and return updated shops list
export const createShop = createAsyncThunk(
  'shops/create',
  async (payload, thunkAPI) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await api.post('/shops', payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      // server returns { shop, shops }
      return res.data.shops || [];
    } catch (error) {
      const msg = error.response?.data?.msg || error.message || 'Failed to create shop';
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

// Delete a shop and return updated shops list
export const deleteShop = createAsyncThunk(
  'shops/delete',
  async (shopId, thunkAPI) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await api.delete(`/shops/${shopId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      // server returns { msg, shops }
      return res.data.shops || [];
    } catch (error) {
      const msg = error.response?.data?.msg || error.message || 'Failed to delete shop';
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

// Update an existing shop and return updated shops list
export const updateShop = createAsyncThunk(
  'shops/update',
  async ({ shopId, shopData }, thunkAPI) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await api.put(`/shops/${shopId}`, shopData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      // server returns { msg, shop, shops }
      return res.data.shops || [];
    } catch (error) {
      const msg = error.response?.data?.msg || error.message || 'Failed to update shop';
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

const initialState = {
  shops: [],
  status: 'idle',
  error: null,
};

const shopsSlice = createSlice({
  name: 'shops',
  initialState,
  reducers: {
    setShops(state, action) {
      state.shops = action.payload || [];
    },
    clearShops(state) {
      state.shops = [];
      state.status = 'idle';
      state.error = null;
    },
    resetError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchShops.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchShops.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.shops = action.payload;
        state.error = null;
      })
      .addCase(fetchShops.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })

      .addCase(createShop.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(createShop.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.shops = action.payload;
        state.error = null;
      })
      .addCase(createShop.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })

      .addCase(deleteShop.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(deleteShop.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.shops = action.payload;
        state.error = null;
      })
      .addCase(deleteShop.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })

      .addCase(updateShop.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(updateShop.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.shops = action.payload;
        state.error = null;
      })
      .addCase(updateShop.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  }
});

export const { setShops, clearShops, resetError } = shopsSlice.actions;
export default shopsSlice.reducer;
