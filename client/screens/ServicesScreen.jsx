import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
  ScrollView,
} from "react-native";
import { Picker } from '@react-native-picker/picker';
import { global, useThemeColors } from "../styles/global";
import { useDispatch, useSelector } from "react-redux";
import { fetchServices, createService, deleteService, updateService } from "../store/slices/serviceSlice";
import { fetchCustomers, createCustomer } from "../store/slices/customerSlice";
import { AntDesign, MaterialIcons } from "@expo/vector-icons";
import { showToast } from "../store/slices/toastSlice";

const ServicesScreen = () => {
  const dispatch = useDispatch();

  const { services, status, error } = useSelector((state) => state.services);
  const { customers } = useSelector((state) => state.customers);
  const { shops } = useSelector((state) => state.shops);
  const { userid } = useSelector((state) => state.auth);
  const { primaryColor } = useThemeColors();

  const [serviceName, setServiceName] = useState("");
  const [description, setDescription] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [paidAmount, setPaidAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [statusValue, setStatusValue] = useState("pending");
  const [selectedShopId, setSelectedShopId] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [isServiceNameFocused, setIsServiceNameFocused] = useState(false);
  const [showCreateCustomer, setShowCreateCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhoneNo, setNewCustomerPhoneNo] = useState("");
  const [newCustomerAddress, setNewCustomerAddress] = useState("");

  useEffect(() => {
    const loadData = async () => {
      dispatch(fetchServices());
      dispatch(fetchCustomers());
    };
    loadData();

    // Set initial selected shop if shops are available
    if (shops.length > 0) {
      setSelectedShopId(shops[0]._id);
    }
  }, [dispatch, shops]);

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
      const result = await dispatch(createCustomer({
        name: newCustomerName,
        phone_no: newCustomerPhoneNo,
        address: newCustomerAddress,
      })).unwrap();

      dispatch(
        showToast({
          message: "Customer created successfully!",
          type: "success",
        })
      );
      
      // Find and select the newly created customer
      const newCustomer = result?.find(customer => customer.name === newCustomerName);
      
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

  const handleDeleteService = async (serviceId) => {
    try {
      Alert.alert("Delete Service", "Do you want to delete this service?", [
        { text: "Cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await dispatch(deleteService(serviceId)).unwrap();
            dispatch(
              showToast({
                message: "Service deleted!",
                type: "success",
              })
            );
          },
        },
      ]);
    } catch (error) {
      dispatch(
        showToast({
          message: error || "Failed to delete service",
          type: "error",
        })
      );
      console.error("Service deletion error:", error);
    }
  };

  const ServiceContainer = ({ service }) => {
    const [showDetails, setShowDetails] = useState(false);
    const [serviceNameValue, setServiceNameValue] = useState(service.service_name || "");
    const [serviceDescription, setServiceDescription] = useState(service.description || "");
    const [serviceTotalAmount, setServiceTotalAmount] = useState(service.total_amount?.toString() || "0");
    const [servicePaidAmount, setServicePaidAmount] = useState(service.paid_amount?.toString() || "0");
    const [servicePaymentMethod, setServicePaymentMethod] = useState(service.payment_method || "cash");
    const [serviceStatus, setServiceStatus] = useState(service.status || "pending");
    const [serviceCustomerId, setServiceCustomerId] = useState(service.customer_id?._id || service.customer_id || "");

    const handleUpdateService = async () => {
      const balance = parseFloat(serviceTotalAmount) - parseFloat(servicePaidAmount);
      
      if (
        serviceNameValue === (service.service_name || "") &&
        serviceDescription === (service.description || "") &&
        serviceTotalAmount === (service.total_amount?.toString() || "0") &&
        servicePaidAmount === (service.paid_amount?.toString() || "0") &&
        servicePaymentMethod === (service.payment_method || "cash") &&
        serviceStatus === (service.status || "pending") &&
        serviceCustomerId === (service.customer_id?._id || service.customer_id || "")
      ) {
        dispatch(showToast({
          message: "No changes made to service details",
          type: "info",
        }));
        setShowDetails(false);
        return;
      }
      try {
        await dispatch(updateService({
          serviceId: service._id,
          serviceData: {
            service_name: serviceNameValue,
            description: serviceDescription,
            total_amount: parseFloat(serviceTotalAmount) || 0,
            paid_amount: parseFloat(servicePaidAmount) || 0,
            balance: balance,
            payment_method: servicePaymentMethod,
            status: serviceStatus,
            customer_id: serviceCustomerId || null,
          },
        })).unwrap();
        dispatch(showToast({
          message: `Service "${serviceNameValue}" updated successfully!`,
          type: "success",
        }));
        setShowDetails(false);
      } catch (error) {
        const errorMessage = error.message || error.msg || "Failed to update service";
        dispatch(showToast({
          message: errorMessage,
          type: "error",
        }));
        console.error("Service update error:", error);
      }
    };

    const balance = parseFloat(serviceTotalAmount) - parseFloat(servicePaidAmount);

  return (
      <View
        key={service._id}
        style={{
          ...global.profileRow,
          paddingVertical: 10,
          paddingHorizontal: 8,
          flexDirection: "column",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <View style={{ flexDirection: "row", gap: 10 }}>
            <TouchableOpacity
              onPress={() => {
                setShowDetails(!showDetails);
                setIsServiceNameFocused(false);
                Keyboard.dismiss();
              }}
              style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
            >
              <AntDesign
                style={{ marginTop: 5 }}
                name={showDetails ? "caret-up" : "caret-down"}
                size={20}
                color="black"
              />
              <Text style={{ color: primaryColor, fontSize: 16 }}>
                {service.service_name}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={{ marginLeft: "auto" }}>
            <TouchableOpacity onPress={() => handleDeleteService(service._id)}>
              <MaterialIcons name="delete" size={24} color="#ba181b" />
            </TouchableOpacity>
          </View>
        </View>

        {showDetails && (
          <ScrollView style={{ marginTop: 10, width: "100%" }}>
            <TextInput
              style={global.input}
              placeholder="Service Name *"
              value={serviceNameValue}
              onChangeText={setServiceNameValue}
            />

            <TextInput
              style={global.input}
              placeholder="Description"
              value={serviceDescription}
              onChangeText={setServiceDescription}
              multiline
            />

            {customers.length > 0 && (
              <View style={{ ...global.input, padding: 0 }}>
                <Picker
                  selectedValue={serviceCustomerId}
                  onValueChange={(itemValue) => setServiceCustomerId(itemValue)}
                >
                  <Picker.Item label="No Customer" value="" />
                  {customers.map((customer) => (
                    <Picker.Item key={customer._id} label={customer.name} value={customer._id} />
                  ))}
                </Picker>
              </View>
            )}

            <TextInput
              style={global.input}
              placeholder="Total Amount *"
              value={serviceTotalAmount}
              onChangeText={setServiceTotalAmount}
              keyboardType="decimal-pad"
            />

            <TextInput
              style={global.input}
              placeholder="Paid Amount *"
              value={servicePaidAmount}
              onChangeText={setServicePaidAmount}
              keyboardType="decimal-pad"
            />

            <Text style={{ marginTop: 10, marginBottom: 5, color: "#666" }}>
              Balance: ₹{balance.toFixed(2)}
            </Text>

            <View style={{ ...global.input, padding: 0 }}>
              <Picker
                selectedValue={servicePaymentMethod}
                onValueChange={(itemValue) => setServicePaymentMethod(itemValue)}
              >
                <Picker.Item label="Cash" value="cash" />
                <Picker.Item label="Card" value="card" />
                <Picker.Item label="UPI" value="upi" />
                <Picker.Item label="Bank Transfer" value="bank_transfer" />
              </Picker>
            </View>

            <View style={{ ...global.input, padding: 0, marginTop: 10 }}>
              <Picker
                selectedValue={serviceStatus}
                onValueChange={(itemValue) => setServiceStatus(itemValue)}
              >
                <Picker.Item label="Pending" value="pending" />
                <Picker.Item label="In Progress" value="in_progress" />
                <Picker.Item label="Completed" value="completed" />
                <Picker.Item label="Cancelled" value="cancelled" />
              </Picker>
            </View>

            <View>
              <TouchableOpacity
                style={{ marginTop: 10, ...global.button1 }}
                onPress={handleUpdateService}
              >
                <Text style={global.btnText}>Save {serviceNameValue}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </View>
    );
  };

  const handleAddService = async () => {
    if (!serviceName || !selectedShopId) {
      dispatch(
        showToast({
          message: "Please enter service name and select a shop",
          type: "error",
        })
      );
      return;
    }

    const total = parseFloat(totalAmount) || 0;
    const paid = parseFloat(paidAmount) || 0;
    const balance = total - paid;

    try {
      await dispatch(createService({
        service_name: serviceName,
        description,
        total_amount: total,
        paid_amount: paid,
        balance: balance,
        payment_method: paymentMethod,
        status: statusValue,
        shop_id: selectedShopId,
        user_id: userid,
        customer_id: selectedCustomerId || null,
      })).unwrap();

      dispatch(
        showToast({
          message: "Service created successfully!",
          type: "success",
        })
      );
      setServiceName("");
      setDescription("");
      setTotalAmount("");
      setPaidAmount("");
      setPaymentMethod("cash");
      setStatusValue("pending");
      setSelectedShopId(shops.length > 0 ? shops[0]._id : "");
      setSelectedCustomerId("");
      setIsServiceNameFocused(false);
      Keyboard.dismiss();
    } catch (err) {
      dispatch(
        showToast({
          message: err || "Failed to create service",
          type: "error",
        })
      );
    }
  };

  return (
    <TouchableWithoutFeedback onPress={() => { Keyboard.dismiss(); setIsServiceNameFocused(false); }}>
      <ScrollView style={global.mainContainer}>
        <View style={{ marginTop: 10 }}>
          <Text style={{ marginBottom: 10 }}>Add Service</Text>
          <TextInput
            style={global.input}
            placeholder="Service Name *"
            value={serviceName}
            onChangeText={setServiceName}
            onFocus={() => setIsServiceNameFocused(true)}
          />

          {isServiceNameFocused && (
            <>
              <TextInput
                style={global.input}
                placeholder="Description"
                value={description}
                onChangeText={setDescription}
                multiline
              />

              {!showCreateCustomer ? (
                <View style={{ ...global.input, padding: 0 }}>
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
                    style={global.input}
                    placeholder="Customer Name *"
                    value={newCustomerName}
                    onChangeText={setNewCustomerName}
                  />
                  <TextInput
                    style={global.input}
                    placeholder="Phone Number"
                    value={newCustomerPhoneNo}
                    onChangeText={setNewCustomerPhoneNo}
                    keyboardType="phone-pad"
                  />
                  <TextInput
                    style={global.input}
                    placeholder="Address"
                    value={newCustomerAddress}
                    onChangeText={setNewCustomerAddress}
                    multiline
                  />
                  <View style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}>
                    <TouchableOpacity
                      style={{ ...global.button1, flex: 1, backgroundColor: "#666" }}
                      onPress={() => {
                        setShowCreateCustomer(false);
                        setNewCustomerName("");
                        setNewCustomerPhoneNo("");
                        setNewCustomerAddress("");
                      }}
                    >
                      <Text style={global.btnText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{ ...global.button1, flex: 1 }}
                      onPress={handleCreateCustomer}
                    >
                      <Text style={global.btnText}>Create</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              <TextInput
                style={global.input}
                placeholder="Total Amount *"
                value={totalAmount}
                onChangeText={setTotalAmount}
                keyboardType="decimal-pad"
              />

              <TextInput
                style={global.input}
                placeholder="Paid Amount *"
                value={paidAmount}
                onChangeText={setPaidAmount}
                keyboardType="decimal-pad"
              />

              {totalAmount && paidAmount && (
                <Text style={{ marginTop: 5, marginBottom: 5, color: "#666" }}>
                  Balance: ₹{(parseFloat(totalAmount) - parseFloat(paidAmount)).toFixed(2)}
                </Text>
              )}

              <View style={{ ...global.input, padding: 0 }}>
                <Picker
                  selectedValue={paymentMethod}
                  onValueChange={(itemValue) => setPaymentMethod(itemValue)}
                >
                  <Picker.Item label="Cash" value="cash" />
                  <Picker.Item label="Card" value="card" />
                  <Picker.Item label="UPI" value="upi" />
                  <Picker.Item label="Bank Transfer" value="bank_transfer" />
                </Picker>
              </View>

              <View style={{ ...global.input, padding: 0, marginTop: 10 }}>
                <Picker
                  selectedValue={statusValue}
                  onValueChange={(itemValue) => setStatusValue(itemValue)}
                >
                  <Picker.Item label="Pending" value="pending" />
                  <Picker.Item label="In Progress" value="in_progress" />
                  <Picker.Item label="Completed" value="completed" />
                  <Picker.Item label="Cancelled" value="cancelled" />
                </Picker>
              </View>

              {shops.length > 0 && (
                <View style={{ ...global.input, padding: 0, marginTop: 10 }}>
                  <Picker
                    selectedValue={selectedShopId}
                    onValueChange={(itemValue) => setSelectedShopId(itemValue)}
                  >
                    {shops.map((shop) => (
                      <Picker.Item key={shop._id} label={shop.name} value={shop._id} />
                    ))}
                  </Picker>
                </View>
              )}

              <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
                <TouchableOpacity
                  style={{ ...global.button1, width: "30%", backgroundColor: "#666" }}
                  onPress={() => {
                    setIsServiceNameFocused(false);
                    setServiceName("");
                    setDescription("");
                    setTotalAmount("");
                    setPaidAmount("");
                    setPaymentMethod("cash");
                    setStatusValue("pending");
                    setSelectedCustomerId("");
                    setShowCreateCustomer(false);
                    setNewCustomerName("");
                    setNewCustomerPhoneNo("");
                    setNewCustomerAddress("");
                    Keyboard.dismiss();
                  }}
                >
                  <Text style={global.btnText}>Close</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ ...global.button1, width: "30%" }}
                  onPress={handleAddService}
                >
                  <Text style={global.btnText}>Add</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
    </View>
        <Text style={{ marginBottom: 5, marginTop: 20 }}>Service List</Text>
        {services.map((service) => (
          <ServiceContainer key={service._id} service={service} />
        ))}
      </ScrollView>
    </TouchableWithoutFeedback>
  );
};

export default ServicesScreen;
