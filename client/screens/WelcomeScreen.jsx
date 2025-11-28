// WelcomeScreen.jsx
import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { global } from "../styles/global"; // your theme
import { showToast } from "../store/slices/toastSlice";
import { createShop } from "../store/slices/shopsSlice";

export default function WelcomeScreen({ navigation }) {
  const dispatch = useDispatch();

  const shopsStatus = useSelector((state) => state.shops.status);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [contact_no, setContactNo] = useState("");

  const handleSubmit = async () => {
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
          message: "Shop created successfully",
          type: "success",
        })
      );
      navigation.replace("Home");
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
    <View style={global.authcontainer}>
      <Text style={[global.title, { marginBottom: 10 }]}>Welcome 🎉</Text>
      <Text style={[global.subtitle, { marginBottom: 10 }]}>
        Let’s quickly set up your store
      </Text>

      <TextInput
        style={global.input}
        placeholder="Store Name *"
        value={name}
        onChangeText={setName}
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

      <TouchableOpacity
        style={[global.button, { marginTop: 20 }, shopsStatus === 'loading' && { opacity: 0.6 }]}
        onPress={handleSubmit}
        disabled={shopsStatus === 'loading'}
      >
        <Text style={global.btnText}>{shopsStatus === 'loading' ? 'Saving...' : 'Save & Continue'}</Text>
      </TouchableOpacity>
    </View>
  );
}
