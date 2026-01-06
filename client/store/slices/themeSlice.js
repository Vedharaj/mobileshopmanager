import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from "@react-native-async-storage/async-storage";

const THEME_STORAGE_KEY = 'app_theme';

// Default theme colors
const defaultTheme = {
  primaryColor: '#4c956c',
  secondaryColor: '#77bfa3',
  themeName: 'Default',
};

// Async thunk to load theme from AsyncStorage
export const loadThemeFromStorage = createAsyncThunk(
  'theme/loadFromStorage',
  async (_, thunkAPI) => {
    try {
      const storedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (storedTheme) {
        return JSON.parse(storedTheme);
      }
      return defaultTheme;
    } catch (error) {
      console.error("Failed to load theme from storage:", error);
      return defaultTheme;
    }
  }
);

// Async thunk to save theme to AsyncStorage
export const saveThemeToStorage = createAsyncThunk(
  'theme/saveToStorage',
  async (theme, thunkAPI) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(theme));
      return theme;
    } catch (error) {
      console.error("Failed to save theme to storage:", error);
      throw error; // Re-throw to indicate failure
    }
  }
);

const themeSlice = createSlice({
  name: 'theme',
  initialState: defaultTheme,
  reducers: {
    setTheme: (state, action) => {
      state.primaryColor = action.payload.primaryColor;
      state.secondaryColor = action.payload.secondaryColor;
      state.themeName = action.payload.themeName;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadThemeFromStorage.fulfilled, (state, action) => {
        state.primaryColor = action.payload.primaryColor;
        state.secondaryColor = action.payload.secondaryColor;
        state.themeName = action.payload.themeName;
      })
      .addCase(saveThemeToStorage.fulfilled, (state, action) => {
        state.primaryColor = action.payload.primaryColor;
        state.secondaryColor = action.payload.secondaryColor;
        state.themeName = action.payload.themeName;
      });
  },
});

export const { setTheme } = themeSlice.actions;
export default themeSlice.reducer;
