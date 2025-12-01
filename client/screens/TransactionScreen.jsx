import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { global, useThemeColors } from "../styles/global";
import { useNavigation } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";

const TRANSACTION_TYPES = [
  {
    id: "service",
    label: "Service",
  },
  {
    id: "sales",
    label: "Sales",
  },
  {
    id: "add_money",
    label: "Add Money",
  },
  {
    id: "add_expense",
    label: "Add Expense",
  },
  {
    id: "return_item",
    label: "Return Item",
  },
];

export default function TransactionScreen() {
  const navigation = useNavigation();
  const { primaryColor } = useThemeColors();
  const [selectedType, setSelectedType] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleTransactionTypeSelect = (type) => {
    setSelectedType(type);
    setShowDropdown(false);
    
    // Navigate to the respective screen based on type
    navigationMapping[type.id]();
  };

  const navigationMapping = {
    service: () => {
      navigation.navigate("Services");
    },
    sales: () => {
      Alert.alert("Sales", "Navigate to sales screen");
    },
    add_money: () => {
      Alert.alert("Add Money", "Add money transaction form");
    },
    add_expense: () => {
      Alert.alert("Add Expense", "Add expense transaction form");
    },
    return_item: () => {
      Alert.alert("Return Item", "Return item transaction form");
    },
  };

  const selectedLabel = selectedType?.label || "Select Transaction Type";

  return (
    <SafeAreaView style={global.safeArea}>

      <ScrollView
        style={global.container}
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >

        {/* Dropdown Section */}
        <View style={{ marginBottom: 20 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: "#333",
              marginBottom: 10,
            }}
          >
            Transaction Type *
          </Text>

          <TouchableOpacity
            style={{
              backgroundColor: "#fff",
              borderWidth: 1,
              borderColor: primaryColor,
              borderRadius: 8,
              paddingVertical: 12,
              paddingHorizontal: 14,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              elevation: 2,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
            }}
            onPress={() => setShowDropdown(!showDropdown)}
          >
            <Text
              style={{
                fontSize: 16,
                color: selectedType ? "#333" : "#999",
                fontWeight: "500",
              }}
            >
              {selectedLabel}
            </Text>
            <MaterialIcons
              name={showDropdown ? "expand-less" : "expand-more"}
              size={24}
              color={primaryColor}
            />
          </TouchableOpacity>

          {/* Dropdown Menu */}
          {showDropdown && (
            <View
              style={{
                backgroundColor: "#fff",
                borderWidth: 1,
                borderColor: primaryColor,
                borderTopWidth: 0,
                borderBottomLeftRadius: 8,
                borderBottomRightRadius: 8,
                marginTop: -1,
                elevation: 5,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.15,
                shadowRadius: 3,
              }}
            >
              <FlatList
                data={TRANSACTION_TYPES}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                renderItem={({ item, index }) => (
                  <TouchableOpacity
                    style={{
                      paddingVertical: 12,
                      paddingHorizontal: 14,
                      borderBottomWidth: index !== TRANSACTION_TYPES.length - 1 ? 1 : 0,
                      borderBottomColor: "#f0f0f0",
                      backgroundColor:
                        selectedType?.id === item.id ? "#f5f5f5" : "#fff",
                    }}
                    onPress={() => handleTransactionTypeSelect(item)}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      {selectedType?.id === item.id && (
                        <MaterialIcons
                          name="check"
                          size={20}
                          color={primaryColor}
                          style={{ marginRight: 10 }}
                        />
                      )}
                      <Text
                        style={{
                          fontSize: 15,
                          color: selectedType?.id === item.id ? primaryColor : "#333",
                          fontWeight: selectedType?.id === item.id ? "600" : "500",
                        }}
                      >
                        {item.label}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
              />
            </View>
          )}
        </View>

        {/* Info Section */}
        {selectedType && (
          <View
            style={{
              marginTop: 24,
              padding: 16,
              backgroundColor: "#F0F4FF",
              borderRadius: 12,
              borderLeftWidth: 4,
              borderLeftColor: primaryColor,
            }}
          >
            <View style={{ flexDirection: "row", marginBottom: 8 }}>
              <MaterialIcons name="check-circle" size={20} color={primaryColor} />
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: primaryColor,
                  marginLeft: 8,
                }}
              >
                Selected
              </Text>
            </View>
            <Text style={{ fontSize: 13, color: "#555", lineHeight: 18 }}>
              You have selected <Text style={{ fontWeight: "600" }}>{selectedType.label}</Text>. 
              Click on the dropdown to select a different transaction type.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
