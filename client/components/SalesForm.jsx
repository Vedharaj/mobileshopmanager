import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { MaterialIcons } from "@expo/vector-icons";
import { global } from "../styles/global";
import ProductSearchModal from "./ProductSearchModal";
import { useNavigation } from "@react-navigation/native";

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
  scannedProduct = null,
  onScanPress = null,
}) {
  const navigation = useNavigation();
  const [items, setItems] = useState([
    { id: Date.now(), product_id: "", product_name: "", quantity: "1", unit_price: "", subtotal: 0 },
  ]);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [totalAmount, setTotalAmount] = useState(0);
  const [cashPaid, setCashPaid] = useState("");
  const [eCashPaid, setECashPaid] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [currentItemId, setCurrentItemId] = useState(null);

  // Handle scanned product
  useEffect(() => {
    if (scannedProduct && scannedProduct._id) {
      console.log('SalesForm received scanned product:', scannedProduct);
      
      setItems((prevItems) => {
        // Filter out empty items (no product selected)
        const filledItems = prevItems.filter((item) => item.product_id);

        // Check if product already exists in items
        const existingItemIndex = filledItems.findIndex(
          (item) => item.product_id === scannedProduct._id
        );

        if (existingItemIndex > -1) {
          // Product exists - increment quantity
          const updatedItems = [...filledItems];
          const existingItem = updatedItems[existingItemIndex];
          const currentQty = parseFloat(existingItem.quantity) || 1;
          const newQty = String(currentQty + 1);
          existingItem.quantity = newQty;
          existingItem.subtotal = parseFloat(newQty) * parseFloat(existingItem.unit_price);
          console.log('Incremented existing product quantity to:', newQty);
          return updatedItems;
        } else {
          // New product - add it
          const newItem = {
            id: Date.now(),
            product_id: scannedProduct._id,
            product_name: scannedProduct.name,
            quantity: "1",
            unit_price: String(scannedProduct.selling_price || 0),
            subtotal: scannedProduct.selling_price || 0,
          };
          console.log('Added new product to items:', newItem);
          return [...filledItems, newItem];
        }
      });
    }
  }, [scannedProduct]);

  // Calculate subtotal for an item
  const calculateSubtotal = (qty, price) => {
    const q = parseFloat(qty) || 0;
    const p = parseFloat(price) || 0;
    return q * p;
  };

  // Update total whenever items change
  useEffect(() => {
    const total = items.reduce((sum, item) => sum + (item.subtotal || 0), 0);
    setTotalAmount(total);
  }, [items]);

  const handleAddItem = () => {
    // Only add new item if the last item has a product selected
    const lastItem = items[items.length - 1];
    if (!lastItem.product_id) {
      Alert.alert("Incomplete Item", "Please select a product for the current item first");
      return;
    }

    setItems([
      ...items,
      { id: Date.now(), product_id: "", product_name: "", quantity: "1", unit_price: "", subtotal: 0 },
    ]);
  };

  const openProductModal = (itemId) => {
    setCurrentItemId(itemId);
    setModalVisible(true);
  };

  const selectProduct = (product) => {
    if (!currentItemId) return;

    setItems((prevItems) => {
      return prevItems.map((item) => {
        if (item.id === currentItemId) {
          // Check if this product is already in the cart (excluding current item)
          const productExists = prevItems.some(
            (i) => i.product_id === product._id && i.id !== currentItemId
          );

          if (productExists) {
            // Find the existing item and increment its quantity
            const updatedItems = prevItems.map((existingItem) => {
              if (existingItem.product_id === product._id && existingItem.id !== currentItemId) {
                const newQty = String(parseFloat(existingItem.quantity) + parseFloat(item.quantity || 1));
                return {
                  ...existingItem,
                  quantity: newQty,
                  subtotal: parseFloat(newQty) * parseFloat(existingItem.unit_price),
                };
              }
              return existingItem;
            });
            // Remove the current item since we merged it
            return updatedItems.filter((i) => i.id !== currentItemId);
          } else {
            // New product - just update the current item
            const updated = {
              ...item,
              product_id: product._id,
              product_name: product.name,
              unit_price: String(product.selling_price || 0),
            };
            updated.subtotal = calculateSubtotal(updated.quantity, updated.unit_price);
            return updated;
          }
        }
        return item;
      });
    });

    setModalVisible(false);
    setCurrentItemId(null);
  };

  const handleRemoveItem = (id) => {
    if (items.length === 1) {
      Alert.alert("Cannot remove", "At least one item is required");
      return;
    }
    setItems(items.filter((item) => item.id !== id));
  };

  const handleItemChange = (id, field, value) => {
    setItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };

          // Auto-fill price when product is selected
          if (field === "product_id" && value) {
            const product = products.find((p) => p._id === value);
            if (product) {
              updated.unit_price = String(product.selling_price || 0);
            }
          }

          // Recalculate subtotal
          updated.subtotal = calculateSubtotal(updated.quantity, updated.unit_price);
          return updated;
        }
        return item;
      })
    );
  };

  const handleClear = () => {
    setItems([
      { id: Date.now(), product_id: "", product_name: "", quantity: "1", unit_price: "", subtotal: 0 },
    ]);
    setSelectedCustomer("");
    setCashPaid("");
    setECashPaid("");
  };

  const handleSave = () => {
    // Validation - filter out empty items first
    const filledItems = items.filter((item) => item.product_id);

    if (filledItems.length === 0) {
      Alert.alert("Validation Error", "Please add at least one item with a product");
      return;
    }

    // Validate filled items have all required details
    const invalidItems = filledItems.filter(
      (item) => !item.product_id || !item.quantity || !item.unit_price
    );
    if (invalidItems.length > 0) {
      Alert.alert("Validation Error", "Please fill in all item details (Product, Qty, Price)");
      return;
    }

    // Validate quantities are positive
    const invalidQty = filledItems.filter(
      (item) => parseFloat(item.quantity) <= 0
    );
    if (invalidQty.length > 0) {
      Alert.alert("Validation Error", "All quantities must be greater than 0");
      return;
    }

    // Validate prices are non-negative
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
      Alert.alert("Validation Error", "Paid amount must be equal to total amount. Pending payments are not allowed.");
      return;
    }

    // Prepare sale data with only filled items
    const saleData = {
      items: filledItems.map((item) => ({
        product_id: item.product_id,
        quantity: parseFloat(item.quantity),
        unit_price: parseFloat(item.unit_price),
        total_price: item.subtotal,
      })),
      customer_id: selectedCustomer || null,
      total_amount: totalAmount,
      paid_amount: paidAmount,
      cash_paid: cash,
      online_paid: eCash,
    };

    onSubmitSales(saleData);
  };

  const getProductName = (productId) => {
    const product = products.find((p) => p._id === productId);
    return product?.name || "Select Item";
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
      keyboardVerticalOffset={150}
    >
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text style={{ fontSize: 16, fontWeight: "600", marginBottom: 10 }}>Sales Entry</Text>

      {/* Shop and Customer Selection Row */}
      <View style={{ flexDirection: "row", gap: 10, marginBottom: 15 }}>
        {/* Shop Selection */}
        {shops && shops.length > 0 && (
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: "#666", marginBottom: 6 }}>
              Shop *
            </Text>
            <View style={{ ...global.input, padding: 0 }}>
              <Picker selectedValue={selectedShopForTx} onValueChange={setSelectedShopForTx}>
                {shops.map((s) => (
                  <Picker.Item key={s._id} label={s.name} value={s._id} />
                ))}
              </Picker>
            </View>
          </View>
        )}

        {/* Customer Selection (Optional) */}
        {customers && customers.length > 0 && (
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: "#666", marginBottom: 6 }}>
              Customer (Optional)
            </Text>
            <View style={{ ...global.input, padding: 0 }}>
              <Picker selectedValue={selectedCustomer} onValueChange={setSelectedCustomer}>
                <Picker.Item label="Walk-in" value="" />
                {customers.map((c) => (
                  <Picker.Item key={c._id} label={c.name} value={c._id} />
                ))}
              </Picker>
            </View>
          </View>
        )}
      </View>

      {/* Items Section */}
      <View style={{ marginBottom: 15 }}>
        <Text style={{ fontSize: 14, fontWeight: "600", color: "#333", marginBottom: 10 }}>
          Items
        </Text>

        <ScrollView style={{ maxHeight: 400 }}>
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
              {/* Item Selection */}
              <View style={{ marginBottom: 10 }}>
                <Text style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>
                  Item {index + 1} *
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
                  <Text style={{ fontSize: 14, color: item.product_name ? "#333" : "#999" }}>
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
                  <Text style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>Qty *</Text>
                  <TextInput
                    style={[global.input, { marginBottom: 0 }]}
                    placeholder="Qty"
                    value={item.quantity}
                    onChangeText={(value) => handleItemChange(item.id, "quantity", value)}
                    keyboardType="numeric"
                    maxLength={6}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>Price *</Text>
                  <TextInput
                    style={[global.input, { marginBottom: 0 }]}
                    placeholder="Price"
                    value={item.unit_price}
                    onChangeText={(value) => handleItemChange(item.id, "unit_price", value)}
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
                <Text style={{ fontSize: 14, fontWeight: "700", color: primaryColor }}>
                  Subtotal: ₹{item.subtotal.toFixed(2)}
                </Text>
                {items.length > 1 && (
                  <TouchableOpacity onPress={() => handleRemoveItem(item.id)}>
                    <MaterialIcons name="close" size={24} color="#e74c3c" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </ScrollView>

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
          <Text style={{ marginLeft: 6, fontSize: 14, fontWeight: "600", color: primaryColor }}>
            Add Item
          </Text>
        </TouchableOpacity>
      </View>

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
        <Text style={{ fontSize: 14, fontWeight: "600", marginBottom: 8, color: "#333" }}>
          Payment Details
        </Text>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, marginBottom: 5, color: "#666" }}>Cash</Text>
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
            <Text style={{ fontSize: 12, marginBottom: 5, color: "#666" }}>E-Cash</Text>
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
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
        <TouchableOpacity
          style={[
            global.button,
            { flex: 1, marginRight: 8, backgroundColor: "#666" },
            isSubmitting && { opacity: 0.6 },
          ]}
          onPress={handleClear}
          disabled={isSubmitting}
        >
          <Text style={global.btnText}>Clear</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[global.button, { flex: 1 }, isSubmitting && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={isSubmitting}
        >
          <Text style={global.btnText}>{isSubmitting ? "Saving..." : "Save"}</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={{
          paddingVertical: 12,
          paddingHorizontal: 16,
          borderWidth: 1.5,
          borderColor: primaryColor,
          borderRadius: 6,
          alignItems: "center",
        }}
        onPress={onCancel}
      >
        <Text style={{ fontSize: 15, fontWeight: "600", color: primaryColor }}>Cancel</Text>
      </TouchableOpacity>

        {/* Product Search Modal */}
        <ProductSearchModal
          visible={modalVisible}
          products={products}
          primaryColor={primaryColor}
          onClose={() => setModalVisible(false)}
          onSelectProduct={selectProduct}
        />

        {/* Floating Scanner Button */}
        {/* <TouchableOpacity
          style={{
            position: "absolute",
            bottom: 20,
            right: 20,
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor: primaryColor,
            justifyContent: "center",
            alignItems: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
            zIndex: 10,
          }}
          onPress={() => navigation.navigate("Scanner")}
        >
          <MaterialIcons name="qr-code-scanner" size={28} color="#fff" />
        </TouchableOpacity> */}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
