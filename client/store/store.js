import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import toast from './slices/toastSlice';
import shopsReducer from './slices/shopsSlice';
import staffReducer from './slices/staffSlice';
import productReducer from './slices/productSlice';
import categoryReducer from './slices/categorySlice';
import customerReducer from './slices/customerSlice';
import serviceReducer from './slices/serviceSlice';
import salesReducer from './slices/salesSlice';
import salesItemsReducer from './slices/salesItemsSlice';
import themeReducer from './slices/themeSlice'; // Import theme reducer

export const store = configureStore({
  reducer: {
    auth: authReducer,
    toast: toast,
    shops: shopsReducer,
    staff: staffReducer,
    products: productReducer,
    categories: categoryReducer,
    customers: customerReducer,
    services: serviceReducer,
    sales: salesReducer,
    salesItems: salesItemsReducer,
    theme: themeReducer, // Add theme reducer
  },
});
