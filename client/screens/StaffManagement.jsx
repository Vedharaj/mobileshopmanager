import React, { useState, useEffect, useRef } from "react";
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
import { Picker } from '@react-native-picker/picker'; // Corrected Picker import
import { global, useThemeColors } from "../styles/global"; // Import useThemeColors
import { useDispatch, useSelector } from "react-redux";
import { fetchStaff, createStaff, deleteStaff, updateStaff } from "../store/slices/staffSlice";
import { AntDesign, MaterialIcons } from "@expo/vector-icons";
import { showToast } from "../store/slices/toastSlice";

const StaffManagement = () => {
  const dispatch = useDispatch();

  const { staff, status, error } = useSelector((state) => state.staff);
  const { shops } = useSelector((state) => state.shops); // Get shops from Redux
  const { primaryColor } = useThemeColors(); // Use the hook to get primaryColor

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState(""); // New state for email
  const [contactNo, setContactNo] = useState(""); // New state for contact number
  const [selectedShopId, setSelectedShopId] = useState(""); // State for selected shop
  const [isUsernameFocused, setIsUsernameFocused] = useState(false);
  const initializedRef = useRef(false);

  useEffect(() => {
    // Only run once on mount
    if (initializedRef.current) return;
    initializedRef.current = true;

    // Staff is not pre-loaded in App.js (owner-specific data)
    // Fetch if not already loaded
    const loadStaff = async () => {
      try {
        if (!staff || staff.length === 0) {
          await dispatch(fetchStaff()).unwrap();
        }
      } catch (error) {
        console.error('Error loading staff data:', error);
        dispatch(
          showToast({
            message: error || "Failed to load staff",
            type: "error",
          })
        );
      }
    };
    loadStaff();

    // Set initial selected shop if shops are available
    if (shops.length > 0) {
      setSelectedShopId(shops[0]._id);
    }
  }, []); // Add shops to dependency array

  const handleDeleteStaff = async (staffId) => {
    try {
      Alert.alert("Delete Staff", "Do you want to delete this staff member?", [
        { text: "Cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await dispatch(deleteStaff(staffId)).unwrap();
            dispatch(
              showToast({
                message: "Staff deleted!",
                type: "success",
              })
            );
          },
        },
      ]);
    } catch (error) {
      dispatch(
        showToast({
          message: error || "Failed to delete staff",
          type: "error",
        })
      );
      console.error("Staff deletion error:", error);
    }
  };

  const StaffContainer = ({ staff }) => {
    const [showDetails, setShowDetails] = useState(false);
    const [staffUsername, setStaffUsername] = useState(staff.username);
    const [staffPassword, setStaffPassword] = useState(staff.password);
    const [staffEmail, setStaffEmail] = useState(staff.email || ""); // New state for email
    const [staffContactNo, setStaffContactNo] = useState(staff.contact_no || ""); // New state for contact number

    const handleUpdateStaff = async () => {
      if (
        staffUsername === staff.username &&
        staffPassword === staff.password &&
        staffEmail === (staff.email || "") && // Compare email
        staffContactNo === (staff.contact_no || "") // Compare contact_no
      ) {
        dispatch(showToast({
          message: "No changes made to staff details",
          type: "info",
        }));
        setShowDetails(false);
        return;
      }
      try {
        await dispatch(updateStaff({
          staffId: staff._id,
          staffData: {
            username: staffUsername,
            password: staffPassword,
            email: staffEmail, // Pass email
            contact_no: staffContactNo, // Pass contact_no
          },
        })).unwrap();
        dispatch(showToast({
          message: `Staff "${staffUsername}" updated successfully!`, // Dynamic message
          type: "success",
        }));
        setShowDetails(false);
      } catch (error) {
        const errorMessage = error.message || error.msg || "Failed to update staff";
        dispatch(showToast({
          message: errorMessage,
          type: "error",
        }));
        console.error("Staff update error:", error);
      }
    };

    return (
      <View
        key={staff._id}
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
                setIsUsernameFocused(false);
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
                {staff.username}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={{ marginLeft: "auto" }}>
            <TouchableOpacity onPress={() => handleDeleteStaff(staff._id)}>
              <MaterialIcons name="delete" size={24} color="#ba181b" />
            </TouchableOpacity>
          </View>
        </View>

        {showDetails && (
          <View style={{ marginTop: 10, width: "100%" }}>
            <TextInput
              style={global.input}
              placeholder="Username *"
              value={staffUsername}
              onChangeText={setStaffUsername}
            />

            <TextInput
              style={global.input}
              placeholder="Password *"
              value={staffPassword}
              onChangeText={setStaffPassword}
              secureTextEntry
            />
            <TextInput
              style={global.input}
              placeholder="Email"
              value={staffEmail}
              onChangeText={setStaffEmail}
              keyboardType="email-address"
            />

            <TextInput
              style={global.input}
              placeholder="Contact Number"
              value={staffContactNo}
              onChangeText={setStaffContactNo}
              keyboardType="phone-pad"
            />
            <View>
              <TouchableOpacity
                style={{ marginTop: 10, ...global.button1 }}
                onPress={handleUpdateStaff}
              >
                <Text style={global.btnText}>Save {staffUsername}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  const handleAddStaff = async () => {
    const trimmedUsername = username.trim();
    console.log(trimmedUsername, password);
    if (!trimmedUsername || !password || !selectedShopId) { // Added selectedShopId validation
      dispatch(
        showToast({
          message: "Please enter username, password and select a shop", // Updated message
          type: "error",
        })
      );
      return;
    }

    // Check for duplicate username
    const isDuplicate = staff.some(s => s.username.toLowerCase() === trimmedUsername.toLowerCase());
    if (isDuplicate) {
      dispatch(
        showToast({
          message: `Username "${trimmedUsername}" already exists`,
          type: "error",
        })
      );
      return;
    }

    try {
      await dispatch(createStaff({ username: trimmedUsername, password, email, contactNo, shopId: selectedShopId })).unwrap(); // Pass email and contact_no

      dispatch(
        showToast({
          message: "Staff created successfully!",
          type: "success",
        })
      );
      setUsername("");
      setPassword("");
      setEmail(""); // Clear email field
      setContactNo(""); // Clear contact number field
      setSelectedShopId(shops.length > 0 ? shops[0]._id : ""); // Reset selected shop
      setIsUsernameFocused(false);
      Keyboard.dismiss();
    } catch (err) {
      dispatch(
        showToast({
          message: err || "Failed to create staff",
          type: "error",
        })
      );
    }
  };

  return (
    <TouchableWithoutFeedback onPress={() => { Keyboard.dismiss(); setIsUsernameFocused(false); }}>
      <ScrollView style={global.mainContainer} contentContainerStyle={{ paddingBottom: 30 }}>
        <View style={{ marginTop: 10 }}>
          <Text style={{ marginBottom: 10 }}>Add Staff</Text>
          <TextInput
            style={global.input}
            placeholder="Username *"
            value={username}
            onChangeText={setUsername}
            onFocus={() => setIsUsernameFocused(true)}
          />

          {isUsernameFocused && (
            <>
              <TextInput
                style={global.input}
                placeholder="Password *"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
              <TextInput
                style={global.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
              />

              <TextInput
                style={global.input}
                placeholder="Contact Number"
                value={contactNo}
                onChangeText={setContactNo}
                keyboardType="phone-pad"
              />
              {shops.length > 0 && (
                <View style={{ ...global.input, padding: 0 }}>
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
              <View style={{ alignItems: "flex-end" }}>
                <TouchableOpacity
                  style={{ marginTop: 10, ...global.button1, width: "30%" }}
                  onPress={handleAddStaff}
                >
                  <Text style={global.btnText}>Add</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
        <Text style={{ marginBottom: 5, marginTop: 20 }}>Staff List</Text>
        {staff.map((staffItem) => (
          <StaffContainer key={staffItem._id} staff={staffItem} />
        ))}
      </ScrollView>
    </TouchableWithoutFeedback>
  );
};

export default StaffManagement;
