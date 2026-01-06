import React from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { global } from "../styles/global";

export default function ServicePaymentForm({
  primaryColor,
  selectedService,
  paidInCash,
  setPaidInCash,
  paidInEcash,
  setPaidInEcash,
  transactionDate,
  setTransactionDate,
  isSubmitting,
  onSubmit,
  onSearchAgain,
  previewRemaining,
  previewTotalPaid,
}) {
  return (
    <View>
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
        <Text style={{ fontSize: 15, fontWeight: "600", marginBottom: 8 }}>
          {selectedService.name}
        </Text>
        <Text style={{ fontSize: 13, color: "#666", marginBottom: 6 }}>
          Customer: {selectedService.customer_id?.name || "N/A"}
        </Text>
        <Text style={{ fontSize: 13, color: "#666", marginBottom: 6 }}>
          Total Amount: ₹{selectedService.total_amount}
        </Text>
        <Text style={{ fontSize: 13, color: "#666", marginBottom: 6 }}>
          Current Balance: ₹{selectedService.balance}
        </Text>
        {previewTotalPaid > 0 && (
          <Text style={{ fontSize: 14, fontWeight: "600", color: primaryColor }}>
            Remaining After Payment: ₹{previewRemaining.toFixed(2)}
          </Text>
        )}
      </View>

      <Text style={{ fontSize: 14, fontWeight: "600", marginBottom: 10 }}>
        Add Payment
      </Text>
      <TextInput
        style={global.input}
        placeholder="Paid in Cash"
        value={paidInCash}
        onChangeText={setPaidInCash}
        keyboardType="numeric"
        returnKeyType="next"
        maxLength={10}
      />
      <TextInput
        style={global.input}
        placeholder="Paid in E-Cash"
        value={paidInEcash}
        onChangeText={setPaidInEcash}
        keyboardType="numeric"
        returnKeyType="next"
        maxLength={10}
      />
      <TextInput
        style={global.input}
        placeholder="Transaction Date (YYYY-MM-DD)"
        value={transactionDate}
        onChangeText={setTransactionDate}
        returnKeyType="done"
        maxLength={10}
      />

      <TouchableOpacity
        style={[global.button, isSubmitting && { opacity: 0.6 }]}
        onPress={onSubmit}
        disabled={isSubmitting}
      >
        <Text style={global.btnText}>
          {isSubmitting ? "Submitting..." : "Submit Payment"}
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
        onPress={onSearchAgain}
      >
        <Text
          style={{
            fontSize: 15,
            fontWeight: "600",
            color: primaryColor,
          }}
        >
          Search Again
        </Text>
      </TouchableOpacity>
    </View>
  );
}
