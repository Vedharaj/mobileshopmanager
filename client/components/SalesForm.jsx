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
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { MaterialIcons } from "@expo/vector-icons";
import { global } from "../styles/global";
import ProductSearchModal from "./ProductSearchModal";
import { useNavigation } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import {
  addCartRow,
  clearCart,
  removeCartItem,
  selectCartItems,
  selectCartTotals,
  updateCartItem,
} from "../store/slices/salesItemsSlice";
import { createCustomer } from "../store/slices/customerSlice";
import { showToast } from "../store/slices/toastSlice";
import { fetchCategories } from "../store/slices/categorySlice";

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
  const items = useSelector(selectCartItems);
  const { total: totalAmount } = useSelector(selectCartTotals);
  const categories = useSelector((state) => state.categories.categories || []);

  const [selectedCustomer, setSelectedCustomer] = React.useState("");
  const [cashPaid, setCashPaid] = React.useState("");
  const [eCashPaid, setECashPaid] = React.useState("");
  const [modalVisible, setModalVisible] = React.useState(false);
  const [currentItemId, setCurrentItemId] = React.useState(null);
  const [showCreateCustomer, setShowCreateCustomer] = React.useState(false);
  const [newCustomerName, setNewCustomerName] = React.useState("");
  const [newCustomerPhoneNo, setNewCustomerPhoneNo] = React.useState("");
  const [newCustomerAddress, setNewCustomerAddress] = React.useState("");

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  const calculateSubtotal = (qty, price) => {
    const q = parseFloat(qty) || 0;
    const p = parseFloat(price) || 0;
    return q * p;
  };

  const handleAddItem = () => {
    const lastItem = items[items.length - 1];
    
    if (!lastItem.category_id) {
      Alert.alert(
        "Incomplete Item",
        "Please select a category for the current item first"
      );
      return;
    }
    
    if (!lastItem.quantity || parseFloat(lastItem.quantity) <= 0) {
      Alert.alert(
        "Incomplete Item",
        "Please enter quantity for the current item"
      );
      return;
    }
    
    if (!lastItem.unit_price || parseFloat(lastItem.unit_price) < 0) {
      Alert.alert(
        "Incomplete Item",
        "Please enter price for the current item"
      );
      return;
    }
    
    dispatch(addCartRow());
  };

  const openProductModal = (itemId) => {
    const item = items.find((i) => i.id === itemId);
    if (!item?.category_id) {
      Alert.alert("Category Required", "Please select a category first");
      return;
    }
    setCurrentItemId(itemId);
    setModalVisible(true);
  };

  const getFilteredProducts = () => {
    if (!currentItemId) return products;
    const item = items.find((i) => i.id === currentItemId);
    if (!item?.category_id) return products;
    
    // Extract category ID from item (should be a string)
    const selectedCategoryId = item.category_id;
    
    // Filter products by matching category_id (handle both string and object formats)
    return products.filter((p) => {
      const productCategoryId = p.category_id?._id || p.category_id;
      return productCategoryId === selectedCategoryId;
    });
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

    setModalVisible(false);
    setCurrentItemId(null);
  };

  const handleRemoveItem = (id) => {
    if (items.length === 1) {
      Alert.alert("Cannot remove", "At least one item is required");
      return;
    }
    dispatch(removeCartItem(id));
  };

  const handleItemChange = (id, field, value) => {
    const current = items.find((item) => item.id === id);
    if (!current) return;

    let nextUnitPrice = current.unit_price;
    let nextCgst = current.cgst ?? 0;
    let nextSgst = current.sgst ?? 0;
    if (field === "product_id" && value) {
      const product = products.find(
        (p) => p._id === value || p.id === value || p.product_id === value
      );
      if (product) {
        nextUnitPrice = String(
          product.selling_price ?? product.price ?? product.unit_price ?? 0
        );
        nextCgst = product.cgst ?? 0;
        nextSgst = product.sgst ?? 0;
      }
    }

    const merged = {
      ...current,
      [field]: value,
      unit_price:
        field === "product_id"
          ? nextUnitPrice
          : field === "unit_price"
          ? value
          : current.unit_price,
      cgst: field === "product_id" ? nextCgst : current.cgst ?? 0,
      sgst: field === "product_id" ? nextSgst : current.sgst ?? 0,
    };
    merged.subtotal = calculateSubtotal(merged.quantity, merged.unit_price);

    dispatch(
      updateCartItem({
        id,
        changes: merged,
      })
    );
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
        setSelectedCustomer(newCustomer._id);
      }

      setNewCustomerName("");
      setNewCustomerPhoneNo("");
      setNewCustomerAddress("");
      setShowCreateCustomer(false);
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
    setSelectedCustomer("");
    setCashPaid("");
    setECashPaid("");
    setShowCreateCustomer(false);
    setNewCustomerName("");
    setNewCustomerPhoneNo("");
    setNewCustomerAddress("");
  };

  const handleSave = () => {
    const filledItems = items.filter((item) => item.product_id);

    // if (filledItems.length === 0) {
    //   Alert.alert(
    //     "Validation Error",
    //     "Please add at least one item with a product"
    //   );
    //   return;
    // }

    const itemsWithoutCategory = items.filter((item) => !item.category_id);
    if (itemsWithoutCategory.length > 0) {
      Alert.alert(
        "Validation Error",
        "Please select a category for all items"
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

    if (paidAmount < totalAmount) {
      Alert.alert(
        "Validation Error",
        "Paid amount must be equal to total amount. Pending payments are not allowed."
      );
      return;
    }

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
      cash_paid: cash,
      online_paid: eCash,
    };

    onSubmitSales(saleData);
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
      >
        <Text style={{ fontSize: 16, fontWeight: "600", marginBottom: 10 }}>
          Sales Entry
        </Text>

        {/* Shop and Customer Selection Row */}
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 15 }}>
          {/* Shop Selection */}
          {shops && shops.length > 0 && (
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: "#666",
                  marginBottom: 6,
                }}
              >
                Shop *
              </Text>
              <View style={{ ...global.input, padding: 0 }}>
                <Picker
                  selectedValue={selectedShopForTx}
                  onValueChange={setSelectedShopForTx}
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
                color: "#666",
                marginBottom: 6,
              }}
            >
              Customer (Optional)
            </Text>
            {!showCreateCustomer ? (
              <View style={{ ...global.input, padding: 0 }}>
                <Picker
                  selectedValue={selectedCustomer}
                  onValueChange={(value) => {
                    if (value === "create_new") {
                      setShowCreateCustomer(true);
                      setSelectedCustomer("");
                    } else {
                      setSelectedCustomer(value);
                    }
                  }}
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
                  <Picker.Item
                    label="+ Create New Customer"
                    value="create_new"
                  />
                </Picker>
              </View>
            ) : (
              <View>
                <TextInput
                  style={global.input}
                  placeholder="Customer Name *"
                  value={newCustomerName}
                  onChangeText={setNewCustomerName}
                />
                <TextInput
                  style={global.input}
                  placeholder="Phone Number"
                  value={newCustomerPhoneNo}
                  onChangeText={setNewCustomerPhoneNo}
                  keyboardType="phone-pad"
                />
                <TextInput
                  style={global.input}
                  placeholder="Address"
                  value={newCustomerAddress}
                  onChangeText={setNewCustomerAddress}
                  multiline
                />
                <View
                  style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}
                >
                  <TouchableOpacity
                    style={{
                      ...global.button,
                      flex: 1,
                      backgroundColor: "#666",
                    }}
                    onPress={() => {
                      setShowCreateCustomer(false);
                      setNewCustomerName("");
                      setNewCustomerPhoneNo("");
                      setNewCustomerAddress("");
                    }}
                  >
                    <Text style={global.btnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{ ...global.button, flex: 1 }}
                    onPress={handleCreateCustomer}
                  >
                    <Text style={global.btnText}>Create</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Items Summary Section */}
        {items.filter((item) => item.product_id).length > 0 && (
          <View
            style={{
              backgroundColor: "#fff9e6",
              padding: 14,
              borderRadius: 8,
              marginBottom: 15,
              borderWidth: 1,
              borderColor: "#ffe680",
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: "700",
                color: "#333",
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
                    borderBottomColor: "#ffe680",
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "600",
                        color: "#333",
                      }}
                    >
                      {item.product_name}
                    </Text>
                    <Text style={{ fontSize: 11, color: "#666", marginTop: 2 }}>
                      {item.quantity} × ₹
                      {parseFloat(item.unit_price).toFixed(2)}
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "700",
                      color: "#333",
                      marginLeft: 10,
                    }}
                  >
                    ₹{item.subtotal.toFixed(2)}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Total Section */}
        <View
          style={{
            backgroundColor: "#f0f9ff",
            padding: 14,
            borderRadius: 8,
            borderLeftWidth: 4,
            borderLeftColor: primaryColor,
            marginBottom: 15,
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: "700", color: "#333" }}>
            TOTAL: ₹{totalAmount.toFixed(2)}
          </Text>
        </View>

        {/* Payment Fields */}
        <View style={{ marginBottom: 15 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              marginBottom: 8,
              color: "#333",
            }}
          >
            Payment Details
          </Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, marginBottom: 5, color: "#666" }}>
                Cash
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: "#ddd",
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 14,
                  backgroundColor: "#fff",
                }}
                placeholder="0"
                keyboardType="numeric"
                value={cashPaid}
                onChangeText={setCashPaid}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, marginBottom: 5, color: "#666" }}>
                E-Cash
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: "#ddd",
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 14,
                  backgroundColor: "#fff",
                }}
                placeholder="0"
                keyboardType="numeric"
                value={eCashPaid}
                onChangeText={setECashPaid}
              />
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "flex-end",
            gap: 10,
            marginBottom: 10,
          }}
        >
          <TouchableOpacity
            style={{
              ...global.button,
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
            style={[
              { ...global.button, minWidth: 110, backgroundColor: "#666" },
              isSubmitting && { opacity: 0.6 },
            ]}
            onPress={handleClear}
            disabled={isSubmitting}
          >
            <Text style={global.btnText}>Clear</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              global.button,
              { minWidth: 110 },
              isSubmitting && { opacity: 0.6 },
            ]}
            onPress={handleSave}
            disabled={isSubmitting}
          >
            <Text style={global.btnText}>
              {isSubmitting ? "Saving..." : "Save"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Items Section */}
        <View style={{ marginBottom: 15, backgroundColor: primaryColor + "10", padding: 6, borderRadius: 8, borderWidth: 1, borderColor: primaryColor + "30"   }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: "#333",
              marginBottom: 10,
            }}
          >
            Items Details - {items.length} item{items.length !== 1 ? "s" : ""}
          </Text>

          <View style={{ maxHeight: 320 }}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled={true}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 8 }}
            >
              {items.map((item, index) => (
                <View
                  key={item.id}
                  style={{
                    backgroundColor: "#f9f9f9",
                    padding: 12,
                    borderRadius: 8,
                    marginBottom: 10,
                    borderWidth: 1,
                    borderColor: "#e0e0e0",
                  }}
                >
                  {/* Category Selection */}
                  <View style={{ marginBottom: 10 }}>
                    <Text
                      style={{ fontSize: 12, color: "#666", marginBottom: 4 }}
                    >
                      Category *
                    </Text>
                    <View
                      style={{
                        borderWidth: 1,
                        borderColor: "#ddd",
                        borderRadius: 8,
                        backgroundColor: "#fff",
                      }}
                    >
                      <Picker
                        selectedValue={item.category_id || ""}
                        onValueChange={(value) =>
                          handleItemChange(item.id, "category_id", value)
                        }
                        style={{ padding: 0 }}
                      >
                        <Picker.Item label="Select Category" value="" />
                        {categories &&
                          categories.map((cat) => (
                            <Picker.Item
                              key={cat._id || cat.id}
                              label={cat.name}
                              value={cat._id || cat.id}
                            />
                          ))}
                      </Picker>
                    </View>
                  </View>

                  {/* Item Selection */}
                  <View style={{ marginBottom: 10 }}>
                    <Text
                      style={{ fontSize: 12, color: "#666", marginBottom: 4 }}
                    >
                      Item {index + 1}
                    </Text>
                    <TouchableOpacity
                      style={{
                        borderWidth: 1,
                        borderColor: "#ddd",
                        borderRadius: 8,
                        padding: 12,
                        backgroundColor: "#fff",
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                      onPress={() => openProductModal(item.id)}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          color: item.product_name ? "#333" : "#999",
                        }}
                      >
                        {item.product_name || "Select Item"}
                      </Text>
                      <MaterialIcons name="search" size={20} color="#666" />
                    </TouchableOpacity>
                  </View>

                  {/* Qty and Price Row */}
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      marginBottom: 8,
                    }}
                  >
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text
                        style={{ fontSize: 12, color: "#666", marginBottom: 4 }}
                      >
                        Qty *
                      </Text>
                      <TextInput
                        style={[global.input, { marginBottom: 0 }]}
                        placeholder="Qty"
                        value={String(item.quantity || "")}
                        onChangeText={(value) =>
                          handleItemChange(item.id, "quantity", value)
                        }
                        keyboardType="numeric"
                        maxLength={6}
                      />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text
                        style={{ fontSize: 12, color: "#666", marginBottom: 4 }}
                      >
                        Price *
                      </Text>
                      <TextInput
                        style={[global.input, { marginBottom: 0 }]}
                        placeholder="Price"
                        value={String(item.unit_price || "")}
                        onChangeText={(value) =>
                          handleItemChange(item.id, "unit_price", value)
                        }
                        keyboardType="numeric"
                        maxLength={8}
                      />
                    </View>
                  </View>

                  {/* Subtotal and Remove */}
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginTop: 8,
                      paddingTop: 8,
                      borderTopWidth: 1,
                      borderTopColor: "#e0e0e0",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "700",
                        color: primaryColor,
                      }}
                    >
                      Subtotal: ₹{item.subtotal.toFixed(2)}
                    </Text>
                    {items.length > 1 && (
                      <TouchableOpacity
                        onPress={() => handleRemoveItem(item.id)}
                      >
                        <MaterialIcons name="close" size={24} color="#e74c3c" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
          {/* Add Item Button */}
          <TouchableOpacity
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: 10,
              borderWidth: 1.5,
              borderColor: primaryColor,
              borderRadius: 8,
              borderStyle: "dashed",
              marginTop: 10,
            }}
            onPress={handleAddItem}
          >
            <MaterialIcons name="add" size={20} color={primaryColor} />
            <Text
              style={{
                marginLeft: 6,
                fontSize: 14,
                fontWeight: "600",
                color: primaryColor,
              }}
            >
              Add Item
            </Text>
          </TouchableOpacity>

        </View>

        {/* Product Search Modal */}
        <ProductSearchModal
          visible={modalVisible}
          products={getFilteredProducts()}
          primaryColor={primaryColor}
          onClose={() => setModalVisible(false)}
          onSelectProduct={selectProduct}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
