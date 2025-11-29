import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import toast from './slices/toastSlice';
import shopsReducer from './slices/shopsSlice';
import staffReducer from './slices/staffSlice';
import themeReducer from './slices/themeSlice'; // Import theme reducer

export const store = configureStore({
  reducer: {
    auth: authReducer,
    toast: toast,
    shops: shopsReducer,
    staff: staffReducer,
    theme: themeReducer, // Add theme reducer
  },
});
