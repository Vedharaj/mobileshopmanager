import React, { useState, useEffect } from "react";
import { useFocusEffect } from "@react-navigation/native";
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
import { createSale, updateSale, fetchSales } from "../store/slices/salesSlice";
import { AntDesign, MaterialIcons } from "@expo/vector-icons";
import { showToast } from "../store/slices/toastSlice";

const ServicesScreen = () => {
  const dispatch = useDispatch();

  const { services } = useSelector((state) => state.services);
  const { customers } = useSelector((state) => state.customers);
  const { shops } = useSelector((state) => state.shops);
  const { sales } = useSelector((state) => state.sales);
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
  const [filterShopId, setFilterShopId] = useState(""); // shop filter
  const [amountInCash, setAmountInCash] = useState("");
  const [amountInEcash, setAmountInEcash] = useState("");
  const [displayLimitServices, setDisplayLimitServices] = useState(10);
  const [isLoadingMoreServices, setIsLoadingMoreServices] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!services || services.length === 0) {
        dispatch(fetchServices());
      }
      if (!customers || customers.length === 0) {
        dispatch(fetchCustomers());
      }
    };
    loadData();

    if (role === "staff" && staffShops.length > 0) {
      const staffShopId = staffShops[0]?._id || staffShops[0];
      setSelectedShopId(staffShopId);
      setFilterShopId(staffShopId); // staff only sees their shop
    } else if (shops.length > 0) {
      setSelectedShopId(shops[0]._id);
      setFilterShopId(""); // owner default: all shops
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
    const [isUpdatingService, setIsUpdatingService] = useState(false);
    const [serviceNameValue, setServiceNameValue] = useState(
      service.name || ""
    );
    const [serviceDescription, setServiceDescription] = useState(
      service.description || ""
    );
    const [serviceTotalAmount, setServiceTotalAmount] = useState(
      service.total_amount?.toString() || "0"
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
    const [serviceAmountInCash, setServiceAmountInCash] = useState(
      service.amount_in_cash?.toString() || "0"
    );
    const [serviceAmountInEcash, setServiceAmountInEcash] = useState(
      service.amount_in_ecash?.toString() || "0"
    );

    const [serviceNote, setServiceNote] = useState(service.note || "");

    // Update local state when service prop changes (e.g., after refetch from useFocusEffect)
    useEffect(() => {
      // console.log("Service updated - refreshing local state for service:", service.name, "balance:", service.balance);
      setServiceNameValue(service.name || "");
      setServiceDescription(service.description || "");
      setServiceTotalAmount(service.total_amount?.toString() || "0");
      setServiceStatus(service.status || "pending");
      setServiceCustomerId(service.customer_id?._id || service.customer_id || "");
      setServiceReceivedDate(
        service.received_date
          ? formatDate(new Date(service.received_date))
          : getCurrentDate()
      );
      setServiceReturnDate(
        service.return_date
          ? formatDate(new Date(service.return_date))
          : getCurrentDate()
      );
      setServiceAmountInCash(service.amount_in_cash?.toString() || "0");
      setServiceAmountInEcash(service.amount_in_ecash?.toString() || "0");
      setServiceNote(service.note || "");
    }, [service]);

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

      const balance = parseFloat(serviceTotalAmount) || 0;


      const serviceReceivedDateValue = service.received_date
        ? formatDate(new Date(service.received_date))
        : getCurrentDate();
      const serviceReturnDateValue = service.return_date
        ? formatDate(new Date(service.return_date))
        : getCurrentDate();

      if (
        serviceNameValue === (service.name || "") &&
        serviceDescription === (service.description || "") &&
        serviceTotalAmount === (service.total_amount?.toString() || "0") &&
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
      setIsUpdatingService(true);
      try {
        const newAmountInCash = parseFloat(serviceAmountInCash) || 0;
        const newAmountInEcash = parseFloat(serviceAmountInEcash) || 0;
        const newTotalPaid = newAmountInCash + newAmountInEcash;
        const previousAmountInCash = parseFloat(service.amount_in_cash || 0);
        const previousAmountInEcash = parseFloat(service.amount_in_ecash || 0);
        const previousTotalPaid = previousAmountInCash + previousAmountInEcash;
        const paidAmountChanged = newTotalPaid !== previousTotalPaid;

        await dispatch(
          updateService({
            serviceId: service._id,
            serviceData: {
              name: serviceNameValue,
              description: serviceDescription,
              total_amount: parseFloat(serviceTotalAmount) || 0,
              amount_in_cash: newAmountInCash,
              amount_in_ecash: newAmountInEcash,
              balance: balance,
              status: serviceStatus,
              customer_id: serviceCustomerId || null,
              received_date: serviceReceivedDate || getCurrentDate(),
              return_date: serviceReturnDate || getCurrentDate(),
              note: serviceNote || "",
            },
          })
        ).unwrap();

        // Handle sales update when paid amounts change
        if (paidAmountChanged && newTotalPaid > 0) {
          try {
            // Find existing sales for this service
            const existingSales = sales?.filter(
              (sale) => sale.service_id?._id === service._id || sale.service_id === service._id
            );

            // Update or create cash sale
            if (newAmountInCash > 0) {
              const cashSale = existingSales?.find(s => s.payment_method === 'cash');
              if (cashSale) {
                await dispatch(
                  updateSale({
                    saleId: cashSale._id || cashSale.id,
                    saleData: {
                      paid_amount: newAmountInCash,
                      cash_paid: newAmountInCash,
                      online_paid: 0,
                      total_amount: parseFloat(serviceTotalAmount) || 0,
                      balance: balance,
                      payment_method: 'cash',
                      customer_id: serviceCustomerId || null,
                      notes: `Service: ${serviceNameValue} (Cash)`,
                    },
                  })
                ).unwrap();
              } else {
                await dispatch(
                  createSale({
                    shop_id: service.shop_id?._id || service.shop_id,
                    user_id: service.user_id?._id || service.user_id,
                    customer_id: serviceCustomerId || null,
                    service_id: service._id,
                    total_amount: parseFloat(serviceTotalAmount) || 0,
                    paid_amount: newAmountInCash,
                    cash_paid: newAmountInCash,
                    online_paid: 0,
                    balance: balance,
                    payment_method: 'cash',
                    status: 'completed',
                    notes: `Service: ${serviceNameValue} (Cash)`,
                    items: [],
                  })
                ).unwrap();
              }
            } else if (newAmountInCash === 0 && previousAmountInCash > 0) {
              // If cash amount is set to 0, update existing cash sale to 0
              const cashSale = existingSales?.find(s => s.payment_method === 'cash');
              if (cashSale) {
                await dispatch(
                  updateSale({
                    saleId: cashSale._id || cashSale.id,
                    saleData: {
                      paid_amount: 0,
                      cash_paid: 0,
                      online_paid: 0,
                      total_amount: parseFloat(serviceTotalAmount) || 0,
                      balance: balance,
                    },
                  })
                ).unwrap();
              }
            }

            // Update or create ecash sale
            if (newAmountInEcash > 0) {
              const ecashSale = existingSales?.find(s => s.payment_method !== 'cash');
              if (ecashSale) {
                await dispatch(
                  updateSale({
                    saleId: ecashSale._id || ecashSale.id,
                    saleData: {
                      paid_amount: newAmountInEcash,
                      cash_paid: 0,
                      online_paid: newAmountInEcash,
                      total_amount: parseFloat(serviceTotalAmount) || 0,
                      balance: 0,
                      payment_method: 'upi',
                      customer_id: serviceCustomerId || null,
                      notes: `Service: ${serviceNameValue} (E-Cash)`,
                    },
                  })
                ).unwrap();
              } else {
                await dispatch(
                  createSale({
                    shop_id: service.shop_id?._id || service.shop_id,
                    user_id: service.user_id?._id || service.user_id,
                    customer_id: serviceCustomerId || null,
                    service_id: service._id,
                    total_amount: parseFloat(serviceTotalAmount) || 0,
                    paid_amount: newAmountInEcash,
                    cash_paid: 0,
                    online_paid: newAmountInEcash,
                    balance: 0,
                    payment_method: 'upi',
                    status: 'completed',
                    notes: `Service: ${serviceNameValue} (E-Cash)`,
                    items: [],
                  })
                ).unwrap();
              }
            } else if (newAmountInEcash === 0 && previousAmountInEcash > 0) {
              // If ecash amount is set to 0, update existing ecash sale to 0
              const ecashSale = existingSales?.find(s => s.payment_method !== 'cash');
              if (ecashSale) {
                await dispatch(
                  updateSale({
                    saleId: ecashSale._id || ecashSale.id,
                    saleData: {
                      paid_amount: 0,
                      cash_paid: 0,
                      online_paid: 0,
                      total_amount: parseFloat(serviceTotalAmount) || 0,
                      balance: balance,
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
      } finally {
        setIsUpdatingService(false);
      }
    };

    const totalPaid = (parseFloat(serviceAmountInCash) || 0) + (parseFloat(serviceAmountInEcash) || 0);
    const balance = parseFloat(serviceTotalAmount) - totalPaid;

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
                  {service.name}
                </Text>
              </TouchableOpacity>

              <View
                style={{
                  flexDirection: "row",
                  gap: 20,
                  marginLeft: 10,
                  flexWrap: "wrap",
                  margin: 0,
                }}
              >
                <Text
                  style={{
                    color: "#666",
                    fontSize: 12,
                    maxWidth: 60,
                    flexShrink: 1,
                  }}
                  numberOfLines={2}
                  ellipsizeMode="tail"
                >
                  <Text>To:{"\n "}</Text>
                  <Text style={{ color: primaryColor }}>
                    {service.customer_id?.name || "N/A"}
                  </Text>
                </Text>
                <Text
                  style={{
                    color: "#666",
                    fontSize: 12,
                    maxWidth: 60,
                    flexShrink: 1,
                  }}
                  numberOfLines={2}
                  ellipsizeMode="tail"
                >
                  <Text>By:{"\n "}</Text>
                  <Text style={{ color: primaryColor }}>
                    {service.user_id?.username || "N/A"}
                  </Text>
                </Text>
                <Text
                  style={{
                    color: "#666",
                    fontSize: 12,
                    maxWidth: 60,
                    flexShrink: 1,
                  }}
                  numberOfLines={2}
                  ellipsizeMode="tail"
                >
                  <Text>Shop:{"\n "}</Text>
                  <Text style={{ color: primaryColor }}>
                    {service.shop_id?.name || "N/A"}
                  </Text>
                </Text>
                <Text
                  style={{
                    color: "#666",
                    fontSize: 12,
                    maxWidth: 80,
                    flexShrink: 1,
                  }}
                  numberOfLines={2}
                  ellipsizeMode="tail"
                >
                  <Text>Balance:{"\n "}</Text>
                  <Text style={{ color: primaryColor }}>
                    ₹{service.balance?.toString() || "0"}
                  </Text>
                </Text>
              </View>
            </View>
          </View>
        </View>

        {showDetails && (
          <View style={{ marginTop: 5, width: "100%" }}>
            <TextInput
              style={global.input}
              placeholder="Service Name *"
              value={serviceNameValue}
              onChangeText={setServiceNameValue}
              editable={!isUpdatingService}
            />

            <TextInput
              style={global.input}
              placeholder="Description"
              value={serviceDescription}
              onChangeText={setServiceDescription}
              multiline
              editable={!isUpdatingService}
            />

            {customers.length > 0 && (
              <View style={{ ...global.input, padding: 0, opacity: isUpdatingService ? 0.6 : 1 }}>
                <Picker
                  selectedValue={serviceCustomerId}
                  onValueChange={(itemValue) => setServiceCustomerId(itemValue)}
                  enabled={!isUpdatingService}
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
              editable={!isUpdatingService}
            />

            <TextInput
              style={global.input}
              placeholder="Amount in Cash"
              value={serviceAmountInCash}
              onChangeText={setServiceAmountInCash}
              keyboardType="decimal-pad"
              editable={!isUpdatingService}
            />

            <TextInput
              style={global.input}
              placeholder="Amount in E-Cash"
              value={serviceAmountInEcash}
              onChangeText={setServiceAmountInEcash}
              keyboardType="decimal-pad"
              editable={!isUpdatingService}
            />

            {serviceTotalAmount && (serviceAmountInCash || serviceAmountInEcash) && (
              <Text style={{ marginTop: 5, marginBottom: 5, color: "#666" }}>
                Balance: ₹{balance.toFixed(2)}
              </Text>
            )}

            <TextInput
              style={global.input}
              placeholder="Received Date (YYYY-MM-DD) *"
              value={serviceReceivedDate}
              onChangeText={setServiceReceivedDate}
              editable={!isUpdatingService}
            />

            <TextInput
              style={global.input}
              placeholder="Return Date (YYYY-MM-DD) *"
              value={serviceReturnDate}
              onChangeText={setServiceReturnDate}
              editable={!isUpdatingService}
            />

            <TextInput
              style={global.input}
              placeholder="Note"
              value={serviceNote}
              onChangeText={setServiceNote}
              multiline
              editable={!isUpdatingService}
            />

            <View style={{ ...global.input, padding: 0, marginTop: 10, opacity: isUpdatingService ? 0.6 : 1 }}>
              <Picker
                selectedValue={serviceStatus}
                onValueChange={(itemValue) => setServiceStatus(itemValue)}
                enabled={!isUpdatingService}
              >
                <Picker.Item label="Pending" value="pending" />
                <Picker.Item label="In Progress" value="in_progress" />
                <Picker.Item label="Completed" value="completed" />
                <Picker.Item label="Cancelled" value="cancelled" />
              </Picker>
            </View>

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
                  backgroundColor: "#ba181b",
                  opacity: isUpdatingService ? 0.6 : 1,
                }}
                onPress={() => handleDeleteService(service._id)}
                disabled={isUpdatingService}
              >
                <Text style={global.btnText}>Delete</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  ...global.button1,
                  opacity: isUpdatingService ? 0.6 : 1,
                }}
                onPress={handleUpdateService}
                disabled={isUpdatingService}
              >
                {isUpdatingService ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={global.btnText1}>Save {serviceNameValue}</Text>
                )}
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
    const cashAmount = parseFloat(amountInCash) || 0;
    const ecashAmount = parseFloat(amountInEcash) || 0;
    const totalPaid = cashAmount + ecashAmount;
    const balance = total - totalPaid;

    setIsAddingService(true);
    try {
      const servicesResult = await dispatch(
        createService({
          name: serviceName,
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
        })
      ).unwrap();

      // Create sales if amounts > 0
      if (totalPaid > 0) {
        try {
          // Find the newly created service from the result (most recent one with matching name)
          const createdService = servicesResult?.find(
            (s) => s.name === serviceName
          ) || servicesResult?.[servicesResult.length - 1]; // Fallback to last service if not found

          if (createdService && createdService._id) {
            // Create cash sale if amount in cash > 0
            if (cashAmount > 0) {
              await dispatch(
                createSale({
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
                })
              ).unwrap();
            }
            // Create ecash sale if amount in ecash > 0
            if (ecashAmount > 0) {
              await dispatch(
                createSale({
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
                })
              ).unwrap();
            }
            // Refresh sales in HomeScreen
            dispatch(fetchSales());
          }
        } catch (salesError) {
          console.error("Sales creation error:", salesError);
          // Don't fail the service creation if sales creation fails
        }
      }

      dispatch(
        showToast({
          message: "Service created successfully!",
          type: "success",
        })
      );
      setServiceName("");
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

  const handleScrollServices = (event) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isAtBottom =
      layoutMeasurement.height + contentOffset.y >= contentSize.height - 50;

    if (isAtBottom && !isLoadingMoreServices) {
      setIsLoadingMoreServices(true);
      setDisplayLimitServices((prev) => prev + 10);
    }
  };

  const handleLoadMoreServices = () => {
    if (isLoadingMoreServices) return;
    setIsLoadingMoreServices(true);
    setDisplayLimitServices((prev) => prev + 10);
  };

  useEffect(() => {
    if (isLoadingMoreServices) {
      setIsLoadingMoreServices(false);
    }
  }, [displayLimitServices, isLoadingMoreServices]);

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
        onScroll={handleScrollServices}
        scrollEventThrottle={400}
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
                placeholder="Amount in Cash"
                value={amountInCash}
                onChangeText={setAmountInCash}
                keyboardType="decimal-pad"
              />

              <TextInput
                style={global.input}
                placeholder="Amount in E-Cash"
                value={amountInEcash}
                onChangeText={setAmountInEcash}
                keyboardType="decimal-pad"
              />

              {totalAmount && (amountInCash || amountInEcash) && (
                <Text style={{ marginTop: 5, marginBottom: 5, color: "#666" }}>
                  Balance: ₹{(parseFloat(totalAmount || 0) - (parseFloat(amountInCash || 0) + parseFloat(amountInEcash || 0))).toFixed(2)}
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

        {/* Shop filter chips */}
        {role !== "staff" && shops.length > 0 && (
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 8,
              marginTop: 8,
              marginBottom: 4,
            }}
          >
            <TouchableOpacity
              onPress={() => setFilterShopId("")}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: filterShopId === "" ? primaryColor : "#ccc",
                backgroundColor: filterShopId === "" ? primaryColor : "#fff",
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  color: filterShopId === "" ? "#fff" : "#333",
                }}
              >
                All Shops
              </Text>
            </TouchableOpacity>

            {shops.map((shop) => {
              const id = shop._id;
              const isActive = filterShopId === id;
              return (
                <TouchableOpacity
                  key={id}
                  onPress={() => setFilterShopId(id)}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: isActive ? primaryColor : "#ccc",
                    backgroundColor: isActive ? primaryColor : "#fff",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      color: isActive ? "#fff" : "#333",
                    }}
                  >
                    {shop.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

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
          const baseServices =
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

          const filteredServices = baseServices.filter((service) => {
            if (!filterShopId) return true;
            const serviceShopId = service.shop_id?._id || service.shop_id;
            return serviceShopId === filterShopId;
          });

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

          const sortedServices = [...filteredServices].sort((a, b) => {
            const dateA =
              activeTab === 0
                ? a.received_date
                  ? new Date(a.received_date).getTime()
                  : 0
                : a.return_date
                  ? new Date(a.return_date).getTime()
                  : 0;
            const dateB =
              activeTab === 0
                ? b.received_date
                  ? new Date(b.received_date).getTime()
                  : 0
                : b.return_date
                  ? new Date(b.return_date).getTime()
                  : 0;
            return dateB - dateA;
          });

          const paginatedServices = sortedServices.slice(
            0,
            displayLimitServices
          );
          const hasMoreServices = sortedServices.length > paginatedServices.length;

          const groupedServices = paginatedServices.reduce((acc, service) => {
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

          return (
            <>
              {sortedDates.map((date) => (
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
              ))}

              {hasMoreServices && isLoadingMoreServices && (
                <View
                  style={{
                    alignItems: "center",
                    paddingVertical: 20,
                  }}
                >
                  <ActivityIndicator size="small" color={primaryColor} />
                  <Text style={{ marginTop: 8, color: "#999", fontSize: 12 }}>
                    Loading more services...
                  </Text>
                </View>
              )}

              {hasMoreServices && !isLoadingMoreServices && (
                <View
                  style={{
                    alignItems: "center",
                    paddingVertical: 15,
                    gap: 8,
                  }}
                >
                  <Text
                    style={{
                      textAlign: "center",
                      color: "#999",
                      fontSize: 12,
                    }}
                  >
                    Showing {paginatedServices.length} of {sortedServices.length} services • Scroll for more
                  </Text>
                  <TouchableOpacity
                    onPress={handleLoadMoreServices}
                    style={{
                      ...global.button1,
                      paddingVertical: 8,
                      minWidth: 140,
                      alignItems: "center",
                    }}
                  >
                    <Text style={global.btnText}>Load more</Text>
                  </TouchableOpacity>
                </View>
              )}

              {!hasMoreServices && sortedServices.length > 10 && (
                <Text
                  style={{
                    textAlign: "center",
                    color: "#999",
                    fontSize: 12,
                    paddingVertical: 15,
                  }}
                >
                  All {sortedServices.length} services loaded
                </Text>
              )}
            </>
          );
        })()}
      </ScrollView>
    </TouchableWithoutFeedback>
  );
};

export default ServicesScreen;
