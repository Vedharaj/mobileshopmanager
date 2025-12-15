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
import { global, useThemeColors } from "../styles/global";
import { useDispatch, useSelector } from "react-redux";
import { fetchCustomers, createCustomer, deleteCustomer, updateCustomer } from "../store/slices/customerSlice";
import { AntDesign, MaterialIcons } from "@expo/vector-icons";
import { showToast } from "../store/slices/toastSlice";

const CustomerManagement = () => {
  const dispatch = useDispatch();

  const { customers, status, error } = useSelector((state) => state.customers);
  const { role } = useSelector((state) => state.auth);
  const { primaryColor } = useThemeColors();
  const isStaff = role === "staff";

  const [name, setName] = useState("");
  const [phoneNo, setPhoneNo] = useState("");
  const [address, setAddress] = useState("");
  const [isNameFocused, setIsNameFocused] = useState(false);

  useEffect(() => {
    const loadCustomers = async () => {
      dispatch(fetchCustomers());
    };
    loadCustomers();
  }, [dispatch]);

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
          message: error || "Failed to delete customer",
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

    const handleUpdateCustomer = async () => {
      if (
        customerName === (customer.name || "") &&
        customerPhoneNo === (customer.phone_no || "") &&
        customerAddress === (customer.address || "")
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
              editable={!isStaff}
            />

            <TextInput
              style={global.input}
              placeholder="Phone Number"
              value={customerPhoneNo}
              onChangeText={setCustomerPhoneNo}
              keyboardType="phone-pad"
              editable={!isStaff}
            />

            <TextInput
              style={global.input}
              placeholder="Address"
              value={customerAddress}
              onChangeText={setCustomerAddress}
              multiline
              editable={!isStaff}
            />

            {!isStaff && (
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

    try {
      await dispatch(createCustomer({
        name,
        phone_no: phoneNo,
        address: address,
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
          message: err || "Failed to create customer",
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

