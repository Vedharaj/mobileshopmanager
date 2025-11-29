// WelcomeScreen.jsx
import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { global } from "../styles/global"; // your theme
import { showToast } from "../store/slices/toastSlice";
import { createShop, fetchShops } from "../store/slices/shopsSlice";

export default function WelcomeScreen({ navigation }) {
  const dispatch = useDispatch();

  const shopsStatus = useSelector((state) => state.shops.status);
  const shops = useSelector((state) => state.shops?.shops || []);

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
      // refresh shops in store to ensure app state is updated
      try {
        await dispatch(fetchShops()).unwrap();
      } catch (e) {
        // not fatal for navigation, but log for debugging
        console.warn('fetchShops after createShop failed', e);
      }

      dispatch(
        showToast({
          message: "Shop created successfully",
          type: "success",
        })
      );

      // ensure shops updated in store before navigating; sometimes store update can be slightly delayed
      const waitForShops = async (timeout = 2000) => {
        const interval = 100;
        let waited = 0;
        while (waited < timeout) {
          const current = (shops && shops.length) || 0;
          if (current > 0) return true;
          // small delay
          // eslint-disable-next-line no-await-in-loop
          await new Promise((r) => setTimeout(r, interval));
          waited += interval;
        }
        return false;
      };

      await waitForShops();

      // use reset to guarantee we land on Home
      if (navigation && typeof navigation.reset === 'function') {
        navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
      } else if (navigation && typeof navigation.replace === 'function') {
        navigation.replace('Home');
      } else if (navigation && typeof navigation.navigate === 'function') {
        navigation.navigate('Home');
      }
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
      <Text style={{ textAlign: "center", marginBottom: 20 }}>
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
