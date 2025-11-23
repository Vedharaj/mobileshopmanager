import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api, { setAuthToken } from '../api/axiosClient';

// LOGIN
export const login = createAsyncThunk(
  'auth/login',
  async (credentials, thunkAPI) => {
    try {
      const res = await api.post('/auth/login', credentials);
      return res.data;
    } catch (error) {
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

const initialState = {
  token: null,
  user: null,
  status: 'idle',
  error: null
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.token = null;
      state.user = null;
      state.error = null;
      setAuthToken(null);
    },
    setCredentials(state, action) {
      state.token = action.payload.token;
      state.user = action.payload.user;
      setAuthToken(action.payload.token);
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
        state.error = null;
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
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.error = null;
        setAuthToken(action.payload.token);
      })
      .addCase(register.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload; // backend error msg
      });
  }
});

export const { logout, setCredentials } = authSlice.actions;
export default authSlice.reducer;
