import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Alert,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { global, useThemeColors } from "../styles/global";
import { useNavigation } from "@react-navigation/native";
import { Picker } from "@react-native-picker/picker";
import { MaterialIcons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { fetchServices, updateService } from "../store/slices/serviceSlice";
import { createSale, fetchSales } from "../store/slices/salesSlice";
import { showToast } from "../store/slices/toastSlice";

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
  const dispatch = useDispatch();

  const { services, status: servicesStatus } = useSelector(
    (state) => state.services
  );
  const { shops } = useSelector((state) => state.shops);
  const { user } = useSelector((state) => state.auth);

  const [selectedType, setSelectedType] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedService, setSelectedService] = useState(null);
  const [paidInCash, setPaidInCash] = useState("");
  const [paidInEcash, setPaidInEcash] = useState("");
  const [transactionDate, setTransactionDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txTitle, setTxTitle] = useState("");
  const [txDescription, setTxDescription] = useState("");
  const [selectedShopForTx, setSelectedShopForTx] = useState("");
  const [selectedTransactionType, setSelectedTransactionType] = useState(null);

  useEffect(() => {
    if (selectedType?.id === "service") {
      dispatch(fetchServices());
    }
    // default shop for non-service transactions
    if (shops && shops.length > 0 && !selectedShopForTx) {
      const defaultShop = shops[0]._id || shops[0];
      setSelectedShopForTx(defaultShop);
    }
  }, [selectedType, dispatch, shops, selectedShopForTx]);

  const activeServices = useMemo(() => {
    if (!services) return [];
    return services.filter(
      (s) => s.status === "pending" || s.status === "in_progress"
    );
  }, [services]);

  const filteredServices = useMemo(() => {
    if (!searchQuery) return activeServices;
    const query = searchQuery.toLowerCase();
    return activeServices.filter(
      (s) =>
        s.name.toLowerCase().includes(query) ||
        s.customer_id?.name.toLowerCase().includes(query)
    );
  }, [searchQuery, activeServices]);

  const handleTransactionTypeSelect = (type) => {
    setSelectedType(type);
    setShowDropdown(false);
    setSelectedService(null);
    setSearchQuery("");
    setPaidInCash("");
    setPaidInEcash("");
    // for non-service types we'll render a local form below
  };

  const handleSubmitOther = async () => {
    // Handles add_money and add_expense
    if (!txTitle.trim()) {
      dispatch(showToast({ message: "Please enter a title", type: "error" }));
      return;
    }

    const cash = parseFloat(paidInCash) || 0;
    const ecash = parseFloat(paidInEcash) || 0;
    const totalPaid = cash + ecash;

    if (totalPaid <= 0) {
      dispatch(showToast({ message: "Please enter a positive amount", type: "error" }));
      return;
    }

    if (!selectedShopForTx) {
      dispatch(showToast({ message: "Please select a shop", type: "error" }));
      return;
    }

    setIsSubmitting(true);
    try {
      // For split payments, create separate sale entries so cash/e-cash counts correctly
      const common = {
        shop_id: selectedShopForTx,
        user_id: user?._id,
        customer_id: null,
        service_id: null,
        name: txTitle,
        type: selectedType?.id,
        order_date: new Date().toISOString(),
        total_amount: totalPaid,
        balance: 0,
        status: 'completed',
        notes: txDescription || txTitle,
        items: [],
      };

      // Determine whether this is an expense
      const isExpense = selectedType?.id === 'add_expense';

      if (cash > 0) {
        await dispatch(createSale({
          ...common,
          paid_amount: cash,
          cash_paid: cash,
          online_paid: 0,
          payment_method: isExpense ? 'expense' : 'cash',
        })).unwrap();
      }

      if (ecash > 0) {
        await dispatch(createSale({
          ...common,
          paid_amount: ecash,
          cash_paid: 0,
          online_paid: ecash,
          payment_method: isExpense ? 'expense' : 'upi',
        })).unwrap();
      }

      // Refresh sales (and services just in case)
      await dispatch(fetchSales());
      await dispatch(fetchServices());

      dispatch(showToast({ message: isExpense ? 'Expense recorded' : 'Amount added', type: 'success' }));

      // reset
      setTxTitle('');
      setTxDescription('');
      setPaidInCash('');
      setPaidInEcash('');
      setSelectedType(null);

      // Navigate to Home after successful submit
      navigation.navigate("Home");
    } catch (err) {
      console.error('Submit transaction error:', err);
      dispatch(showToast({ message: 'Failed to submit transaction', type: 'error' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectService = (service) => {
    setSelectedService(service);
    setSearchQuery("");
  };

  const handleSearchAgain = () => {
    setSelectedService(null);
    setSearchQuery("");
    setPaidInCash("");
    setPaidInEcash("");
  };

  const handleSubmit = async () => {
    if (!selectedService) {
      dispatch(showToast({ message: "Please select a service", type: "error" }));
      return;
    }

    if (!paidInCash.trim() && !paidInEcash.trim()) {
      dispatch(showToast({ message: "Please enter cash or e-cash amount", type: "error" }));
      return;
    }

    if (!transactionDate.trim()) {
      dispatch(showToast({ message: "Please enter transaction date", type: "error" }));
      return;
    }

    const cash = parseFloat(paidInCash) || 0;
    const ecash = parseFloat(paidInEcash) || 0;
    const totalPaid = cash + ecash;

    if (isNaN(cash) || isNaN(ecash)) {
      dispatch(showToast({ message: "Please enter valid amounts", type: "error" }));
      return;
    }

    if (totalPaid <= 0) {
      dispatch(showToast({ message: "Total paid amount must be greater than 0", type: "error" }));
      return;
    }

    if (totalPaid > selectedService.balance) {
      dispatch(
        showToast({
          message: `Paid amount cannot exceed balance of ₹${selectedService.balance}`,
          type: "error",
        })
      );
      return;
    }

    // Safety: ensure related relations exist before submitting
    if (!selectedService?.shop_id?._id) {
      dispatch(showToast({ message: "This service has no shop assigned", type: "error" }));
      return;
    }

    setIsSubmitting(true);
    try {
      // Convert date to proper format - ensure it's a valid date
      const dateParts = transactionDate.split("-");
      const orderDate = new Date(`${dateParts[0]}-${dateParts[1]}-${dateParts[2]}T00:00:00Z`);
      
      if (isNaN(orderDate.getTime())) {
        dispatch(showToast({ message: "Invalid date format. Use YYYY-MM-DD", type: "error" }));
        setIsSubmitting(false);
        return;
      }

      // 1. Create a new sale
      const saleResponse = await dispatch(
        createSale({
          shop_id: selectedService?.shop_id?._id,
          user_id: user?._id,
          customer_id: selectedService?.customer_id?._id,
          service_id: selectedService?._id,
          name: selectedService?.name,
          type: 'service',
          order_date: orderDate.toISOString(),
          total_amount: selectedService?.total_amount,
          paid_amount: totalPaid,
          cash_paid: cash,
          online_paid: ecash,
          balance: selectedService ? selectedService.balance - totalPaid : 0,
          payment_method: cash > 0 && ecash > 0 ? "multiple" : cash > 0 ? "cash" : "ecash",
          status: "completed",
          notes: `Payment for service: ${selectedService?.name}`,
          items: []
        })
      ).unwrap();

      // 2. Update the service balance
      const newBalance = selectedService ? selectedService.balance - totalPaid : 0;
      // console.log("Updating service balance from", selectedService?.balance, "to", newBalance);
      
      await dispatch(
        updateService({
          serviceId: selectedService?._id,
          serviceData: {
            name: selectedService?.name,
            balance: newBalance,
          },
        })
      ).unwrap();

      // 3. Fetch latest sales and services (to sync balance updates)
      // console.log("Fetching sales and services after payment");
      const salesResult = await dispatch(fetchSales());
      const servicesResult = await dispatch(fetchServices());
      
      // console.log("Services after fetch:", servicesResult.payload?.[0]?.balance || "No services");

      // 4. Show success and reset form
      dispatch(
        showToast({ message: "Payment submitted successfully!", type: "success" })
      );

      // Reset form state
      setSelectedService(null);
      setSearchQuery("");
      setPaidInCash("");
      setPaidInEcash("");
      setTransactionDate(new Date().toISOString().split("T")[0]);
      setSelectedType(null);

      // Navigate to Home after 1.5 seconds
      setTimeout(() => {
        navigation.navigate("Home");
      }, 1500);
    } catch (err) {
      console.error("Payment submission error:", err);
      const errorMessage = 
        err?.payload?.msg || 
        err?.payload?.message || 
        err?.message || 
        "Failed to submit payment";
      
      dispatch(
        showToast({
          message: errorMessage,
          type: "error",
        })
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Live computed values for previewing remaining balance
  const cashAmount = parseFloat(paidInCash) || 0;
  const ecashAmount = parseFloat(paidInEcash) || 0;
  const previewTotalPaid = cashAmount + ecashAmount;
  const previewRemaining = selectedService
    ? Math.max(0, selectedService.balance - previewTotalPaid)
    : 0;

  const navigationMapping = {
    service: () => {},
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
        keyboardShouldPersistTaps="handled"
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

        {/* Service Search Section */}
        {selectedType?.id === "service" && !selectedService && (
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

            {/* Service Results List */}
            {servicesStatus === "loading" ? (
              <ActivityIndicator
                size="large"
                color={primaryColor}
                style={{ marginTop: 20 }}
              />
            ) : filteredServices.length > 0 ? (
              <FlatList
                data={filteredServices}
                keyExtractor={(item, index) => item._id ? item._id.toString() : `service-${index}`}
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
                    onPress={() => handleSelectService(item)}
                  >
                    <Text style={{ fontSize: 15, fontWeight: "500" }}>
                      {item.name}
                    </Text>
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
        )}

        {/* Add Money / Add Expense Form */}
        {selectedType?.id && (selectedType.id === 'add_money' || selectedType.id === 'add_expense') && (
          <View style={{ marginTop: 20 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 10 }}>{selectedType.label}</Text>

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
                <Picker
                  selectedValue={selectedShopForTx}
                  onValueChange={(val) => setSelectedShopForTx(val)}
                >
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
              onPress={handleSubmitOther}
              disabled={isSubmitting}
            >
              <Text style={global.btnText}>{isSubmitting ? 'Submitting...' : (selectedType.id === 'add_expense' ? 'Add Expense' : 'Add Money')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ marginTop: 10, paddingVertical: 12, paddingHorizontal: 16, borderWidth: 1.5, borderColor: primaryColor, borderRadius: 6, alignItems: 'center' }}
              onPress={() => {
                setSelectedType(null);
                setSelectedTransactionType(null);
                setTxTitle('');
                setTxDescription('');
                setPaidInCash('');
                setPaidInEcash('');
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: '600', color: primaryColor }}>{'Cancel'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Service Details & Payment Form */}
        {selectedType?.id === "service" && selectedService && (
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
              onPress={handleSubmit}
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
              onPress={handleSearchAgain}
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
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
