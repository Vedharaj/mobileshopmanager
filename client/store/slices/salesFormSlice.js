import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  selectedCustomer: '',
  cashPaid: '',
  eCashPaid: '',
  modalVisible: false,
  currentItemId: null,
  showCreateCustomer: false,
  newCustomerName: '',
  newCustomerPhoneNo: '',
  newCustomerAddress: '',
};

const salesFormSlice = createSlice({
  name: 'salesForm',
  initialState,
  reducers: {
    setSelectedCustomer(state, action) {
      state.selectedCustomer = action.payload;
    },
    setCashPaid(state, action) {
      state.cashPaid = action.payload;
    },
    setECashPaid(state, action) {
      state.eCashPaid = action.payload;
    },
    setModalVisible(state, action) {
      state.modalVisible = action.payload;
    },
    setCurrentItemId(state, action) {
      state.currentItemId = action.payload;
    },
    setShowCreateCustomer(state, action) {
      state.showCreateCustomer = action.payload;
    },
    setNewCustomerName(state, action) {
      state.newCustomerName = action.payload;
    },
    setNewCustomerPhoneNo(state, action) {
      state.newCustomerPhoneNo = action.payload;
    },
    setNewCustomerAddress(state, action) {
      state.newCustomerAddress = action.payload;
    },
    resetSalesForm(state) {
      Object.assign(state, initialState);
    },
  },
});

export const {
  setSelectedCustomer,
  setCashPaid,
  setECashPaid,
  setModalVisible,
  setCurrentItemId,
  setShowCreateCustomer,
  setNewCustomerName,
  setNewCustomerPhoneNo,
  setNewCustomerAddress,
  resetSalesForm,
} = salesFormSlice.actions;

export default salesFormSlice.reducer;
