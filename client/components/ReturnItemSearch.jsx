import React from "react";
import { View, Text, TextInput, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { global } from "../styles/global";

export default function ReturnItemSearch({
  primaryColor,
  returnSearchQuery,
  setReturnSearchQuery,
  salesStatus,
  filteredReturnItems,
  onSelectReturnItem,
}) {
  return (
    <View style={{ marginTop: 20 }}>
      <Text
        style={{
          fontSize: 16,
          fontWeight: "600",
          color: "#333",
          marginBottom: 10,
        }}
      >
        Find an Item to Return
      </Text>
      <TextInput
        style={global.input}
        placeholder="Search by product, customer or sale name..."
        value={returnSearchQuery}
        onChangeText={setReturnSearchQuery}
        returnKeyType="search"
      />

      {salesStatus === "loading" ? (
        <ActivityIndicator size="large" color={primaryColor} style={{ marginTop: 20 }} />
      ) : filteredReturnItems.length > 0 ? (
        <FlatList
          data={filteredReturnItems}
          keyExtractor={(item) => item.key}
          scrollEnabled={false}
          style={{ marginTop: 10 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={{
                padding: 12,
                borderBottomWidth: 1,
                borderBottomColor: "#eee",
                backgroundColor: "#fff",
                marginBottom: 8,
                borderRadius: 6,
              }}
              onPress={() => onSelectReturnItem(item)}
            >
              <Text style={{ fontSize: 15, fontWeight: "600" }}>
                {item.productName}
              </Text>
              <Text style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
                Sold Qty: {item.quantity} @ ₹{item.unitPrice}
              </Text>
              <Text style={{ fontSize: 12, color: "#666", marginTop: 2 }}>
                Customer: {item.customerName}
              </Text>
              <Text style={{ fontSize: 12, color: "#999", marginTop: 2 }}>
                Sale: {item.saleName} {item.shopName ? `• ${item.shopName}` : ""}
              </Text>
            </TouchableOpacity>
          )}
        />
      ) : returnSearchQuery ? (
        <Text style={{ textAlign: "center", color: "#999", marginTop: 20 }}>
          No matching items found.
        </Text>
      ) : (
        <Text style={{ textAlign: "center", color: "#999", marginTop: 20 }}>
          Start typing to search returnable items.
        </Text>
      )}
    </View>
  );
}
