import React, { useState, useContext, useEffect } from 'react';
import { View, TextInput, Button, Text, Alert, TouchableOpacity } from 'react-native';
import { useDispatch, useSelector } from "react-redux";
import { register, resetError } from "../store/slices/authSlice";
import { global } from '../styles/global';
import { showToast } from '../store/slices/toastSlice';

export default function RegisterScreen({ navigation }) {
  const dispatch = useDispatch();
  const { status, error } = useSelector((state) => state.auth);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  useEffect(() => {
    if (error) {
      dispatch(
        showToast({
          message: error || "Registration failed",
          type: "error",
        })
      );
    }

    if (status === "succeeded") {
      dispatch(
        showToast({
          message: "Account created successfully 🎉",
          type: "success",
        })
      );
    }
  }, [error, status, dispatch]);
  
  const submitRegister = () => {
    dispatch(register({email, password }));
  };

  const alreadyHaveAccountBtn = () => {
    dispatch(resetError());
    navigation.navigate("Login");
  };

  return (
    <View style={global.authcontainer}>
      <Text style={global.label}>Email</Text>
      <TextInput style={global.input} value={email} onChangeText={setEmail} autoCapitalize="none" />

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
