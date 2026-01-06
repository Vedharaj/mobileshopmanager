import React from "react";
import { View, Text, TextInput, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { global } from "../styles/global";

export default function ServiceSearch({
  primaryColor,
  searchQuery,
  setSearchQuery,
  servicesStatus,
  filteredServices,
  onSelectService,
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
        Find a Service
      </Text>
      <TextInput
        style={global.input}
        placeholder="Search by service or customer name..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        returnKeyType="search"
      />

      {servicesStatus === "loading" ? (
        <ActivityIndicator size="large" color={primaryColor} style={{ marginTop: 20 }} />
      ) : filteredServices.length > 0 ? (
        <FlatList
          data={filteredServices}
          keyExtractor={(item, index) => (item._id ? item._id.toString() : `service-${index}`)}
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
              onPress={() => onSelectService(item)}
            >
              <Text style={{ fontSize: 15, fontWeight: "500" }}>{item.name}</Text>
              <Text style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
                Customer: {item.customer_id?.name || "N/A"} | Balance: ₹{item.balance}
              </Text>
              <Text style={{ fontSize: 12, color: "#999", marginTop: 2 }}>
                Status: {item.status}
              </Text>
            </TouchableOpacity>
          )}
        />
      ) : searchQuery ? (
        <Text style={{ textAlign: "center", color: "#999", marginTop: 20 }}>
          No services found.
        </Text>
      ) : (
        <Text style={{ textAlign: "center", color: "#999", marginTop: 20 }}>
          Start typing to search for services.
        </Text>
      )}
    </View>
  );
}
