import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Keyboard,
  Pressable,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { useDispatch, useSelector } from "react-redux";
import { useNavigation, useRoute } from "@react-navigation/native";
import {
  global,
  useThemeColors,
  useThemedStyles,
  BAR_HEIGHT,
} from "../styles/global";
import { updateService, deleteService } from "../store/slices/serviceSlice";
import { createSale, updateSale, fetchSales } from "../store/slices/salesSlice";
import { showToast } from "../store/slices/toastSlice";

const ServiceDetailScreen = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const route = useRoute();
  const { serviceId } = route.params || {};

  const { services } = useSelector((state) => state.services);
  const { sales } = useSelector((state) => state.sales);
  const { customers } = useSelector((state) => state.customers);
  const { userid, role, user } = useSelector((state) => state.auth);
  const shops = useSelector((state) => state.shops?.shops || []);
  const staffShops = user?.shops || [];

  const themedStyles = useThemedStyles();
  const { textSecondary, primaryColor, isDarkMode, textColor } = useThemeColors();

  const service = services?.find((s) => s._id === serviceId) || null;

  // Local state mirrors service fields for editing
  const [serviceName, setServiceName] = useState(service?.name || "");
  const [productName, setProductName] = useState(service?.product_name || "");
  const [description, setDescription] = useState(service?.description || "");
  const [totalAmount, setTotalAmount] = useState(
    service?.total_amount?.toString() || "0"
  );
  const [amountInCash, setAmountInCash] = useState(
    service?.amount_in_cash?.toString() || "0"
  );
  const [amountInEcash, setAmountInEcash] = useState(
    service?.amount_in_ecash?.toString() || "0"
  );
  const [statusValue, setStatusValue] = useState(service?.status || "pending");
  const [customerId, setCustomerId] = useState(
    service?.customer_id?._id || service?.customer_id || ""
  );
  const [receivedDate, setReceivedDate] = useState(
    service?.received_date
      ? new Date(service.received_date).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10)
  );
  const [returnDate, setReturnDate] = useState(
    service?.return_date
      ? new Date(service.return_date).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10)
  );
  const [note, setNote] = useState(service?.note || "");
  const [isUpdating, setIsUpdating] = useState(false);

  const [showReceivedPicker, setShowReceivedPicker] = useState(false);
  const [showReturnPicker, setShowReturnPicker] = useState(false);

  useEffect(() => {
    // sync when service updates in store
    setServiceName(service?.name || "");
    setProductName(service?.product_name || "");
    setDescription(service?.description || "");
    setTotalAmount(service?.total_amount?.toString() || "0");
    setAmountInCash(service?.amount_in_cash?.toString() || "0");
    setAmountInEcash(service?.amount_in_ecash?.toString() || "0");
    setStatusValue(service?.status || "pending");
    setCustomerId(service?.customer_id?._id || service?.customer_id || "");
    setReceivedDate(
      service?.received_date
        ? new Date(service.received_date).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10)
    );
    setReturnDate(
      service?.return_date
        ? new Date(service.return_date).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10)
    );
    setNote(service?.note || "");
  }, [service]);

  const isValidDate = (dateString) => {
    if (!dateString) return false;
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
  };

  const handleUpdate = async () => {
    if (!isValidDate(receivedDate)) {
      dispatch(
        showToast({
          message: "Please enter a valid received date (YYYY-MM-DD)",
          type: "error",
        })
      );
      return;
    }
    if (!isValidDate(returnDate)) {
      dispatch(
        showToast({
          message: "Please enter a valid return date (YYYY-MM-DD)",
          type: "error",
        })
      );
      return;
    }

    setIsUpdating(true);

    try {
      const newAmountInCash = parseFloat(amountInCash) || 0;
      const newAmountInEcash = parseFloat(amountInEcash) || 0;
      const balance =
        parseFloat(totalAmount) - (newAmountInCash + newAmountInEcash);

      await dispatch(
        updateService({
          serviceId: service._id,
          serviceData: {
            name: serviceName,
            product_name: productName,
            description,
            total_amount: parseFloat(totalAmount) || 0,
            amount_in_cash: newAmountInCash,
            amount_in_ecash: newAmountInEcash,
            balance,
            status: statusValue,
            customer_id: customerId || null,
            received_date: receivedDate,
            return_date: returnDate,
            note: note || "",
          },
        })
      ).unwrap();

      // Handle sales update/create similar to list screen
      const newTotalPaid = newAmountInCash + newAmountInEcash;
      if (newTotalPaid > 0) {
        try {
          const existingSales =
            sales?.filter(
              (s) =>
                s.service_id?._id === service._id ||
                s.service_id === service._id
            ) || [];

          // cash
          if (newAmountInCash > 0) {
            const cashSale = existingSales.find(
              (s) => s.payment_method === "cash"
            );
            if (cashSale) {
              await dispatch(
                updateSale({
                  saleId: cashSale._id || cashSale.id,
                  saleData: {
                    paid_amount: newAmountInCash,
                    cash_paid: newAmountInCash,
                    online_paid: 0,
                    total_amount: parseFloat(totalAmount) || 0,
                    balance,
                    payment_method: "cash",
                    customer_id: customerId || null,
                    notes: `Service: ${serviceName} (Cash)`,
                  },
                })
              ).unwrap();
            } else {
              await dispatch(
                createSale({
                  shop_id: service.shop_id?._id || service.shop_id,
                  user_id: service.user_id?._id || service.user_id,
                  customer_id: customerId || null,
                  service_id: service._id,
                  total_amount: parseFloat(totalAmount) || 0,
                  paid_amount: newAmountInCash,
                  cash_paid: newAmountInCash,
                  online_paid: 0,
                  balance,
                  payment_method: "cash",
                  status: "completed",
                  notes: `Service: ${serviceName} (Cash)`,
                  items: [],
                })
              ).unwrap();
            }
          } else if (newAmountInCash === 0) {
            const cashSale = existingSales.find(
              (s) => s.payment_method === "cash"
            );
            if (cashSale) {
              await dispatch(
                updateSale({
                  saleId: cashSale._id || cashSale.id,
                  saleData: {
                    paid_amount: 0,
                    cash_paid: 0,
                    online_paid: 0,
                    total_amount: parseFloat(totalAmount) || 0,
                    balance,
                  },
                })
              ).unwrap();
            }
          }

          // ecash
          if (newAmountInEcash > 0) {
            const ecashSale = existingSales.find(
              (s) => s.payment_method !== "cash"
            );
            if (ecashSale) {
              await dispatch(
                updateSale({
                  saleId: ecashSale._id || ecashSale.id,
                  saleData: {
                    paid_amount: newAmountInEcash,
                    cash_paid: 0,
                    online_paid: newAmountInEcash,
                    total_amount: parseFloat(totalAmount) || 0,
                    balance: 0,
                    payment_method: "upi",
                    customer_id: customerId || null,
                    notes: `Service: ${serviceName} (E-Cash)`,
                  },
                })
              ).unwrap();
            } else {
              await dispatch(
                createSale({
                  shop_id: service.shop_id?._id || service.shop_id,
                  user_id: service.user_id?._id || service.user_id,
                  customer_id: customerId || null,
                  service_id: service._id,
                  total_amount: parseFloat(totalAmount) || 0,
                  paid_amount: newAmountInEcash,
                  cash_paid: 0,
                  online_paid: newAmountInEcash,
                  balance: 0,
                  payment_method: "upi",
                  status: "completed",
                  notes: `Service: ${serviceName} (E-Cash)`,
                  items: [],
                })
              ).unwrap();
            }
          } else if (newAmountInEcash === 0) {
            const ecashSale = existingSales.find(
              (s) => s.payment_method !== "cash"
            );
            if (ecashSale) {
              await dispatch(
                updateSale({
                  saleId: ecashSale._id || ecashSale.id,
                  saleData: {
                    paid_amount: 0,
                    cash_paid: 0,
                    online_paid: 0,
                    total_amount: parseFloat(totalAmount) || 0,
                    balance,
                  },
                })
              ).unwrap();
            }
          }

          dispatch(fetchSales());
        } catch (salesError) {
          console.error("Sales update error:", salesError);
        }
      }

      dispatch(
        showToast({
          message: `Service "${serviceName}" updated successfully!`,
          type: "success",
        })
      );
      Keyboard.dismiss();
      navigation.goBack();
    } catch (error) {
      const msg = error?.message || "Failed to update service";
      dispatch(showToast({ message: msg, type: "error" }));
      console.error("Service update error:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = () => {
    if (!service) return;
    Alert.alert(
      "Delete Service",
      `Are you sure you want to delete \"${service.name}\"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await dispatch(deleteService(service._id)).unwrap();
              dispatch(
                showToast({ message: "Service deleted", type: "success" })
              );
              navigation.goBack();
            } catch (err) {
              dispatch(
                showToast({
                  message: err?.message || "Failed to delete service",
                  type: "error",
                })
              );
            }
          },
        },
      ]
    );
  };

  if (!service) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: primaryColor }}>Service not found</Text>
      </View>
    );
  }

  const balance =
    parseFloat(totalAmount || 0) -
    ((parseFloat(amountInCash) || 0) + (parseFloat(amountInEcash) || 0));

  return (
    <ScrollView
      style={themedStyles.mainContainer}
      contentContainerStyle={{ paddingBottom: BAR_HEIGHT + 80 }}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={{ ...themedStyles.text, marginBottom: 6 }}>
        Service Name
      </Text>
      <TextInput
        style={themedStyles.input}
        placeholder="Service Name *"
        placeholderTextColor={textSecondary}
        value={serviceName}
        onChangeText={setServiceName}
        editable={!isUpdating}
      />

      <Text style={{ ...themedStyles.text, marginBottom: 6 }}>
        Product Name
      </Text>
      <TextInput
        style={themedStyles.input}
        placeholder="Product Name"
        placeholderTextColor={textSecondary}
        value={productName}
        onChangeText={setProductName}
        editable={!isUpdating}
      />

      <Text style={{ ...themedStyles.text, marginBottom: 6 }}>Description</Text>
      <TextInput
        style={themedStyles.input}
        placeholder="Description"
        placeholderTextColor={textSecondary}
        value={description}
        onChangeText={setDescription}
        multiline
        editable={!isUpdating}
      />

      {customers.length > 0 && (
        <View
          style={[
            themedStyles.input,
            { padding: 0, opacity: isUpdating ? 0.6 : 1 },
          ]}
        >
          <Picker
            selectedValue={customerId}
            onValueChange={(v) => setCustomerId(v)}
            enabled={!isUpdating}
            style={{ color: textColor }}
            itemStyle={{ color: textColor }}
          >
            <Picker.Item label="No Customer" value="" />
            {customers.map((c) => (
              <Picker.Item key={c._id} label={c.name} value={c._id} />
            ))}
          </Picker>
        </View>
      )}

      <Text style={{ ...themedStyles.text, marginBottom: 6 }}>Total Amount</Text>
      <TextInput
        style={themedStyles.input}
        placeholder="Total Amount *"
        placeholderTextColor={textSecondary}
        value={totalAmount}
        onChangeText={setTotalAmount}
        keyboardType="decimal-pad"
        editable={!isUpdating}
      />

      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ ...themedStyles.text, marginBottom: 6 }}>
            Amount in Cash
          </Text>
          <TextInput
            style={[themedStyles.input, { width: "100%" }]}
            placeholder="Amount in Cash"
            placeholderTextColor={textSecondary}
            value={amountInCash}
            onChangeText={setAmountInCash}
            keyboardType="decimal-pad"
            editable={!isUpdating}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ ...themedStyles.text, marginBottom: 6 }}>
            Amount in E-Cash
          </Text>
          <TextInput
            style={[themedStyles.input, { width: "100%" }]}
            placeholder="Amount in E-Cash"
            placeholderTextColor={textSecondary}
            value={amountInEcash}
            onChangeText={setAmountInEcash}
            keyboardType="decimal-pad"
            editable={!isUpdating}
          />
        </View>
      </View>

      {totalAmount && (amountInCash || amountInEcash) && (
        <Text
          style={[
            themedStyles.textSecondary,
            { marginTop: 5, marginBottom: 5 },
          ]}
        >
          Balance: ₹{balance.toFixed(2)}
        </Text>
      )}

      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ ...themedStyles.text, marginBottom: 5 }}>
            Received Date
          </Text>
          <Pressable
            onPress={() => setShowReceivedPicker(true)}
            style={{ width: "100%" }}
          >
            <View pointerEvents="none">
              <TextInput
                style={[themedStyles.input, { width: "100%" }]}
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
                  setReceivedDate(selectedDate.toISOString().slice(0, 10));
                }
              }}
            />
          )}
        </View>

        <View style={{ flex: 1 }}>
          <Text style={{ ...themedStyles.text, marginBottom: 5 }}>
            Return Date
          </Text>
          <Pressable
            onPress={() => setShowReturnPicker(true)}
            style={{ width: "100%" }}
          >
            <View pointerEvents="none">
              <TextInput
                style={[themedStyles.input, { width: "100%" }]}
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
                  setReturnDate(selectedDate.toISOString().slice(0, 10));
                }
              }}
            />
          )}
        </View>
      </View>

      <Text style={{ ...themedStyles.text, marginBottom: 6 }}>Note</Text>
      <TextInput
        style={themedStyles.input}
        placeholder="Note"
        placeholderTextColor={textSecondary}
        value={note}
        onChangeText={setNote}
        multiline
        editable={!isUpdating}
      />

      <View style={{ flexDirection: "row", gap: 10, marginTop: 5 }}>
        <View
          style={[
            themedStyles.input,
            { flex: 1, padding: 0, opacity: isUpdating ? 0.6 : 1 },
          ]}
        >
          <Picker
            selectedValue={statusValue}
            onValueChange={(v) => setStatusValue(v)}
            enabled={!isUpdating}
                        style={{ color: textColor }}
            itemStyle={{ color: textColor }}
          >
            <Picker.Item label="Pending" value="pending" />
            <Picker.Item label="In Progress" value="in_progress" />
            <Picker.Item label="Completed" value="completed" />
            <Picker.Item label="Cancelled" value="cancelled" />
          </Picker>
        </View>
      </View>

      <View
        style={{
          flexDirection: "row",
          justifyContent: "flex-end",
          gap: 10,
          marginTop: 5,
        }}
      >
        <TouchableOpacity
          style={{
            ...themedStyles.button1,
            backgroundColor: "#ba181b",
            opacity: isUpdating ? 0.6 : 1,
          }}
          onPress={handleDelete}
          disabled={isUpdating}
        >
          <Text style={global.btnText}>Delete</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ ...themedStyles.button1, opacity: isUpdating ? 0.6 : 1, flex: 1 }}
          onPress={handleUpdate}
          disabled={isUpdating}
        >
          {isUpdating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{...global.btnText1, fontSize: 14}}>Save</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default ServiceDetailScreen;
