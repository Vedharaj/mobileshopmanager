import React, { useState, useContext, useEffect } from 'react';
import { View, TextInput, Button, Text, Alert, TouchableOpacity } from 'react-native';
import { useDispatch, useSelector } from "react-redux";
import { register, resetError } from "../store/slices/authSlice";
import { fetchShops } from "../store/slices/shopsSlice";
import { global } from '../styles/global';
import { showToast } from '../store/slices/toastSlice';

export default function RegisterScreen({ navigation }) {
  const dispatch = useDispatch();
  const { status, error, token, shops } = useSelector((state) => state.auth);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  
  useEffect(() => {
    if (error) {
      dispatch(
        showToast({
          message: error || "Registration failed",
          type: "error",
        })
      );
    }

    if (status === "succeeded" && token) {
      dispatch(
        showToast({
          message: "Account created successfully 🎉",
          type: "success",
        })
      );
      dispatch(fetchShops());
      if (shops.length === 0)
        navigation.replace("welcome");
      else
        navigation.replace("Home");
    }
  }, [error, status, dispatch, token, shops, navigation]);
  
  const submitRegister = () => {
    dispatch(register({ email, password, username }));
  };

  const alreadyHaveAccountBtn = () => {
    dispatch(resetError());
    navigation.navigate("Login");
  };

  return (
    <View style={global.authcontainer}>
      <Text style={global.label}>Email</Text>
      <TextInput style={global.input} value={email} onChangeText={setEmail} autoCapitalize="none" />

      <Text style={global.label}>Username</Text>
      <TextInput style={global.input} value={username} onChangeText={setUsername} autoCapitalize="none" />

      <Text style={global.label}>Password</Text>
      <TextInput style={global.input} value={password} onChangeText={setPassword} secureTextEntry />

      <TouchableOpacity style={global.button} onPress={submitRegister}>
        <Text style={global.btnText}>
          {status === "loading" ? "Creating..." : "Register"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={alreadyHaveAccountBtn}>
        <Text style={global.authlink}>Already have an account? Login</Text>
      </TouchableOpacity>   
    </View>
  );
}
