import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api, { setAuthToken } from '../api/axiosClient';
import AsyncStorage from "@react-native-async-storage/async-storage";
// Removed: import { clearShops } from "./shopsSlice"; // Import clearShops from shopsSlice

// Fetch user information (call /me endpoint)
export const fetchMe = createAsyncThunk(
  'auth/fetchMe',
  async (_, thunkAPI) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await api.get('/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      // console.log(res.data);
      return res.data;
    } catch (error) {
      const msg =
        error.response?.data?.msg ||
        error.response?.data?.message ||
        'Failed to fetch user';

      return thunkAPI.rejectWithValue(msg);
    }
  }
);

// LOGIN
export const login = createAsyncThunk(
  'auth/login',
  async (credentials, thunkAPI) => {
    try {
      const res = await api.post('/auth/login', credentials);
      await AsyncStorage.setItem("token", res.data.token);
      // console.log(res.data);
      return res.data;
    } catch (error) {
      // console.log(error);
      const msg =
        error.response?.data?.msg ||
        error.response?.data?.message ||
        'Login failed';

      return thunkAPI.rejectWithValue(msg);
    }
  }
);

// REGISTER
export const register = createAsyncThunk(
  'auth/register',
  async (payload, thunkAPI) => {
    try {
      const res = await api.post('/auth/register', payload);
      return res.data;
    } catch (error) {
      const msg =
        error.response?.data?.msg ||
        error.response?.data?.message ||
        'Registration failed';

      return thunkAPI.rejectWithValue(msg);
    }
  }
);

// UPDATE PROFILE
export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (userData, thunkAPI) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await api.put('/auth/updateProfile', userData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data;
    } catch (error) {
      // console.log(error);
      const msg =
        error.response?.data?.msg ||
        error.response?.data?.message ||
        'Profile update failed';
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

const initialState = {
  token: null,
  user: null,
  username: null,
  status: 'idle',
  error: null,
  role: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) { // Removed action parameter
      state.token = null;
      state.user = null;
      state.username = null;
      state.role = null;
      state.error = null;
      state.shops = []; // Clear shops on logout
      setAuthToken(null);
      AsyncStorage.removeItem("token");
      // Removed: action.asyncDispatch(clearShops()); // Dispatch clearShops from shopsSlice
    },
    setCredentials(state, action) {
      state.token = action.payload.token || action.payload;  // handle both cases
      setAuthToken(action.payload.token || action.payload);
    },
    resetError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // LOGIN
      .addCase(login.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.username = action.payload.user?.username || null;
        state.role = action.payload.user?.role;
        state.error = null;
        // console.log(action.payload);
        setAuthToken(action.payload.token);
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload; // custom error message
      })

      // REGISTER
      .addCase(register.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.status = 'succeeded';
        // state.token = action.payload.token;
        // state.user = action.payload.user;
        // state.username = action.payload.user?.username || null;
        // state.role = action.payload.user?.role;
        // state.error = null;
        // setAuthToken(action.payload.token);
      })
      .addCase(register.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload; // backend error msg
      })

      // FETCH ME (user info on reload)
      .addCase(fetchMe.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload;
        state.username = action.payload.username || null;
        state.shops = action.payload.shops || [];
        state.userid = action.payload._id;
        state.role = action.payload.role;
        state.error = null;
      })
      .addCase(fetchMe.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(updateProfile.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload.user;
        state.username = action.payload.user?.username || null;
        state.error = null;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  }
});

export const { logout, setCredentials, resetError } = authSlice.actions;
export default authSlice.reducer;
