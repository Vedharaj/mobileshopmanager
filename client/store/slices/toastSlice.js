// src/store/toastSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  visible: false,
  message: "",
  type: "success", // 'success' | 'error' | 'warning' | 'info'
  duration: 2000,  // ms
};

const toastSlice = createSlice({
  name: "toast",
  initialState,
  reducers: {
    showToast: (state, action) => {
      const payload = action.payload || {};
      const { message, type = "success", duration = 2000 } = payload;
      // Normalize message to a string to avoid rendering objects (e.g., Error)
      const safeMessage = typeof message === "string"
        ? message
        : message && typeof message.message === "string"
        ? message.message
        : String(message || "");
      state.visible = true;
      state.message = safeMessage || "";
      state.type = type;
      state.duration = duration;
    },
    hideToast: (state) => {
      state.visible = false;
      state.message = "";
      state.type = "success";
      state.duration = 2000;
    },
  },
});

export const { showToast, hideToast } = toastSlice.actions;
export default toastSlice.reducer;
