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

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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

  const submitLogin = async () => {
    const cleanIdentifier = identifier.trim();
    const cleanPassword = password;

    if (!cleanIdentifier || !cleanPassword) {
      dispatch(
        showToast({
          message: "Please enter username/email and password",
          type: "error",
        })
      );
      return;
    }
    
    try {
      await dispatch(login({ identifier: cleanIdentifier, password: cleanPassword })).unwrap();
      // Fetch shops after successful login
      await dispatch(fetchShops()).unwrap();
    } catch (err) {
      console.error("Login error:", err);
    }
  };

  const createNewAcountBtn = () => {
    dispatch(resetError());
    navigation.navigate("Register");
  };

  return (
    <View style={global.authcontainer}>
      <Text style={[global.title, { textAlign: "center", marginBottom: 4 }]}>Mobx</Text>
      <Text style={{ textAlign: "center", color: "#666", marginBottom: 16 }}>
        Sign in
      </Text>

      <Text style={global.label}>Username or Email</Text>
      <TextInput
        style={global.input}
        value={identifier}
        onChangeText={setIdentifier}
        autoCapitalize="none"
        placeholder="Enter your username or email"
        editable={status !== "loading"}
      />

      <Text style={global.label}>Password</Text>
      <View style={{ width: "100%" }}>
        <TextInput
          style={[global.input, { paddingRight: 90 }]}
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          placeholder="Enter your password"
          editable={status !== "loading"}
        />
        <TouchableOpacity
          style={{ position: "absolute", right: 12, top: 14 }}
          onPress={() => setShowPassword((prev) => !prev)}
          disabled={status === "loading"}
        >
          <Text style={{ color: "#007bff", fontWeight: "600" }}>
            {showPassword ? "Hide" : "Show"}
          </Text>
        </TouchableOpacity>
      </View>

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
