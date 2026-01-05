import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from "@react-native-async-storage/async-storage";

const THEME_STORAGE_KEY = 'app_theme';
const DARK_MODE_STORAGE_KEY = 'app_dark_mode';

// Default theme colors
const defaultTheme = {
  primaryColor: '#4c956c',
  secondaryColor: '#77bfa3',
  themeName: 'Default',
  isDarkMode: false,
};

// Async thunk to load theme from AsyncStorage
export const loadThemeFromStorage = createAsyncThunk(
  'theme/loadFromStorage',
  async (_, thunkAPI) => {
    try {
      const storedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      const storedDarkMode = await AsyncStorage.getItem(DARK_MODE_STORAGE_KEY);
      
      const theme = storedTheme ? JSON.parse(storedTheme) : defaultTheme;
      const isDarkMode = storedDarkMode ? JSON.parse(storedDarkMode) : false;
      
      return { ...theme, isDarkMode };
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
      await AsyncStorage.setItem(THEME_STORAGE_KEY, JSON.stringify({
        primaryColor: theme.primaryColor,
        secondaryColor: theme.secondaryColor,
        themeName: theme.themeName,
      }));
      if (typeof theme.isDarkMode === 'undefined') {
        await AsyncStorage.removeItem(DARK_MODE_STORAGE_KEY);
      } else {
        await AsyncStorage.setItem(DARK_MODE_STORAGE_KEY, JSON.stringify(theme.isDarkMode));
      }
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
      if (typeof action.payload.isDarkMode !== 'undefined') {
        state.isDarkMode = action.payload.isDarkMode;
      }
    },
    toggleDarkMode: (state) => {
      state.isDarkMode = !state.isDarkMode;
    },
    setDarkMode: (state, action) => {
      state.isDarkMode = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadThemeFromStorage.fulfilled, (state, action) => {
        state.primaryColor = action.payload.primaryColor;
        state.secondaryColor = action.payload.secondaryColor;
        state.themeName = action.payload.themeName;
        state.isDarkMode = action.payload.isDarkMode;
      })
      .addCase(saveThemeToStorage.fulfilled, (state, action) => {
        state.primaryColor = action.payload.primaryColor;
        state.secondaryColor = action.payload.secondaryColor;
        state.themeName = action.payload.themeName;
        state.isDarkMode = action.payload.isDarkMode;
      });
  },
});

export const { setTheme, toggleDarkMode, setDarkMode } = themeSlice.actions;
export default themeSlice.reducer;
