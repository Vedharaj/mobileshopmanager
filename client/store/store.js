import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import toast from './slices/toastSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    toast: toast,
  },
});
