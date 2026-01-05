import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { MaterialIcons } from "@expo/vector-icons";
import { useThemeColors, useThemedStyles } from "../styles/global";
import {
  addCartRow,
  clearCart,
  removeCartItem,
  selectCartItems,
  selectCartTotals,
  updateCartItem,
} from "../store/slices/salesItemsSlice";
import { setCurrentItemId } from "../store/slices/salesFormSlice";
import { showToast } from "../store/slices/toastSlice";

import { Alert } from "react-native";
// Helper for subtotal calculation
const calculateSubtotal = (qty, price) => {
  const q = parseFloat(qty) || 0;
  const p = parseFloat(price) || 0;
  return q * p;
};

const AddSalesFormItems = () => {
  const themedStyles = useThemedStyles();
  const { primaryColor, textSecondary, textColor, cardBg } = useThemeColors();
  const products = useSelector((state) => state.products.items);
  const dispatch = useDispatch();
  const items = useSelector(selectCartItems);
  const addCartRowError = useSelector((state) => state.salesItems.addCartRowError);

  // Local modalVisible state
  const [modalVisible, setModalVisible] = useState(false);

  const openProductModal = (itemId) => {
    dispatch(setCurrentItemId(itemId));
    setModalVisible(true);
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
      unit_price: field === "product_id" ? nextUnitPrice : value,
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

  return (
    <View style={{...themedStyles.container, padding:12 }}>
      {items.map((item, index) => (
        <View
          key={item.id}
          style={{
            ...themedStyles.cardBg2,
          }}
        >
          {/* Item Selection */}
          <View style={{ marginBottom: 10 }}>
            <Text style={{ fontSize: 12, color: textColor, marginBottom: 4 }}>
              Item {index + 1} *
            </Text>
            <TouchableOpacity
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                ...themedStyles.input,
              }}
              onPress={() => openProductModal(item.id)}
            >
              <Text
                style={{
                  fontSize: 14,
                  color: item.product_name ? primaryColor : "#999",
                }}
              >
                {item.product_name || "Select Item"}
              </Text>
              <MaterialIcons name="search" size={20} color={textColor} />
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
              <Text style={{ fontSize: 12, color: textColor, marginBottom: 4 }}>
                Qty *
              </Text>
              <TextInput
                style={[themedStyles.input, { marginBottom: 0 }]}
                placeholderTextColor={textSecondary}
                value={item.quantity}
                onChangeText={(value) =>
                  handleItemChange(item.id, "quantity", value)
                }
                keyboardType="numeric"
                maxLength={6}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, color: textColor, marginBottom: 4 }}>
                Price *
              </Text>
              <TextInput
                style={[themedStyles.input, { marginBottom: 0 }]}
                placeholderTextColor={textSecondary}
                value={item.unit_price}
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
              <TouchableOpacity onPress={() => handleRemoveItem(item.id)}>
                <MaterialIcons name="close" size={24} color="#e74c3c" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      ))}

      {/* Add Item Button at the bottom */}
      <TouchableOpacity
        style={{
            ...themedStyles.button1,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 1.5,
          borderColor: primaryColor,
          borderRadius: 8,
          borderStyle: "dashed",
          backgroundColor: cardBg + "22",
        }}
        onPress={() => {
          dispatch(addCartRow());
          setTimeout(() => {
            const error = addCartRowError || (typeof window !== 'undefined' && window.store && window.store.getState().salesItems.addCartRowError);
            if (error) {
              dispatch(showToast({ message: error, type: 'error' }));
            }
          }, 100);
        }}
      >
        <MaterialIcons name="add" size={20} color={primaryColor} />
        <Text
          style={{
            marginLeft: 6,
            fontSize: 16,
            fontWeight: "600",
            color: primaryColor,
          }}
        >
          Add Item
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default AddSalesFormItems;
