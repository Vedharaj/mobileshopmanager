import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Modal, FlatList } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

export default function ProductSearchModal({
  visible,
  products = [],
  primaryColor,
  onClose,
  onSelectProduct,
}) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProducts = products.filter((p) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(query) ||
      p.category_id?.name?.toLowerCase().includes(query) ||
      p.barcode?.toLowerCase().includes(query)
    );
  });

  const handleClose = () => {
    setSearchQuery("");
    onClose();
  };

  const handleSelectProduct = (product) => {
    setSearchQuery("");
    onSelectProduct(product);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.5)",
          justifyContent: "flex-end",
        }}
      >
        <View
          style={{
            backgroundColor: "#fff",
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            maxHeight: "80%",
            paddingTop: 20,
            paddingHorizontal: 16,
          }}
        >
          {/* Modal Header */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 15,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "700", color: "#333" }}>
              Select Product
            </Text>
            <TouchableOpacity onPress={handleClose}>
              <MaterialIcons name="close" size={28} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Search Input */}
          <TextInput
            style={{
              borderWidth: 1,
              borderColor: "#ddd",
              borderRadius: 8,
              padding: 12,
              fontSize: 14,
              marginBottom: 15,
              backgroundColor: "#f9f9f9",
            }}
            placeholder="Search by name, category, or barcode..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />

          {/* Product List */}
          <FlatList
            data={filteredProducts}
            keyExtractor={(product) => product._id}
            renderItem={({ item: product }) => (
              <TouchableOpacity
                style={{
                  padding: 14,
                  borderBottomWidth: 1,
                  borderBottomColor: "#eee",
                  backgroundColor: "#fff",
                }}
                onPress={() => handleSelectProduct(product)}
              >
                <Text style={{ fontSize: 15, fontWeight: "600", color: "#333" }}>
                  {product.name}
                </Text>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 4 }}>
                  <Text style={{ fontSize: 12, color: "#666" }}>
                    {product.category_id?.name || "No category"}
                  </Text>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: primaryColor }}>
                    ₹{product.selling_price || 0}
                  </Text>
                </View>
                {product.barcode && (
                  <Text style={{ fontSize: 11, color: "#999", marginTop: 2 }}>
                    {product.barcode}
                  </Text>
                )}
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={{ textAlign: "center", color: "#999", marginTop: 20 }}>
                No products found
              </Text>
            }
          />
        </View>
      </View>
    </Modal>
  );
}
