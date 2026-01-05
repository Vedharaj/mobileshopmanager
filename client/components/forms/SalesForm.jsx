import React, { useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { MaterialIcons } from "@expo/vector-icons";
import { useThemeColors, useThemedStyles } from "../../styles/global";
import ProductSearchModal from "../modals/ProductSearchModal";
import { useNavigation } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import {
  addCartRow,
  clearCart,
  removeCartItem,
  selectCartItems,
  selectCartTotals,
  updateCartItem,
} from "../../store/slices/salesItemsSlice";
import {
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
} from "../../store/slices/salesFormSlice";
import { createCustomer } from "../../store/slices/customerSlice";
import { showToast } from "../../store/slices/toastSlice";

export default function SalesForm({
  primaryColor,
  products = [],
  shops = [],
  customers = [],
  selectedShopForTx,
  setSelectedShopForTx,
  isSubmitting,
  onSubmitSales,
  onCancel,
}) {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { textSecondary, textColor } = useThemeColors();
  const themedStyles = useThemedStyles();
  const items = useSelector(selectCartItems);
  const { total: totalAmount } = useSelector(selectCartTotals);
  const salesForm = useSelector((state) => state.salesForm);
  const selectedCustomer = salesForm.selectedCustomer;
  const cashPaid = salesForm.cashPaid;
  const eCashPaid = salesForm.eCashPaid;
  const modalVisible = salesForm.modalVisible;
  const currentItemId = salesForm.currentItemId;
  const showCreateCustomer = salesForm.showCreateCustomer;
  const newCustomerName = salesForm.newCustomerName;
  const newCustomerPhoneNo = salesForm.newCustomerPhoneNo;
  const newCustomerAddress = salesForm.newCustomerAddress;

  const calculateSubtotal = (qty, price) => {
    const q = parseFloat(qty) || 0;
    const p = parseFloat(price) || 0;
    return q * p;
  };

  const handleAddItem = () => {
    const lastItem = items[items.length - 1];
    if (!lastItem.product_id) {
      Alert.alert(
        "Incomplete Item",
        "Please select a product for the current item first"
      );
      return;
    }
    dispatch(addCartRow());
  };

  const selectProduct = (product) => {
    if (!currentItemId) return;
    const productId = product._id || product.id || product.product_id;
    const productPrice =
      product.selling_price ?? product.price ?? product.unit_price ?? 0;
    const productCgst = product.cgst ?? 0;
    const productSgst = product.sgst ?? 0;

    const productExists = items.some(
      (i) => i.product_id === productId && i.id !== currentItemId
    );

    if (productExists) {
      const currentRow = items.find((i) => i.id === currentItemId);
      const currentQty = parseFloat(currentRow?.quantity || "1") || 1;
      items
        .filter((i) => i.product_id === productId && i.id !== currentItemId)
        .forEach((item) => {
          const newQty = String((parseFloat(item.quantity) || 0) + currentQty);
          dispatch(
            updateCartItem({
              id: item.id,
              changes: {
                quantity: newQty,
                subtotal: calculateSubtotal(newQty, item.unit_price),
              },
            })
          );
        });
      dispatch(removeCartItem(currentItemId));
    } else {
      dispatch(
        updateCartItem({
          id: currentItemId,
          changes: {
            product_id: productId,
            product_name: product.name,
            unit_price: String(productPrice || 0),
            cgst: productCgst,
            sgst: productSgst,
          },
        })
      );
    }

    dispatch(setModalVisible(false));
    dispatch(setCurrentItemId(null));
  };

  const handleCreateCustomer = async () => {
    if (!newCustomerName) {
      dispatch(
        showToast({
          message: "Please enter customer name",
          type: "error",
        })
      );
      return;
    }

    try {
      const result = await dispatch(
        createCustomer({
          name: newCustomerName,
          phone_no: newCustomerPhoneNo,
          address: newCustomerAddress,
        })
      ).unwrap();

      dispatch(
        showToast({
          message: "Customer created successfully!",
          type: "success",
        })
      );

      const newCustomer = result?.find(
        (customer) => customer.name === newCustomerName
      );

      if (newCustomer) {
        dispatch(setSelectedCustomer(newCustomer._id));
      }

      dispatch(setNewCustomerName(""));
      dispatch(setNewCustomerPhoneNo(""));
      dispatch(setNewCustomerAddress(""));
      dispatch(setShowCreateCustomer(false));
    } catch (err) {
      dispatch(
        showToast({
          message: err || "Failed to create customer",
          type: "error",
        })
      );
    }
  };

  const handleClear = () => {
    dispatch(clearCart());
    dispatch(resetSalesForm());
  };

  const handleSave = () => {
    const filledItems = items.filter((item) => item.product_id);

    if (filledItems.length === 0) {
      Alert.alert(
        "Validation Error",
        "Please add at least one item with a product"
      );
      return;
    }

    const invalidItems = filledItems.filter(
      (item) => !item.product_id || !item.quantity || !item.unit_price
    );
    if (invalidItems.length > 0) {
      Alert.alert(
        "Validation Error",
        "Please fill in all item details (Product, Qty, Price)"
      );
      return;
    }

    const invalidQty = filledItems.filter(
      (item) => parseFloat(item.quantity) <= 0
    );
    if (invalidQty.length > 0) {
      Alert.alert("Validation Error", "All quantities must be greater than 0");
      return;
    }

    const invalidPrice = filledItems.filter(
      (item) => parseFloat(item.unit_price) < 0
    );
    if (invalidPrice.length > 0) {
      Alert.alert("Validation Error", "Prices cannot be negative");
      return;
    }

    if (totalAmount <= 0) {
      Alert.alert("Validation Error", "Total amount must be greater than 0");
      return;
    }

    const cash = parseFloat(cashPaid) || 0;
    const eCash = parseFloat(eCashPaid) || 0;
    const paidAmount = cash + eCash;

    if (paidAmount <= 0) {
      Alert.alert("Validation Error", "Please enter cash or e-cash amount");
      return;
    }

    const balanceAmount = Math.max(totalAmount - paidAmount, 0);

    const submitSale = (paymentStatus) => {
      const saleData = {
        name: "Sales",
        type: "sales",
        shop_id: selectedShopForTx,
        items: filledItems.map((item) => {
          const qty = parseFloat(item.quantity) || 0;
          const price = parseFloat(item.unit_price) || 0;
          const product =
            products.find(
              (p) =>
                p._id === item.product_id ||
                p.id === item.product_id ||
                p.product_id === item.product_id
            ) || {};
          const cgst = item.cgst ?? product.cgst ?? 0;
          const sgst = item.sgst ?? product.sgst ?? 0;
          return {
            product_id: item.product_id,
            quantity: qty,
            unit_price: price,
            cgst,
            sgst,
            total_price: qty * price,
          };
        }),
        customer_id: selectedCustomer || null,
        total_amount: totalAmount,
        paid_amount: paidAmount,
        balance: balanceAmount,
        payment_status: paymentStatus,
        cash_paid: cash,
        online_paid: eCash,
      };

      onSubmitSales(saleData);
    };

    if (paidAmount < totalAmount) {
      Alert.alert(
        "Pending Payment",
        `Paid amount is less than total. Remaining balance: ₹${balanceAmount.toFixed(
          2
        )}. Continue and mark payment as pending?`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Continue", onPress: () => submitSale("pending") },
        ]
      );
      return;
    }

    submitSale("paid");
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
      keyboardVerticalOffset={150}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
        contentContainerStyle={{ paddingBottom: 10 }}
      >

        {/* Shop Selection */}
        {shops && shops.length > 0 && (
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: textColor,
                marginBottom: 6,
              }}
            >
              Shop *
            </Text>
            <View style={{ ...themedStyles.input, padding: 0 }}>
              <Picker
                selectedValue={selectedShopForTx}
                onValueChange={setSelectedShopForTx}
                style={{ color: textColor }}
                itemStyle={{ color: textColor }}
                dropdownIconColor={textColor}
              >
                {shops.map((s) => (
                  <Picker.Item
                    key={s._id || s.id || s}
                    label={s.name}
                    value={s._id || s.id || s}
                  />
                ))}
              </Picker>
            </View>
          </View>
        )}

        {/* Customer Selection (Optional) */}
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 13,
              fontWeight: "600",
              color: textColor,
              marginBottom: 6,
            }}
          >
            Customer (Optional)
          </Text>
          {!showCreateCustomer ? (
            <View style={{ ...themedStyles.input, padding: 0 }}>
              <Picker
                selectedValue={selectedCustomer}
                onValueChange={(value) => {
                  if (value === "create_new") {
                    dispatch(setShowCreateCustomer(true));
                    dispatch(setSelectedCustomer(""));
                  } else {
                    dispatch(setSelectedCustomer(value));
                  }
                }}
                style={{ color: textColor }}
                itemStyle={{ color: textColor }}
                dropdownIconColor={textColor}
              >
                <Picker.Item label="Walk-in" value="" />
                {customers &&
                  customers.map((c) => (
                    <Picker.Item
                      key={c._id || c.id}
                      label={c.name}
                      value={c._id || c.id}
                    />
                  ))}
                <Picker.Item label="+ Create New Customer" value="create_new" />
              </Picker>
            </View>
          ) : (
            <View>
              <TextInput
                style={themedStyles.input}
                placeholder="Customer Name *"
                placeholderTextColor={textSecondary}
                value={newCustomerName}
                onChangeText={(val) => dispatch(setNewCustomerName(val))}
              />
              <TextInput
                style={themedStyles.input}
                placeholder="Phone Number"
                placeholderTextColor={textSecondary}
                value={newCustomerPhoneNo}
                onChangeText={(val) => dispatch(setNewCustomerPhoneNo(val))}
                keyboardType="phone-pad"
              />
              <TextInput
                style={themedStyles.input}
                placeholder="Address"
                placeholderTextColor={textSecondary}
                value={newCustomerAddress}
                onChangeText={(val) => dispatch(setNewCustomerAddress(val))}
                multiline
              />
              <View style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}>
                <TouchableOpacity
                  style={{
                    ...themedStyles.button1,
                    flex: 1,
                    backgroundColor: textColor,
                  }}
                  onPress={() => {
                    dispatch(setShowCreateCustomer(false));
                    dispatch(setNewCustomerName(""));
                    dispatch(setNewCustomerPhoneNo(""));
                    dispatch(setNewCustomerAddress(""));
                  }}
                >
                  <Text style={themedStyles.btnText1}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ ...themedStyles.button1, flex: 1 }}
                  onPress={handleCreateCustomer}
                >
                  <Text style={themedStyles.btnText1}>Create</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Items Summary Section */}
        <View
          style={{ 
            backgroundColor: primaryColor + "33",
            padding: 14,
            borderRadius: 8,
            marginBottom: 15,
            borderWidth: 1,
            borderColor: primaryColor,
            marginTop: 5,
          }}
        >
          <Text
            style={{
              fontSize: 13,
              fontWeight: "700",
              color: textColor,
              marginBottom: 10,
            }}
          >
            Items Summary
          </Text>
          {items.map((item) => {
            if (!item.product_id) return null;
            return (
              <View
                key={item.id}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingVertical: 6,
                  borderBottomWidth: 1,
                  borderBottomColor: primaryColor + "33",
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "600",
                      color: textColor,
                    }}
                  >
                    {item.product_name}
                  </Text>
                  <Text style={{ fontSize: 11, color: textSecondary, marginTop: 2 }}>
                    {item.quantity} × ₹{parseFloat(item.unit_price).toFixed(2)}
                  </Text>
                </View>
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "700",
                    color: textColor,
                    marginLeft: 10,
                  }}
                >
                  ₹{item.subtotal.toFixed(2)}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Add Item and clear buttons */}
        <View style={{ flexDirection: "row", gap: 10 }}>
          <TouchableOpacity
            style={[
              {
                ...themedStyles.button1,
                backgroundColor: textSecondary,
                borderRadius: 6,
                flex:1,
              },
              isSubmitting && { opacity: 0.6 },
            ]}
            onPress={handleClear}
            disabled={isSubmitting}
          >
            <Text style={themedStyles.btnText1}>Clear</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              ...themedStyles.button2,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              flex:1,
            }}
            onPress={() => navigation.navigate('AddSalesFormItems')}
          >
            <MaterialIcons name="add" size={20} color="#fff" />
            <Text
              style={{
                marginLeft: 6,
                fontSize: 14,
                fontWeight: "600",
                color: "#fff",
              }}
            >
              Add Item
            </Text>
          </TouchableOpacity>
        </View>

        {/* Total and balance Section */}
        <View
          style={{
            backgroundColor: primaryColor + "33",
            padding: 14,
            borderRadius: 8,
            borderLeftWidth: 4,
            borderLeftColor: primaryColor,
            marginTop: 10
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: "700", color: textColor }}>
            TOTAL: ₹{totalAmount.toFixed(2)}
          </Text>
        </View>

        {/* Payment Fields */}
          <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, marginBottom: 5, color: textColor }}>
                Cash
              </Text>
              <TextInput
                style={{
                  ...themedStyles.input,
                  marginBottom: 0,
                }}
                placeholder="0"
                placeholderTextColor={textSecondary}
                keyboardType="numeric"
                value={cashPaid}
                onChangeText={(val) => dispatch(setCashPaid(val))}
                blurOnSubmit
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, marginBottom: 5, color: textColor }}>
                E-Cash
              </Text>
              <TextInput
                style={{
                  ...themedStyles.input,
                  marginBottom: 0,
                }}
                placeholder="0"
                placeholderTextColor={textSecondary}
                keyboardType="numeric"
                value={eCashPaid}
                onChangeText={(val) => dispatch(setECashPaid(val))}
                blurOnSubmit
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
              />
            </View>
          </View>

        {/* Action button1s */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "flex-end",
            gap: 10,
          }}
        >
          <TouchableOpacity
            style={{
              ...themedStyles.button1,
              minWidth: 110,
              backgroundColor: "#fff",
              borderWidth: 1.5,
              borderColor: primaryColor,
              alignItems: "center",
            }}
            onPress={onCancel}
            disabled={isSubmitting}
          >
            <Text
              style={{ fontSize: 15, fontWeight: "600", color: primaryColor }}
            >
              Cancel
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              ...themedStyles.button2,
              borderRadius: 28,
              minWidth: 110,
              ...(isSubmitting ? { opacity: 0.6 } : {}),
            }}
            onPress={handleSave}
            disabled={isSubmitting}
          >
            <Text style={themedStyles.btnText1}>
              {isSubmitting ? "Saving..." : "Save"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Product Search Modal */}
        <ProductSearchModal
          visible={modalVisible}
          products={products}
          primaryColor={primaryColor}
          onClose={() => dispatch(setModalVisible(false))}
          onSelectProduct={selectProduct}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
