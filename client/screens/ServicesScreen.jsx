// screens/ServicesScreen.jsx
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
  ActivityIndicator,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { global, useThemeColors, BAR_HEIGHT } from "../styles/global";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchServices,
  createService,
  deleteService,
  updateService,
} from "../store/slices/serviceSlice";
import { fetchCustomers, createCustomer } from "../store/slices/customerSlice";
import { AntDesign, MaterialIcons } from "@expo/vector-icons";
import { showToast } from "../store/slices/toastSlice";

const ServicesScreen = () => {
  const dispatch = useDispatch();

  const { services } = useSelector((state) => state.services);
  const { customers } = useSelector((state) => state.customers);
  const { shops } = useSelector((state) => state.shops);
  const { userid, role, user } = useSelector((state) => state.auth);
  const { primaryColor } = useThemeColors();

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

  const [serviceName, setServiceName] = useState("");
  const [description, setDescription] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [paidAmount, setPaidAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [statusValue, setStatusValue] = useState("pending");
  const [selectedShopId, setSelectedShopId] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [receivedDate, setReceivedDate] = useState(getCurrentDate());
  const [returnDate, setReturnDate] = useState(getCurrentDate());
  const [note, setNote] = useState("");
  const [isServiceNameFocused, setIsServiceNameFocused] = useState(false);
  const [showCreateCustomer, setShowCreateCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhoneNo, setNewCustomerPhoneNo] = useState("");
  const [newCustomerAddress, setNewCustomerAddress] = useState("");
  const [activeTab, setActiveTab] = useState(0);
  const [isAddingService, setIsAddingService] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      dispatch(fetchServices());
      dispatch(fetchCustomers());
    };
    loadData();

    if (role === "staff" && staffShops.length > 0) {
      const staffShopId = staffShops[0]?._id || staffShops[0];
      setSelectedShopId(staffShopId);
    } else if (shops.length > 0) {
      setSelectedShopId(shops[0]._id);
    }
  }, [dispatch, shops, role, staffShops]);

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

      const newCustomer = result?.find(
        (customer) => customer.name === newCustomerName
      );

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

  const ServiceContainer = ({ service, index, data }) => {
    const [showDetails, setShowDetails] = useState(false);
    const [serviceNameValue, setServiceNameValue] = useState(
      service.service_name || ""
    );
    const [serviceDescription, setServiceDescription] = useState(
      service.description || ""
    );
    const [serviceTotalAmount, setServiceTotalAmount] = useState(
      service.total_amount?.toString() || "0"
    );
    const [servicePaidAmount, setServicePaidAmount] = useState(
      service.paid_amount?.toString() || "0"
    );
    const [servicePaymentMethod, setServicePaymentMethod] = useState(
      service.payment_method || "cash"
    );
    const [serviceStatus, setServiceStatus] = useState(
      service.status || "pending"
    );
    const [serviceCustomerId, setServiceCustomerId] = useState(
      service.customer_id?._id || service.customer_id || ""
    );
    const [serviceReceivedDate, setServiceReceivedDate] = useState(
      service.received_date
        ? formatDate(new Date(service.received_date))
        : getCurrentDate()
    );
    const [serviceReturnDate, setServiceReturnDate] = useState(
      service.return_date
        ? formatDate(new Date(service.return_date))
        : getCurrentDate()
    );
    const [serviceNote, setServiceNote] = useState(service.note || "");

    const handleUpdateService = async () => {
      if (!serviceReceivedDate || !isValidDate(serviceReceivedDate)) {
        dispatch(
          showToast({
            message: "Please enter a valid received date (YYYY-MM-DD)",
            type: "error",
          })
        );
        return;
      }

      if (!serviceReturnDate || !isValidDate(serviceReturnDate)) {
        dispatch(
          showToast({
            message: "Please enter a valid return date (YYYY-MM-DD)",
            type: "error",
          })
        );
        return;
      }

      const balance =
        parseFloat(serviceTotalAmount) - parseFloat(servicePaidAmount);

      const serviceReceivedDateValue = service.received_date
        ? formatDate(new Date(service.received_date))
        : getCurrentDate();
      const serviceReturnDateValue = service.return_date
        ? formatDate(new Date(service.return_date))
        : getCurrentDate();

      if (
        serviceNameValue === (service.service_name || "") &&
        serviceDescription === (service.description || "") &&
        serviceTotalAmount === (service.total_amount?.toString() || "0") &&
        servicePaidAmount === (service.paid_amount?.toString() || "0") &&
        servicePaymentMethod === (service.payment_method || "cash") &&
        serviceStatus === (service.status || "pending") &&
        serviceCustomerId ===
          (service.customer_id?._id || service.customer_id || "") &&
        serviceReceivedDate === serviceReceivedDateValue &&
        serviceReturnDate === serviceReturnDateValue &&
        serviceNote === (service.note || "")
      ) {
        dispatch(
          showToast({
            message: "No changes made to service details",
            type: "info",
          })
        );
        setShowDetails(false);
        return;
      }
      try {
        await dispatch(
          updateService({
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
              received_date: serviceReceivedDate || getCurrentDate(),
              return_date: serviceReturnDate || getCurrentDate(),
              note: serviceNote || "",
            },
          })
        ).unwrap();
        dispatch(
          showToast({
            message: `Service "${serviceNameValue}" updated successfully!`,
            type: "success",
          })
        );
        setShowDetails(false);
      } catch (error) {
        const errorMessage =
          error.message || error.msg || "Failed to update service";
        dispatch(
          showToast({
            message: errorMessage,
            type: "error",
          })
        );
        console.error("Service update error:", error);
      }
    };

    const balance =
      parseFloat(serviceTotalAmount) - parseFloat(servicePaidAmount);

    return (
      <View
        key={service._id}
        style={{
          ...(index === data.length - 1
            ? global.profileRowLast
            : global.profileRow),
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
            position: "relative",
          }}
        >
          <View style={{ flexDirection: "row", gap: 10, flex: 1 }}>
            <View style={{ flexDirection: "column", gap: 5, flex: 1 }}>
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
              <View
                style={{
                  flexDirection: "row",
                  gap: 20,
                  marginLeft: 10,
                  // marginTop: 8,
                  flexWrap: "wrap",
                  margin: 0,
                }}
              >
                <Text style={{ color: "#666", fontSize: 12 }}>
                  To:{"\n "}
                  <Text style={{ color: primaryColor }}>
                    {service.customer_id?.name || "N/A"}
                  </Text>
                </Text>
                <Text style={{ color: "#666", fontSize: 12 }}>
                  By:{"\n "}
                  <Text style={{ color: primaryColor }}>
                    {service.user_id?.username || "N/A"}
                  </Text>
                </Text>
                <Text style={{ color: "#666", fontSize: 12 }}>
                  Shop:{"\n "}
                  <Text style={{ color: primaryColor }}>
                    {service.shop_id?.name || "N/A"}
                  </Text>
                </Text>
                <Text style={{ color: "#666", fontSize: 12 }}>
                  Remaining:{"\n "}
                  <Text style={{ color: primaryColor }}>
                    ₹{service.balance?.toString() || "0"}
                  </Text>
                </Text>
              </View>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => handleDeleteService(service._id)}
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              borderWidth: 1,
              borderColor: "#ba181b",
              padding: 5,
              borderRadius: 5,
            }}
          >
            <MaterialIcons name="delete" size={16} color="#ba181b" />
          </TouchableOpacity>
        </View>

        {showDetails && (
          <View style={{ marginTop: 5, width: "100%" }}>
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
                    <Picker.Item
                      key={customer._id}
                      label={customer.name}
                      value={customer._id}
                    />
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

            <TextInput
              style={global.input}
              placeholder="Received Date (YYYY-MM-DD) *"
              value={serviceReceivedDate}
              onChangeText={setServiceReceivedDate}
            />

            <TextInput
              style={global.input}
              placeholder="Return Date (YYYY-MM-DD) *"
              value={serviceReturnDate}
              onChangeText={setServiceReturnDate}
            />

            <TextInput
              style={global.input}
              placeholder="Note"
              value={serviceNote}
              onChangeText={setServiceNote}
              multiline
            />

            <View style={{ ...global.input, padding: 0 }}>
              <Picker
                selectedValue={servicePaymentMethod}
                onValueChange={(itemValue) =>
                  setServicePaymentMethod(itemValue)
                }
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
                <Text style={global.btnText1}>Save {serviceNameValue}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  const handleAddService = async () => {
    if (!serviceName || !selectedShopId) {
      dispatch(
        showToast({
          message:
            role === "staff"
              ? "Please enter service name"
              : "Please enter service name and select a shop",
          type: "error",
        })
      );
      return;
    }

    if (!receivedDate || !isValidDate(receivedDate)) {
      dispatch(
        showToast({
          message: "Please enter a valid received date (YYYY-MM-DD)",
          type: "error",
        })
      );
      return;
    }

    if (!returnDate || !isValidDate(returnDate)) {
      dispatch(
        showToast({
          message: "Please enter a valid return date (YYYY-MM-DD)",
          type: "error",
        })
      );
      return;
    }

    const total = parseFloat(totalAmount) || 0;
    const paid = parseFloat(paidAmount) || 0;
    const balance = total - paid;

    setIsAddingService(true);
    try {
      await dispatch(
        createService({
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
          received_date: receivedDate || getCurrentDate(),
          return_date: returnDate || getCurrentDate(),
          note: note || "",
        })
      ).unwrap();

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
      setIsServiceNameFocused(false);
      Keyboard.dismiss();
    } catch (err) {
      dispatch(
        showToast({
          message: err || "Failed to create service",
          type: "error",
        })
      );
    } finally {
      setIsAddingService(false);
    }
  };

  return (
    <TouchableWithoutFeedback
      onPress={() => {
        Keyboard.dismiss();
        setIsServiceNameFocused(false);
      }}
    >
      <ScrollView
        style={global.mainContainer}
        contentContainerStyle={{ paddingBottom: BAR_HEIGHT + 60 }}
        keyboardShouldPersistTaps="handled"
      >
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
                      <Picker.Item
                        key={customer._id}
                        label={customer.name}
                        value={customer._id}
                      />
                    ))}
                    <Picker.Item
                      label="+ Create New Customer"
                      value="create_new"
                    />
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
                  <View
                    style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}
                  >
                    <TouchableOpacity
                      style={{
                        ...global.button1,
                        flex: 1,
                        backgroundColor: "#666",
                      }}
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
                  Balance: ₹
                  {(parseFloat(totalAmount) - parseFloat(paidAmount)).toFixed(
                    2
                  )}
                </Text>
              )}

              <TextInput
                style={global.input}
                placeholder="Received Date (YYYY-MM-DD) *"
                value={receivedDate}
                onChangeText={setReceivedDate}
              />

              <TextInput
                style={global.input}
                placeholder="Return Date (YYYY-MM-DD) *"
                value={returnDate}
                onChangeText={setReturnDate}
              />

              <TextInput
                style={global.input}
                placeholder="Note"
                value={note}
                onChangeText={setNote}
                multiline
              />

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

              {role !== "staff" && shops.length > 0 && (
                <View style={{ ...global.input, padding: 0, marginTop: 10 }}>
                  <Picker
                    selectedValue={selectedShopId}
                    onValueChange={(itemValue) => setSelectedShopId(itemValue)}
                  >
                    {shops.map((shop) => (
                      <Picker.Item
                        key={shop._id}
                        label={shop.name}
                        value={shop._id}
                      />
                    ))}
                  </Picker>
                </View>
              )}

              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "flex-end",
                  gap: 10,
                  marginTop: 10,
                }}
              >
                <TouchableOpacity
                  style={{
                    ...global.button1,
                    width: "30%",
                    backgroundColor: "#666",
                  }}
                  onPress={() => {
                    setIsServiceNameFocused(false);
                    setServiceName("");
                    setDescription("");
                    setTotalAmount("");
                    setPaidAmount("");
                    setPaymentMethod("cash");
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
                    Keyboard.dismiss();
                  }}
                >
                  <Text style={global.btnText}>Close</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    ...global.button1,
                    width: "30%",
                    opacity: isAddingService ? 0.6 : 1,
                  }}
                  onPress={handleAddService}
                  disabled={isAddingService}
                >
                  {isAddingService ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={global.btnText1}>Add</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
        <Text style={{ marginBottom: 5, marginTop: 20 }}>Service List</Text>

        <View>
          <View
            style={{ flexDirection: "row", marginTop: 10, marginBottom: 10 }}
          >
            <TouchableOpacity
              style={{
                flex: 1,
                borderBottomWidth: activeTab === 0 ? 3 : 0,
                borderBottomColor:
                  activeTab === 0 ? primaryColor : "transparent",
                alignItems: "center",
              }}
              onPress={() => setActiveTab(0)}
            >
              <Text
                style={{
                  color: activeTab === 0 ? primaryColor : "#666",
                  paddingBottom: 5,
                }}
              >
                Active
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                flex: 1,
                borderBottomWidth: activeTab === 1 ? 3 : 0,
                borderBottomColor:
                  activeTab === 1 ? primaryColor : "transparent",
                alignItems: "center",
              }}
              onPress={() => setActiveTab(1)}
            >
              <Text
                style={{
                  color: activeTab === 1 ? primaryColor : "#666",
                  paddingBottom: 5,
                }}
              >
                Completed/Cancelled
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {(() => {
          const filteredServices =
            activeTab === 0
              ? services.filter(
                  (service) =>
                    service.status === "pending" ||
                    service.status === "in_progress"
                )
              : services.filter(
                  (service) =>
                    service.status === "completed" ||
                    service.status === "cancelled"
                );

          if (filteredServices.length === 0) {
            return (
              <Text
                style={{ textAlign: "center", color: "#999", marginTop: 20 }}
              >
                {activeTab === 0
                  ? "No active services (pending/in progress)"
                  : "No completed or cancelled services"}
              </Text>
            );
          }

          const groupedServices = filteredServices.reduce((acc, service) => {
            const serviceDate =
              activeTab === 0
                ? service.received_date
                  ? formatDate(new Date(service.received_date))
                  : getCurrentDate()
                : service.return_date
                ? formatDate(new Date(service.return_date))
                : getCurrentDate();
            if (!acc[serviceDate]) {
              acc[serviceDate] = [];
            }
            acc[serviceDate].push(service);
            return acc;
          }, {});

          const sortedDates = Object.keys(groupedServices).sort(
            (a, b) => new Date(b) - new Date(a)
          );

          return sortedDates.map((date) => (
            <View
              key={date}
              style={{
                ...global.profileContainer,
                fontSize: 16,
                marginTop: 15,
              }}
            >
              <Text
                style={{
                  fontWeight: "bold",
                  color: primaryColor,
                  marginBottom: 10,
                  paddingBottom: 5,
                  borderBottomWidth: 1,
                  borderBottomColor: "#ddd",
                }}
              >
                {activeTab === 0 ? `Received: ${date}` : `Return: ${date}`}
              </Text>
              {groupedServices[date].map((service, index) => (
                <ServiceContainer
                  key={service._id}
                  service={service}
                  index={index}
                  data={groupedServices[date]}
                />
              ))}
            </View>
          ));
        })()}
      </ScrollView>
    </TouchableWithoutFeedback>
  );
};

export default ServicesScreen;
