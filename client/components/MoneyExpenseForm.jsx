import React from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { global } from "../styles/global";

export default function MoneyExpenseForm({
  primaryColor,
  selectedType,
  txTitle,
  setTxTitle,
  txDescription,
  setTxDescription,
  shops,
  selectedShopForTx,
  setSelectedShopForTx,
  paidInCash,
  setPaidInCash,
  paidInEcash,
  setPaidInEcash,
  isSubmitting,
  onSubmitOther,
  onCancel,
}) {
  return (
    <View style={{ marginTop: 20 }}>
      <Text style={{ fontSize: 16, fontWeight: "600", marginBottom: 10 }}>
        {selectedType.label}
      </Text>

      <TextInput
        style={global.input}
        placeholder="Title *"
        value={txTitle}
        onChangeText={setTxTitle}
      />

      <TextInput
        style={global.input}
        placeholder="Description"
        value={txDescription}
        onChangeText={setTxDescription}
        multiline
      />

      {shops && shops.length > 0 && (
        <View style={{ ...global.input, padding: 0 }}>
          <Picker selectedValue={selectedShopForTx} onValueChange={setSelectedShopForTx}>
            {shops.map((s) => (
              <Picker.Item key={s._id} label={s.name} value={s._id} />
            ))}
          </Picker>
        </View>
      )}

      <TextInput
        style={global.input}
        placeholder="Amount in Cash"
        value={paidInCash}
        onChangeText={setPaidInCash}
        keyboardType="numeric"
        maxLength={10}
      />

      <TextInput
        style={global.input}
        placeholder="Amount in E-Cash"
        value={paidInEcash}
        onChangeText={setPaidInEcash}
        keyboardType="numeric"
        maxLength={10}
      />

      <TouchableOpacity
        style={[global.button, isSubmitting && { opacity: 0.6 }]}
        onPress={onSubmitOther}
        disabled={isSubmitting}
      >
        <Text style={global.btnText}>
          {isSubmitting
            ? "Submitting..."
            : selectedType.id === "add_expense"
            ? "Add Expense"
            : "Add Money"}
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
        <Text style={{ fontSize: 15, fontWeight: "600", color: primaryColor }}>
          Cancel
        </Text>
      </TouchableOpacity>
    </View>
  );
}
