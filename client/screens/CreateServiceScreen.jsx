import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Keyboard,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { global, useThemeColors, useThemedStyles } from "../styles/global";
import { useDispatch, useSelector } from "react-redux";
import { createService, updateService } from "../store/slices/serviceSlice";
import { createCustomer } from "../store/slices/customerSlice";
import { createSale, updateSale, fetchSales } from "../store/slices/salesSlice";
import { showToast } from "../store/slices/toastSlice";

const ServiceForm = ({ onClose, onSuccess, service: initialService = null }) => {
  
  const dispatch = useDispatch();
  const shops = useSelector((state) => state.shops?.shops || []);
  const customers = useSelector((state) => state.customers?.customers || []);
  const userid = useSelector((state) => state.auth?.userid || "");
  const role = useSelector((state) => state.auth?.role || "");
  const user = useSelector((state) => state.auth?.user || {});

  const themedStyles = useThemedStyles();
  const { cardBg, textSecondary, primaryColor, textColor, isDarkMode } = useThemeColors();

  const [showReceivedPicker, setShowReceivedPicker] = useState(false);
  const [showReturnPicker, setShowReturnPicker] = useState(false);

  const staffShops = user?.shops || [];

  const formatDate = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getCurrentDate = () => formatDate(new Date());

  const isValidDate = (dateString) => {
    if (!dateString) return false;
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
  };

  const [serviceName, setServiceName] = useState(initialService?.name || "");
  const [productName, setProductName] = useState(initialService?.product_name || "");
  const [description, setDescription] = useState(initialService?.description || "");
  const [totalAmount, setTotalAmount] = useState(initialService ? (initialService.total_amount?.toString() || "") : "");
  const [statusValue, setStatusValue] = useState(initialService?.status || "pending");
  const [selectedShopId, setSelectedShopId] = useState(initialService?.shop_id?._id || initialService?.shop_id || "");
  const [selectedCustomerId, setSelectedCustomerId] = useState(initialService?.customer_id?._id || initialService?.customer_id || "");
  const [receivedDate, setReceivedDate] = useState(initialService?.received_date ? formatDate(new Date(initialService.received_date)) : getCurrentDate());
  const [returnDate, setReturnDate] = useState(initialService?.return_date ? formatDate(new Date(initialService.return_date)) : getCurrentDate());
  const [note, setNote] = useState(initialService?.note || "");
  const [showCreateCustomer, setShowCreateCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhoneNo, setNewCustomerPhoneNo] = useState("");
  const [newCustomerAddress, setNewCustomerAddress] = useState("");
  const [isAddingService, setIsAddingService] = useState(false);
  const [amountInCash, setAmountInCash] = useState(initialService?.amount_in_cash?.toString() || "");
  const [amountInEcash, setAmountInEcash] = useState(initialService?.amount_in_ecash?.toString() || "");

  useEffect(() => {
    if (role === "staff" && staffShops.length === 1) {
      const staffShopId = staffShops[0]?._id || staffShops[0];
      setSelectedShopId(staffShopId);
    } else if (shops.length > 0) {
      setSelectedShopId(shops[0]._id);
    }
  }, [role, staffShops, shops]);

  const handleCreateCustomer = async () => {
    if (!newCustomerName) {
      dispatch(
        showToast({
          message: "Please enter customer name",
          type: "error",
        })
      );
      return;
    }

    try {
      const result = await dispatch(
        createCustomer({
          name: newCustomerName,
          phone_no: newCustomerPhoneNo,
          address: newCustomerAddress,
        })
      ).unwrap();

      dispatch(
        showToast({
          message: "Customer created successfully!",
          type: "success",
        })
      );

      const newCustomer = result?.find((customer) => customer.name === newCustomerName);

      if (newCustomer) {
        setSelectedCustomerId(newCustomer._id);
      }

      setNewCustomerName("");
      setNewCustomerPhoneNo("");
      setNewCustomerAddress("");
      setShowCreateCustomer(false);
    } catch (err) {
      dispatch(
        showToast({
          message: err || "Failed to create customer",
          type: "error",
        })
      );
    }
  };

  const handleAddService = async () => {
    // Common validations
    if (!serviceName) {
      dispatch(showToast({ message: "Please enter service name", type: "error" }));
      return;
    }

    if (!productName) {
      dispatch(showToast({ message: "Please enter product name", type: "error" }));
      return;
    }

    if (!selectedShopId) {
      dispatch(showToast({ message: "Please select a shop", type: "error" }));
      return;
    }

    if (!totalAmount || isNaN(totalAmount) || parseFloat(totalAmount) <= 0) {
      dispatch(showToast({ message: "Please enter a valid total amount (greater than 0)", type: "error" }));
      return;
    }

    if (!receivedDate || !isValidDate(receivedDate)) {
      dispatch(showToast({ message: "Please enter a valid received date (YYYY-MM-DD)", type: "error" }));
      return;
    }

    if (!returnDate || !isValidDate(returnDate)) {
      dispatch(showToast({ message: "Please enter a valid return date (YYYY-MM-DD)", type: "error" }));
      return;
    }

    const total = parseFloat(totalAmount) || 0;
    const cashAmount = parseFloat(amountInCash) || 0;
    const ecashAmount = parseFloat(amountInEcash) || 0;
    const totalPaid = cashAmount + ecashAmount;
    if (cashAmount < 0 || ecashAmount < 0) {
      dispatch(showToast({ message: "Amounts in Cash and E-Cash cannot be negative.", type: "error" }));
      return;
    }
    if (totalPaid > total) {
      dispatch(showToast({ message: "Paid amount cannot exceed total amount.", type: "error" }));
      return;
    }
    const balance = total - totalPaid;

    setIsAddingService(true);
    try {
      if (initialService && initialService._id) {
        // Update existing
        await dispatch(updateService({ serviceId: initialService._id, serviceData: {
          name: serviceName,
          product_name: productName,
          description,
          total_amount: total,
          amount_in_cash: cashAmount,
          amount_in_ecash: ecashAmount,
          balance: balance,
          status: statusValue,
          shop_id: selectedShopId,
          user_id: userid,
          customer_id: selectedCustomerId || null,
          received_date: receivedDate || getCurrentDate(),
          return_date: returnDate || getCurrentDate(),
          note: note || "",
        }})).unwrap();

        // After update, refresh sales list
        dispatch(fetchSales());

        dispatch(showToast({ message: "Service updated successfully!", type: "success" }));

        if (onSuccess) onSuccess();
        if (onClose) onClose();
        Keyboard.dismiss();
      } else {
        // Create new
        const servicesResult = await dispatch(createService({
          name: serviceName,
          product_name: productName,
          description,
          total_amount: total,
          amount_in_cash: cashAmount,
          amount_in_ecash: ecashAmount,
          balance: balance,
          status: statusValue,
          shop_id: selectedShopId,
          user_id: userid,
          customer_id: selectedCustomerId || null,
          received_date: receivedDate || getCurrentDate(),
          return_date: returnDate || getCurrentDate(),
          note: note || "",
        })).unwrap();

        if (totalPaid > 0) {
          try {
            const createdService = servicesResult?.find((s) => s.name === serviceName) || servicesResult?.[servicesResult.length - 1];

            if (createdService && createdService._id) {
              if (cashAmount > 0) {
                await dispatch(createSale({
                  shop_id: selectedShopId,
                  user_id: userid,
                  customer_id: selectedCustomerId || null,
                  service_id: createdService._id,
                  total_amount: total,
                  paid_amount: cashAmount,
                  cash_paid: cashAmount,
                  online_paid: 0,
                  balance: balance,
                  payment_method: 'cash',
                  status: 'completed',
                  notes: `Service: ${serviceName} (Cash)`,
                  items: [],
                })).unwrap();
              }
              if (ecashAmount > 0) {
                await dispatch(createSale({
                  shop_id: selectedShopId,
                  user_id: userid,
                  customer_id: selectedCustomerId || null,
                  service_id: createdService._id,
                  total_amount: total,
                  paid_amount: ecashAmount,
                  cash_paid: 0,
                  online_paid: ecashAmount,
                  balance: 0,
                  payment_method: 'upi',
                  status: 'completed',
                  notes: `Service: ${serviceName} (E-Cash)`,
                  items: [],
                })).unwrap();
              }
              dispatch(fetchSales());
            }
          } catch (salesError) {
            console.error("Sales creation error:", salesError);
          }
        }

        dispatch(showToast({ message: "Service created successfully!", type: "success" }));

        // Reset form
        setServiceName("");
        setProductName("");
        setDescription("");
        setTotalAmount("");
        setAmountInCash("");
        setAmountInEcash("");
        setStatusValue("pending");
        setReceivedDate(getCurrentDate());
        setReturnDate(getCurrentDate());
        setNote("");
        if (role === "staff" && staffShops.length > 0) {
          const staffShopId = staffShops[0]?._id || staffShops[0];
          setSelectedShopId(staffShopId);
        } else if (shops.length > 0) {
          setSelectedShopId(shops[0]._id);
        }
        setSelectedCustomerId("");
        setShowCreateCustomer(false);
        setNewCustomerName("");
        setNewCustomerPhoneNo("");
        setNewCustomerAddress("");

        if (onSuccess) onSuccess();
        if (onClose) onClose();
        Keyboard.dismiss();
      }
    } catch (err) {
      dispatch(showToast({ message: err || (initialService ? "Failed to update service" : "Failed to create service"), type: "error" }));
    } finally {
      setIsAddingService(false);
    }
  };

  const handleCancel = () => {
    if (initialService) {
      // On edit cancel, just close without resetting pre-filled values
      if (onClose) onClose();
      Keyboard.dismiss();
      return;
    }

    setServiceName("");
    setProductName("");
    setDescription("");
    setTotalAmount("");
    setAmountInCash("");
    setAmountInEcash("");
    setStatusValue("pending");
    setReceivedDate(getCurrentDate());
    setReturnDate(getCurrentDate());
    setNote("");
    if (role === "staff" && staffShops.length > 0) {
      const staffShopId = staffShops[0]?._id || staffShops[0];
      setSelectedShopId(staffShopId);
    } else if (shops.length > 0) {
      setSelectedShopId(shops[0]._id);
    }
    setSelectedCustomerId("");
    setShowCreateCustomer(false);
    setNewCustomerName("");
    setNewCustomerPhoneNo("");
    setNewCustomerAddress("");
    if (onClose) onClose();
    Keyboard.dismiss();
  };

  return (
    <>
      <TextInput
        style={themedStyles.input}
        placeholder="Service Name *"
        placeholderTextColor={textSecondary}
        value={serviceName}
        onChangeText={setServiceName}
      />

      <TextInput
        style={themedStyles.input}
        placeholder="Product Name *"
        placeholderTextColor={textSecondary}
        value={productName}
        onChangeText={setProductName}
      />

      <TextInput
        style={themedStyles.input}
        placeholder="Description"
        placeholderTextColor={textSecondary}
        value={description}
        onChangeText={setDescription}
        multiline
      />

      {!showCreateCustomer ? (
        <View style={[themedStyles.input, { padding: 0 }]}>
          <Picker
            selectedValue={selectedCustomerId}
            onValueChange={(itemValue) => {
              if (itemValue === "create_new") {
                setShowCreateCustomer(true);
                setSelectedCustomerId("");
              } else {
                setSelectedCustomerId(itemValue);
              }
            }}
            style={{ color: textColor }}
            itemStyle={{ color: textColor }}
          >
            <Picker.Item label="No Customer" value="" />
            {customers.map((customer) => (
              <Picker.Item key={customer._id} label={customer.name} value={customer._id} />
            ))}
            <Picker.Item label="+ Create New Customer" value="create_new" />
          </Picker>
        </View>
      ) : (
        <View>
          <TextInput
            style={themedStyles.input}
            placeholder="Customer Name *"
            placeholderTextColor={textSecondary}
            value={newCustomerName}
            onChangeText={setNewCustomerName}
          />
          <TextInput
            style={themedStyles.input}
            placeholder="Phone Number"
            placeholderTextColor={textSecondary}
            value={newCustomerPhoneNo}
            onChangeText={setNewCustomerPhoneNo}
            keyboardType="phone-pad"
          />
          <TextInput
            style={themedStyles.input}
            placeholder="Address"
            placeholderTextColor={textSecondary}
            value={newCustomerAddress}
            onChangeText={setNewCustomerAddress}
            multiline
          />
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}>
            <TouchableOpacity
              style={{ ...themedStyles.button1, flex: 1, backgroundColor: textSecondary }}
              onPress={() => {
                setShowCreateCustomer(false);
                setNewCustomerName("");
                setNewCustomerPhoneNo("");
                setNewCustomerAddress("");
              }}
            >
              <Text style={global.btnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ ...themedStyles.button1, flex: 1 }} onPress={handleCreateCustomer}>
              <Text style={global.btnText}>Create</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <TextInput
        style={themedStyles.input}
        placeholder="Total Amount *"
        placeholderTextColor={textSecondary}
        value={totalAmount}
        onChangeText={setTotalAmount}
        keyboardType="decimal-pad"
      />

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <TextInput
          style={[themedStyles.input, { flex: 1 }]}
          placeholder="Amount in Cash"
          placeholderTextColor={textSecondary}
          value={amountInCash}
          onChangeText={setAmountInCash}
          keyboardType="decimal-pad"
        />
        <TextInput
          style={[themedStyles.input, { flex: 1 }]}
          placeholder="Amount in E-Cash"
          placeholderTextColor={textSecondary}
          value={amountInEcash}
          onChangeText={setAmountInEcash}
          keyboardType="decimal-pad"
        />
      </View>

      {totalAmount && (amountInCash || amountInEcash) && (
        <Text style={[themedStyles.textSecondary, { marginTop: 5, marginBottom: 5 }]}> 
          Balance: ₹{(parseFloat(totalAmount || 0) - (parseFloat(amountInCash || 0) + parseFloat(amountInEcash || 0))).toFixed(2)}
        </Text>
      )}

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ ...themedStyles.text, marginBottom: 5 }}>Received Date</Text>
          <Pressable onPress={() => setShowReceivedPicker(true)} style={{ width: '100%' }}>
            <View pointerEvents="none">
              <TextInput
                style={[themedStyles.input, { width: '100%' }]}
                placeholder="Received Date (YYYY-MM-DD) *"
                placeholderTextColor={textSecondary}
                value={receivedDate}
                editable={false}
              />
            </View>
          </Pressable>
          {showReceivedPicker && (
            <DateTimePicker
              value={receivedDate ? new Date(receivedDate) : new Date()}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              themeVariant={isDarkMode ? "dark" : "light"}
              onChange={(event, selectedDate) => {
                setShowReceivedPicker(false);
                if (selectedDate) {
                  setReceivedDate(formatDate(selectedDate));
                }
              }}
            />
          )}
        </View>

        <View style={{ flex: 1 }}>
          <Text style={{ ...themedStyles.text, marginBottom: 5 }}>Return Date</Text>
          <Pressable onPress={() => setShowReturnPicker(true)} style={{ width: '100%' }}>
            <View pointerEvents="none">
              <TextInput
                style={[themedStyles.input, { width: '100%' }]}
                placeholder="Return Date (YYYY-MM-DD) *"
                placeholderTextColor={textSecondary}
                value={returnDate}
                editable={false}
              />
            </View>
          </Pressable>
          {showReturnPicker && (
            <DateTimePicker
              value={returnDate ? new Date(returnDate) : new Date()}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              themeVariant={isDarkMode ? "dark" : "light"}
              onChange={(event, selectedDate) => {
                setShowReturnPicker(false);
                if (selectedDate) {
                  setReturnDate(formatDate(selectedDate));
                }
              }}
            />
          )}
        </View>
      </View>

      <TextInput
        style={themedStyles.input}
        placeholder="Note"
        placeholderTextColor={textSecondary}
        value={note}
        onChangeText={setNote}
        multiline
      />

      <View style={{ flexDirection: 'row', gap: 10,}}>
        <View style={[themedStyles.input, { flex: 1, padding: 0 }]}> 
          <Picker
            selectedValue={statusValue}
            onValueChange={(itemValue) => setStatusValue(itemValue)}
            style={{ color: textColor }}
            itemStyle={{ color: textColor }}
          >
            <Picker.Item label="Pending" value="pending" />
            <Picker.Item label="In Progress" value="in_progress" />
            <Picker.Item label="Completed" value="completed" />
            <Picker.Item label="Cancelled" value="cancelled" />
          </Picker>
        </View>
        {((role !== "staff" && shops.length > 0) || (role === "staff" && staffShops.length > 1)) && (
          <View style={[themedStyles.input, { flex: 1, padding: 0 }]}> 
            <Picker
              selectedValue={selectedShopId}
              onValueChange={(itemValue) => setSelectedShopId(itemValue)}
              style={{ color: textColor }}
              itemStyle={{ color: textColor }}
            >
              {(role !== "staff" ? shops : staffShops).map((shop) => (
                <Picker.Item key={shop._id || shop} label={shop.name || shop} value={shop._id || shop} />
              ))}
            </Picker>
          </View>
        )}
      </View>

      <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
        <TouchableOpacity style={{ ...themedStyles.button1, width: "30%", backgroundColor: textSecondary }} onPress={handleCancel}>
          <Text style={global.btnText}>Close</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ ...themedStyles.button1, width: "30%", opacity: isAddingService ? 0.6 : 1 }} onPress={handleAddService} disabled={isAddingService}>
          {isAddingService ? <ActivityIndicator color="#fff" /> : <Text style={global.btnText1}>{initialService ? 'Save' : 'Add'}</Text>}
        </TouchableOpacity>
      </View>
    </>
  );
};

const CreateServiceScreen = ({ navigation, route }) => {
  // Optionally get params from route if needed
  const shops = useSelector((state) => state.shops?.shops || []);
  const customers = useSelector((state) => state.customers?.customers || []);
  const userid = useSelector((state) => state.auth?.userid || '');
  const role = useSelector((state) => state.auth?.role || '');
  const user = useSelector((state) => state.auth?.user || {});
  const themedStyles = useThemedStyles();
  const { cardBg, isDarkMode } = useThemeColors();

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: cardBg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 16, paddingBottom: 20 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={{ flex: 1 }}>
          <ServiceForm
            shops={shops}
            customers={customers}
            userid={userid}
            role={role}
            user={user}
            onClose={() => navigation.goBack()}
            onSuccess={() => navigation.goBack()}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default CreateServiceScreen;
