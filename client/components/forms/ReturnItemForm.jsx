import React from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { global, useThemeColors } from "../../styles/global";

export default function ReturnItemForm({
  primaryColor,
  selectedReturnItem,
  returnQty,
  setReturnQty,
  paidInCash,
  setPaidInCash,
  paidInEcash,
  setPaidInEcash,
  subtractReturn,
  setSubtractReturn,
  previewReturnTotal,
  isSubmitting,
  onSubmitReturn,
  onCancel,
}) {
  const { textSecondary } = useThemeColors();
  
  return (
    <View style={{ marginTop: 20 }}>
      <View
        style={{
          padding: 14,
          backgroundColor: "#f0f9ff",
          borderLeftWidth: 4,
          borderLeftColor: primaryColor,
          borderRadius: 6,
          marginBottom: 16,
        }}
      >
        <Text style={{ fontSize: 15, fontWeight: "700", marginBottom: 4 }}>
          {selectedReturnItem.productName}
        </Text>
        <Text style={{ fontSize: 13, color: "#666", marginBottom: 4 }}>
          Sold Qty: {selectedReturnItem.quantity} @ ₹{selectedReturnItem.unitPrice}
        </Text>
        <Text style={{ fontSize: 13, color: "#666", marginBottom: 4 }}>
          Customer: {selectedReturnItem.customerName}
        </Text>
        <Text style={{ fontSize: 13, color: "#666", marginBottom: 4 }}>
          Sale: {selectedReturnItem.saleName}
          {selectedReturnItem.shopName ? ` • ${selectedReturnItem.shopName}` : ""}
        </Text>
        {previewReturnTotal > 0 && (
          <Text style={{ fontSize: 14, fontWeight: "700", color: primaryColor }}>
            Estimated Refund: ₹{previewReturnTotal.toFixed(2)}
          </Text>
        )}
      </View>

      <TextInput
        style={global.input}
        placeholder="Quantity to return"
        placeholderTextColor={textSecondary}
        value={returnQty}
        onChangeText={setReturnQty}
        keyboardType="numeric"
        maxLength={8}
      />

      <TextInput
        style={global.input}
        placeholder="Cash to refund"
        placeholderTextColor={textSecondary}
        value={paidInCash}
        onChangeText={setPaidInCash}
        keyboardType="numeric"
        maxLength={10}
      />

      <TextInput
        style={global.input}
        placeholder="E-Cash to refund"
        placeholderTextColor={textSecondary}
        value={paidInEcash}
        onChangeText={setPaidInEcash}
        keyboardType="numeric"
        maxLength={10}
      />

      <TouchableOpacity
        onPress={() => setSubtractReturn(!subtractReturn)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: 10,
          paddingHorizontal: 4,
        }}
      >
        <MaterialIcons
          name={subtractReturn ? "check-box" : "check-box-outline-blank"}
          size={22}
          color={primaryColor}
        />
        <Text style={{ marginLeft: 10, fontSize: 14, color: "#333" }}>
          Apply deduction
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[global.button, isSubmitting && { opacity: 0.6 }]}
        onPress={onSubmitReturn}
        disabled={isSubmitting}
      >
        <Text style={global.btnText}>
          {isSubmitting ? "Submitting..." : "Submit Return"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{
          marginTop: 10,
          paddingVertical: 12,
          paddingHorizontal: 16,
          borderWidth: 1.5,
          borderColor: primaryColor,
          borderRadius: 6,
          alignItems: "center",
        }}
        onPress={onCancel}
      >
        <Text
          style={{
            fontSize: 15,
            fontWeight: "600",
            color: primaryColor,
          }}
        >
          Cancel
        </Text>
      </TouchableOpacity>
    </View>
  );
}
