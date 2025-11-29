import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
} from "react-native";
import { global, PRIMARY_COLOR } from "../styles/global";
import { useDispatch, useSelector } from "react-redux";
import { createShop, fetchShops, deleteShop, updateShop } from "../store/slices/shopsSlice";
import { AntDesign, MaterialIcons } from "@expo/vector-icons";
import { showToast } from "../store/slices/toastSlice";

const ShopManagement = () => {
  const dispatch = useDispatch();

  const { shops, status, error } = useSelector((state) => state.shops);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [contact_no, setContactNo] = useState("");
  const [isNameFocused, setIsNameFocused] = useState(false); // New state for focus

  const handleDeleteShop = async (shopId) => {
    try {
      Alert.alert("Delete Shop", "Do you want to delete this Shop?", [
        { text: "Cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await dispatch(deleteShop(shopId)).unwrap();
            dispatch(
              showToast({
                message: "Shop deleted!", // Changed message
                type: "success",
              })
            );
          },
        },
      ]);
    } catch (error) {
      dispatch(
        showToast({
          message: error || "Failed to delete shop",
          type: "error",
        })
      );
      console.error("Shop deletion error:", error);
    }
  };

  const ShopContainer = ({ shop }) => {
    const [showDetails, setShowDetails] = useState(false); // New state for toggling details
    const [shopName, setShopName] = useState(shop.name);
    const [shopEmail, setShopEmail] = useState(shop.email || ''); // Changed to shop.email
    const [shopAddress, setShopAddress] = useState(shop.address || '');
    const [shopContactNo, setShopContactNo] = useState(shop.contact_no || ''); // Changed to shop.contact_no

    const handleUpdateShop = async () => {
      // Check if any changes were made
      if (
        shopName === shop.name &&
        shopEmail === (shop.email || '') &&
        shopAddress === (shop.address || '') &&
        shopContactNo === (shop.contact_no || '')
      ) {
        dispatch(showToast({
          message: "No changes made to shop details",
          type: "info",
        }));
        setShowDetails(false);
        return;
      }

      try {
        await dispatch(updateShop({
          shopId: shop._id,
          shopData: {
            name: shopName,
            email: shopEmail,
            address: shopAddress,
            contact_no: shopContactNo,
          },
        })).unwrap();
        dispatch(showToast({
          message: `Shop "${shopName}" updated successfully!`, // Dynamic message
          type: "success",
        }));
        setShowDetails(false);
      } catch (error) {
          const errorMessage = error.message || error.msg || "Failed to update shop";
        dispatch(showToast({
          message: errorMessage,
          type: "error",
        }));
        console.error("Shop update error:", error);
      }
    };

    return (
      <View
        key={shop._id}
        style={{
          ...global.profileRow,
          // backgroundColor: "#f3f3f3ff",
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
            // gap: 10, // Removed gap
          }}
        >
          <View style={{ flexDirection: "row", gap: 10 }}>
            <TouchableOpacity
              onPress={() => {
                setShowDetails(!showDetails);
                setIsNameFocused(false); // Remove focus from add shop fields
                Keyboard.dismiss(); // Dismiss keyboard
              }}
              style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
            >
              <AntDesign
                style={{ marginTop: 5 }}
                name={showDetails ? "caret-up" : "caret-down"} // Dynamic icon name
                size={20}
                color="black"
              />
              <Text style={{ color: PRIMARY_COLOR, fontSize: 16 }}>
                {shop.name}
              </Text>
            </TouchableOpacity>
          </View>
          {shops.length > 1 && (
            <View style={{ marginLeft: "auto" }}>
              {/* Wrapper for delete icon */}
              <TouchableOpacity onPress={() => handleDeleteShop(shop._id)}>
                <MaterialIcons name="delete" size={24} color="#ba181b" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {showDetails && (
          <View style={{ marginTop: 10, width: "100%" }}>
            <TextInput
              style={global.input}
              placeholder="Store Name *"
              value={shopName}
              onChangeText={setShopName}
            />

            <TextInput
              style={global.input}
              placeholder="Email"
              value={shopEmail}
              onChangeText={setShopEmail}
              keyboardType="email-address"
            />

            <TextInput
              style={global.input}
              placeholder="Address"
              value={shopAddress}
              onChangeText={setShopAddress}
            />

            <TextInput
              style={global.input}
              placeholder="Contact Number"
              value={shopContactNo}
              onChangeText={setShopContactNo}
              keyboardType="phone-pad"
            />
            <View>
              <TouchableOpacity
                style={{ marginTop: 10, ...global.button1 }} // Removed width: "30%"
                onPress={handleUpdateShop}
              >
                <Text style={global.btnText}>Save {shopName}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  useEffect(() => {
    dispatch(fetchShops());
  }, [dispatch]);

  const handleCreateShop = async () => {
    if (!name) {
      dispatch(
        showToast({
          message: "Please enter your store name",
          type: "error",
        })
      );
      return;
    }

    try {
      await dispatch(createShop({ name, email, address, contact_no })).unwrap();

      dispatch(
        showToast({
          message: "Shop created successfully!",
          type: "success",
        })
      );
      // Clear text input fields after successful shop creation
      setName("");
      setEmail("");
      setAddress("");
      setContactNo("");
      setIsNameFocused(false); // Clear focus
      Keyboard.dismiss(); // Dismiss keyboard
    } catch (err) {
      dispatch(
        showToast({
          message: err || "Failed to create shop",
          type: "error",
        })
      );
    }
  };

  return (
    <TouchableWithoutFeedback onPress={() => { Keyboard.dismiss(); setIsNameFocused(false); }}>
      <View style={global.mainContainer}>
        <View style={{ marginTop: 10 }}>
          <Text style={{ marginBottom: 10 }}>Add Shop</Text>
          <TextInput
            style={global.input}
            placeholder="Store Name *"
            value={name}
            onChangeText={setName}
            onFocus={() => setIsNameFocused(true)}
          />

          {isNameFocused && (
            <>
              <TextInput
                style={global.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
              />

              <TextInput
                style={global.input}
                placeholder="Address"
                value={address}
                onChangeText={setAddress}
              />

              <TextInput
                style={global.input}
                placeholder="Contact Number"
                value={contact_no}
                onChangeText={setContactNo}
                keyboardType="phone-pad"
              />
              <View style={{ alignItems: "flex-end" }}>
                <TouchableOpacity
                  style={{ marginTop: 10, ...global.button1, width: "30%" }}
                  onPress={handleCreateShop}
                >
                  <Text style={global.btnText}>Save</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
        <Text style={{ marginBottom: 5, marginTop: 20 }}>Shop List</Text>
        {shops.map((shopItem) => (
          <ShopContainer key={shopItem._id} shop={shopItem} />
        ))}
      </View>
    </TouchableWithoutFeedback>
  );
};

export default ShopManagement;
