import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/axiosClient';
import AsyncStorage from "@react-native-async-storage/async-storage";

// Fetch authenticated user's products
export const fetchProducts = createAsyncThunk(
  'products/fetch',
  async (_, thunkAPI) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await api.get('/products', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data.products;
    } catch (error) {
      const msg = error.response?.data?.msg || error.message || 'Failed to fetch products';
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

// Create a new product
export const createProduct = createAsyncThunk(
  'products/create',
  async (payload, thunkAPI) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await api.post('/products', payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data.products;
    } catch (error) {
      const msg = error.response?.data?.msg || error.message || 'Failed to create product';
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

// Delete a product
export const deleteProduct = createAsyncThunk(
  'products/delete',
  async (productId, thunkAPI) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await api.delete(`/products/${productId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data.products;
    } catch (error) {
      const msg = error.response?.data?.msg || error.message || 'Failed to delete product';
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

// Update an existing product
export const updateProduct = createAsyncThunk(
  'products/update',
  async ({ productId, productData }, thunkAPI) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await api.put(`/products/${productId}`, productData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data.products;
    } catch (error) {
      const msg = error.response?.data?.msg || error.message || 'Failed to update product';
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

// Increment product quantity
export const incrementProductQty = createAsyncThunk(
  'products/incrementQty',
  async ({ productId, amount = 1 }, thunkAPI) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await api.patch(
        `/products/${productId}/increment`,
        { amount },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return res.data.products;
    } catch (error) {
      const msg = error.response?.data?.msg || error.message || 'Failed to increment product quantity';
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

// Decrement product quantity
export const decrementProductQty = createAsyncThunk(
  'products/decrementQty',
  async ({ productId, amount = 1 }, thunkAPI) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await api.patch(
        `/products/${productId}/decrement`,
        { amount },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return res.data.products;
    } catch (error) {
      const msg = error.response?.data?.msg || error.message || 'Failed to decrement product quantity';
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

const initialState = {
  products: [],
  status: 'idle',
  error: null,
};

const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setProducts(state, action) {
      state.products = action.payload || [];
    },
    clearProducts(state) {
      state.products = [];
      state.status = 'idle';
      state.error = null;
    },
    resetError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.products = action.payload;
        state.error = null;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })

      .addCase(createProduct.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.products = action.payload;
        state.error = null;
      })
      .addCase(createProduct.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })

      .addCase(deleteProduct.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.products = action.payload;
        state.error = null;
      })
      .addCase(deleteProduct.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })

      .addCase(updateProduct.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.products = action.payload;
        state.error = null;
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })

      // Increment product quantity (does not change status)
      .addCase(incrementProductQty.fulfilled, (state, action) => {
        state.products = action.payload;
      })
      .addCase(incrementProductQty.rejected, (state, action) => {
        state.error = action.payload;
      })

      // Decrement product quantity (does not change status)
      .addCase(decrementProductQty.fulfilled, (state, action) => {
        state.products = action.payload;
      })
      .addCase(decrementProductQty.rejected, (state, action) => {
        state.error = action.payload;
      });
  }
});

export const { setProducts, clearProducts, resetError } = productSlice.actions;
export default productSlice.reducer;

