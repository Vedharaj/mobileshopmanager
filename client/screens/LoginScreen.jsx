import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { login, resetError } from "../store/slices/authSlice";
import { fetchShops } from "../store/slices/shopsSlice";
import { global } from "../styles/global";
import { showToast } from "../store/slices/toastSlice";

export default function LoginScreen({ navigation }) {
  const dispatch = useDispatch();
  const { status, error } = useSelector((state) => state.auth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (error) {
      dispatch(
        showToast({
          message: error || "Login failed",
          type: "error",
        })
      );
    }
  }, [error, dispatch]);

  // Fetch shops after successful login
  useEffect(async() => {
    if (status === "succeeded") {
      await dispatch(fetchShops());
    }
  }, [status, dispatch]);

  const submitLogin = () => {
    if (!email || !password) {
      dispatch(
        showToast({
          message: "Please enter email and password",
          type: "error",
        })
      );
      return;
    }
    dispatch(login({ email, password }));
  };

  const createNewAcountBtn = () => {
    dispatch(resetError());
    navigation.navigate("Register");
  };

  return (
    <View style={global.authcontainer}>
      <Text style={global.label}>Email</Text>
      <TextInput
        style={global.input}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        placeholder="Enter your email"
        editable={status !== "loading"}
      />

      <Text style={global.label}>Password</Text>
      <TextInput
        style={global.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholder="Enter your password"
        editable={status !== "loading"}
      />

      <TouchableOpacity
        style={[global.button, status === "loading" && { opacity: 0.6 }]}
        onPress={submitLogin}
        disabled={status === "loading"}
      >
        <Text style={global.btnText}>
          {status === "loading" ? "Logging in..." : "Login"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={createNewAcountBtn}>
        <Text style={global.authlink}>Create New Account</Text>
      </TouchableOpacity>
    </View>
  );
}
