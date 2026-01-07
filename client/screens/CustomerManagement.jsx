import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { global, useThemeColors } from "../styles/global";
import { useDispatch, useSelector } from "react-redux";
import { fetchCustomers, createCustomer, deleteCustomer, updateCustomer } from "../store/slices/customerSlice";
import { AntDesign, MaterialIcons } from "@expo/vector-icons";
import { showToast } from "../store/slices/toastSlice";

const CustomerManagement = () => {
  const dispatch = useDispatch();

  const { customers, status, error } = useSelector((state) => state.customers);
  const { shops } = useSelector((state) => state.shops);
  const { role, user } = useSelector((state) => state.auth);
  const { primaryColor } = useThemeColors();
  const isStaff = role === "staff";

  const [name, setName] = useState("");
  const [phoneNo, setPhoneNo] = useState("");
  const [address, setAddress] = useState("");
  const [selectedShopId, setSelectedShopId] = useState("");
  const [isNameFocused, setIsNameFocused] = useState(false);

  // Load customers only once on mount
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        await dispatch(fetchCustomers()).unwrap();
      } catch (error) {
        console.error('Error loading customers data:', error);
        dispatch(
          showToast({
            message: (typeof error === 'string' ? error : error?.message) || "Failed to load customers",
            type: "error",
          })
        );
      }
    };
    loadCustomers();
  }, [dispatch]);

  // Set initial shop selection separately
  useEffect(() => {
    if (!selectedShopId) {
      if (role === "staff" && user?.shops?.length > 0) {
        const staffShopId = user.shops[0]?._id || user.shops[0];
        setSelectedShopId(staffShopId);
      } else if (shops.length > 0 && !isStaff) {
        setSelectedShopId(shops[0]._id);
      }
    }
  }, [shops, role, user, isStaff, selectedShopId]);

  const handleDeleteCustomer = async (customerId) => {
    try {
      Alert.alert("Delete Customer", "Do you want to delete this customer?", [
        { text: "Cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await dispatch(deleteCustomer(customerId)).unwrap();
            dispatch(
              showToast({
                message: "Customer deleted!",
                type: "success",
              })
            );
          },
        },
      ]);
    } catch (error) {
      dispatch(
        showToast({
          message: (typeof error === 'string' ? error : error?.message) || "Failed to delete customer",
          type: "error",
        })
      );
      console.error("Customer deletion error:", error);
    }
  };

  const CustomerContainer = ({ customer, isStaff }) => {
    const [showDetails, setShowDetails] = useState(false);
    const [customerName, setCustomerName] = useState(customer.name || "");
    const [customerPhoneNo, setCustomerPhoneNo] = useState(customer.phone_no || "");
    const [customerAddress, setCustomerAddress] = useState(customer.address || "");
    const [customerShopId, setCustomerShopId] = useState(customer.shop_id?._id || customer.shop_id || "");

    const handleUpdateCustomer = async () => {
      const currentShopId = customer.shop_id?._id || customer.shop_id || "";
      if (
        customerName === (customer.name || "") &&
        customerPhoneNo === (customer.phone_no || "") &&
        customerAddress === (customer.address || "") &&
        customerShopId === currentShopId
      ) {
        dispatch(showToast({
          message: "No changes made to customer details",
          type: "info",
        }));
        setShowDetails(false);
        return;
      }
      try {
        await dispatch(updateCustomer({
          customerId: customer._id,
          customerData: {
            name: customerName,
            phone_no: customerPhoneNo,
            address: customerAddress,
            shop_id: customerShopId,
          },
        })).unwrap();
        dispatch(showToast({
          message: `Customer "${customerName}" updated successfully!`,
          type: "success",
        }));
        setShowDetails(false);
      } catch (error) {
        const errorMessage = error.message || error.msg || "Failed to update customer";
        dispatch(showToast({
          message: errorMessage,
          type: "error",
        }));
        console.error("Customer update error:", error);
      }
    };

    return (
      <View
        key={customer._id}
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
                setIsNameFocused(false);
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
                {customer.name}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={{ marginLeft: "auto" }}>
            <TouchableOpacity onPress={() => handleDeleteCustomer(customer._id)}>
              <MaterialIcons name="delete" size={24} color="#ba181b" />
            </TouchableOpacity>
          </View>
        </View>

        {showDetails && (
          <View style={{ marginTop: 10, width: "100%" }}>
            <TextInput
              style={global.input}
              placeholder="Customer Name *"
              value={customerName}
              onChangeText={setCustomerName}
              editable={true}
            />

            {role !== "staff" && shops.length > 0 && (
              <View style={{ ...global.input, padding: 0 }}>
                <Picker
                  selectedValue={customerShopId}
                  onValueChange={(itemValue) => setCustomerShopId(itemValue)}
                  style={{ fontSize: 12 }}
                  itemStyle={{ fontSize: 12 }}
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

            <TextInput
              style={global.input}
              placeholder="Phone Number"
              value={customerPhoneNo}
              onChangeText={setCustomerPhoneNo}
              keyboardType="phone-pad"
              editable={true}
            />

            <TextInput
              style={global.input}
              placeholder="Address"
              value={customerAddress}
              onChangeText={setCustomerAddress}
              multiline
              editable={true}
            />

            {true && (
              <View>
                <TouchableOpacity
                  style={{ marginTop: 10, ...global.button1 }}
                  onPress={handleUpdateCustomer}
                >
                  <Text style={global.btnText1}>Save {customerName}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  const handleAddCustomer = async () => {
    if (!name) {
      dispatch(
        showToast({
          message: "Please enter customer name",
          type: "error",
        })
      );
      return;
    }

    if (!selectedShopId) {
      dispatch(
        showToast({
          message: role === "staff" ? "Shop not selected" : "Please select a shop",
          type: "error",
        })
      );
      return;
    }

    try {
      await dispatch(createCustomer({
        name,
        phone_no: phoneNo,
        address: address,
        shop_id: selectedShopId,
      })).unwrap();

      dispatch(
        showToast({
          message: "Customer created successfully!",
          type: "success",
        })
      );
      setName("");
      setPhoneNo("");
      setAddress("");
      setIsNameFocused(false);
      Keyboard.dismiss();
    } catch (err) {
      dispatch(
        showToast({
          message: (typeof err === 'string' ? err : err?.message) || "Failed to create customer",
          type: "error",
        })
      );
    }
  };

  return (
    <TouchableWithoutFeedback onPress={() => { Keyboard.dismiss(); setIsNameFocused(false); }}>
      <View style={global.mainContainer}>
        {!isStaff && (
          <View style={{ marginTop: 10 }}>
            <Text style={{ marginBottom: 10 }}>Add Customer</Text>
            <TextInput
              style={global.input}
              placeholder="Customer Name *"
              value={name}
              onChangeText={setName}
              onFocus={() => setIsNameFocused(true)}
            />

          {isNameFocused && (
            <>
              {role !== "staff" && shops.length > 0 && (
                <View style={{ ...global.input, padding: 0 }}>
                  <Picker
                    selectedValue={selectedShopId}
                    onValueChange={(itemValue) => setSelectedShopId(itemValue)}
                    style={{ fontSize: 12 }}
                    itemStyle={{ fontSize: 12 }}
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

              <TextInput
                style={global.input}
                placeholder="Phone Number"
                value={phoneNo}
                onChangeText={setPhoneNo}
                keyboardType="phone-pad"
              />

              <TextInput
                style={global.input}
                placeholder="Address"
                value={address}
                onChangeText={setAddress}
                multiline
              />

              <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
                <TouchableOpacity
                  style={{ ...global.button1, width: "30%", backgroundColor: "#666" }}
                  onPress={() => {
                    setIsNameFocused(false);
                    setName("");
                    setPhoneNo("");
                    setAddress("");
                    Keyboard.dismiss();
                  }}
                >
                  <Text style={global.btnText}>Close</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ ...global.button1, width: "30%" }}
                  onPress={handleAddCustomer}
                >
                  <Text style={global.btnText}>Add</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
          </View>
        )}
        <Text style={{ marginBottom: 5, marginTop: isStaff ? 10 : 20 }}>Customer List</Text>
        {customers.map((customer) => (
          <CustomerContainer key={customer._id} customer={customer} isStaff={isStaff} />
        ))}
      </View>
    </TouchableWithoutFeedback>
  );
};

export default CustomerManagement;

