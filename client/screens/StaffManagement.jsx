import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
} from "react-native";
import { Picker } from "@react-native-picker/picker"; // Corrected Picker import
import { global, useThemeColors, useThemedStyles } from "../styles/global"; // Import useThemeColors and themed styles
import { useDispatch, useSelector } from "react-redux";
import {
  fetchStaff,
  createStaff,
  deleteStaff,
  updateStaff,
} from "../store/slices/staffSlice";
import { AntDesign, MaterialIcons } from "@expo/vector-icons";
import { showToast } from "../store/slices/toastSlice";

const StaffManagement = () => {
  const dispatch = useDispatch();

  const { staff, status, error } = useSelector((state) => state.staff);
  const { shops } = useSelector((state) => state.shops); // Get shops from Redux
  const {
    primaryColor,
    bgColor,
    textColor,
    textSecondary,
    cardBg,
    inputBg,
    inputBorder,
  } = useThemeColors(); // Use the hook to get theme colors
  const themedStyles = useThemedStyles();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState(""); // New state for email
  const [contactNo, setContactNo] = useState(""); // New state for contact number
  const [selectedShopId, setSelectedShopId] = useState(""); // State for selected shop
  const [isUsernameFocused, setIsUsernameFocused] = useState(false);

  useEffect(() => {
    const loadStaff = async () => {
      if (!staff || staff.length === 0) {
        dispatch(fetchStaff());
      }
    };
    loadStaff();

    // Set initial selected shop if shops are available
    if (shops.length > 0) {
      setSelectedShopId(shops[0]._id);
    }
  }, [dispatch, shops]); // Add shops to dependency array

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
    const [staffContactNo, setStaffContactNo] = useState(
      staff.contact_no || ""
    ); // New state for contact number

    const handleUpdateStaff = async () => {
      if (
        staffUsername === staff.username &&
        staffPassword === staff.password &&
        staffEmail === (staff.email || "") && // Compare email
        staffContactNo === (staff.contact_no || "") // Compare contact_no
      ) {
        dispatch(
          showToast({
            message: "No changes made to staff details",
            type: "info",
          })
        );
        setShowDetails(false);
        return;
      }
      try {
        await dispatch(
          updateStaff({
            staffId: staff._id,
            staffData: {
              username: staffUsername,
              password: staffPassword,
              email: staffEmail, // Pass email
              contact_no: staffContactNo, // Pass contact_no
            },
          })
        ).unwrap();
        dispatch(
          showToast({
            message: `Staff "${staffUsername}" updated successfully!`, // Dynamic message
            type: "success",
          })
        );
        setShowDetails(false);
      } catch (error) {
        const errorMessage =
          error.message || error.msg || "Failed to update staff";
        dispatch(
          showToast({
            message: errorMessage,
            type: "error",
          })
        );
        console.error("Staff update error:", error);
      }
    };

    return (
      <View key={staff._id} style={themedStyles.listStyle1}>
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
                color={textColor}
              />
              <Text style={{ color: textColor, fontSize: 16 }}>
                {staff.username}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={{ marginLeft: "auto" }}>
            <TouchableOpacity onPress={() => handleDeleteStaff(staff._id)}>
              <Text style={{ color: "#ba181b", fontSize: 16 }}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>

        {showDetails && (
          <View style={{ marginTop: 10, width: "100%" }}>
            <TextInput
              style={[
                global.input,
                {
                  backgroundColor: inputBg,
                  borderColor: inputBorder,
                  color: textColor,
                },
              ]}
              placeholder="Username *"
              placeholderTextColor={textSecondary}
              value={staffUsername}
              onChangeText={setStaffUsername}
            />

            <TextInput
              style={[
                global.input,
                {
                  backgroundColor: inputBg,
                  borderColor: inputBorder,
                  color: textColor,
                },
              ]}
              placeholder="Password *"
              placeholderTextColor={textSecondary}
              value={staffPassword}
              onChangeText={setStaffPassword}
              secureTextEntry
            />
            <TextInput
              style={[
                global.input,
                {
                  backgroundColor: inputBg,
                  borderColor: inputBorder,
                  color: textColor,
                },
              ]}
              placeholder="Email"
              placeholderTextColor={textSecondary}
              value={staffEmail}
              onChangeText={setStaffEmail}
              keyboardType="email-address"
            />

            <TextInput
              style={[
                global.input,
                {
                  backgroundColor: inputBg,
                  borderColor: inputBorder,
                  color: textColor,
                },
              ]}
              placeholder="Contact Number"
              placeholderTextColor={textSecondary}
              value={staffContactNo}
              onChangeText={setStaffContactNo}
              keyboardType="phone-pad"
            />
            <View>
              <TouchableOpacity
                style={{
                  marginTop: 10,
                  ...global.button1,
                  backgroundColor: primaryColor,
                }}
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
    console.log(username, password);
    if (!username || !password || !selectedShopId) {
      // Added selectedShopId validation
      dispatch(
        showToast({
          message: "Please enter username, password and select a shop", // Updated message
          type: "error",
        })
      );
      return;
    }

    try {
      await dispatch(
        createStaff({
          username,
          password,
          email,
          contactNo,
          shopId: selectedShopId,
        })
      ).unwrap(); // Pass email and contact_no

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
    <TouchableWithoutFeedback
      onPress={() => {
        Keyboard.dismiss();
        setIsUsernameFocused(false);
      }}
    >
      <View style={[global.mainContainer, { backgroundColor: bgColor }]}>
        <View style={{ marginTop: 10 }}>
          <Text style={{ marginBottom: 10, color: textColor }}>Add Staff</Text>
          <TextInput
            style={[
              global.input,
              {
                backgroundColor: inputBg,
                borderColor: inputBorder,
                color: textColor,
              },
            ]}
            placeholder="Username *"
            placeholderTextColor={textSecondary}
            value={username}
            onChangeText={setUsername}
            onFocus={() => setIsUsernameFocused(true)}
          />

          {isUsernameFocused && (
            <>
              <TextInput
                style={[
                  global.input,
                  {
                    backgroundColor: inputBg,
                    borderColor: inputBorder,
                    color: textColor,
                  },
                ]}
                placeholder="Password *"
                placeholderTextColor={textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
              <TextInput
                style={[
                  global.input,
                  {
                    backgroundColor: inputBg,
                    borderColor: inputBorder,
                    color: textColor,
                  },
                ]}
                placeholder="Email"
                placeholderTextColor={textSecondary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
              />

              <TextInput
                style={[
                  global.input,
                  {
                    backgroundColor: inputBg,
                    borderColor: inputBorder,
                    color: textColor,
                  },
                ]}
                placeholder="Contact Number"
                placeholderTextColor={textSecondary}
                value={contactNo}
                onChangeText={setContactNo}
                keyboardType="phone-pad"
              />
              {shops.length > 0 && (
                <View
                  style={{
                    ...global.input,
                    padding: 0,
                    backgroundColor: inputBg,
                    borderColor: inputBorder,
                  }}
                >
                  <Picker
                    selectedValue={selectedShopId}
                    onValueChange={(itemValue) => setSelectedShopId(itemValue)}
                    style={{ color: textColor }}
                    itemStyle={{ color: textColor }}
                    dropdownIconColor={textColor}
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
              <View style={{ alignItems: "flex-end" }}>
                <TouchableOpacity
                  style={{
                    marginTop: 10,
                    ...global.button1,
                    width: "30%",
                    backgroundColor: primaryColor,
                  }}
                  onPress={handleAddStaff}
                >
                  <Text style={global.btnText}>Add</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
        <Text style={{ marginBottom: 5, color: textColor }}>Staff List</Text>
        {staff.map((staffItem) => (
          <StaffContainer key={staffItem._id} staff={staffItem} />
        ))}
      </View>
    </TouchableWithoutFeedback>
  );
};

export default StaffManagement;
