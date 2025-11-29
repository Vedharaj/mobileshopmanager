import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/axiosClient';
import AsyncStorage from "@react-native-async-storage/async-storage";

// Fetch authenticated user's categories
export const fetchCategories = createAsyncThunk(
  'categories/fetch',
  async (_, thunkAPI) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await api.get('/categories', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data.categories;
    } catch (error) {
      const msg = error.response?.data?.msg || error.message || 'Failed to fetch categories';
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

// Create a new category
export const createCategory = createAsyncThunk(
  'categories/create',
  async (payload, thunkAPI) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await api.post('/categories', payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data.categories;
    } catch (error) {
      const msg = error.response?.data?.msg || error.message || 'Failed to create category';
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

// Delete a category
export const deleteCategory = createAsyncThunk(
  'categories/delete',
  async (categoryId, thunkAPI) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await api.delete(`/categories/${categoryId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data.categories;
    } catch (error) {
      const msg = error.response?.data?.msg || error.message || 'Failed to delete category';
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

// Update an existing category
export const updateCategory = createAsyncThunk(
  'categories/update',
  async ({ categoryId, categoryData }, thunkAPI) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await api.put(`/categories/${categoryId}`, categoryData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data.categories;
    } catch (error) {
      const msg = error.response?.data?.msg || error.message || 'Failed to update category';
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

const initialState = {
  categories: [],
  status: 'idle',
  error: null,
};

const categorySlice = createSlice({
  name: 'categories',
  initialState,
  reducers: {
    setCategories(state, action) {
      state.categories = action.payload || [];
    },
    clearCategories(state) {
      state.categories = [];
      state.status = 'idle';
      state.error = null;
    },
    resetError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.categories = action.payload;
        state.error = null;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })

      .addCase(createCategory.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(createCategory.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.categories = action.payload;
        state.error = null;
      })
      .addCase(createCategory.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })

      .addCase(deleteCategory.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.categories = action.payload;
        state.error = null;
      })
      .addCase(deleteCategory.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })

      .addCase(updateCategory.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(updateCategory.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.categories = action.payload;
        state.error = null;
      })
      .addCase(updateCategory.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  }
});

export const { setCategories, clearCategories, resetError } = categorySlice.actions;
export default categorySlice.reducer;

