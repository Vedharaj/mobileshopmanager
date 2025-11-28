import React, { useState, useContext, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { login, resetError, setCredentials } from "../store/slices/authSlice";
import { global } from "../styles/global";
import { showToast } from '../store/slices/toastSlice';

export default function LoginScreen({ navigation }) {
  const dispatch = useDispatch();
  const { status, error, token, user } = useSelector((state) => state.auth);

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
    
    if (status === "succeeded" && token) {
      // Token already saved in AsyncStorage by the thunk
      // and already set in Redux by login.fulfilled
      dispatch(
        showToast({
          message: "Login successful 🎉",
          type: "success",
        })
      );
      // Navigate to Home screen
      navigation.replace("Home");
    }
  }, [error, status, token, dispatch, navigation]);  // ADD navigation to deps
  
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
        style={[global.button, status === "loading" && {opacity: 0.6}]} 
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