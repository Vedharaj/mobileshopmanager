import React, { useState, useContext } from 'react';
import { View, TextInput, Button, Text, Alert, TouchableOpacity } from 'react-native';
import { useDispatch, useSelector } from "react-redux";
import { register } from "../store/slices/authSlice";
import { global } from '../styles/global';

export default function RegisterScreen({ navigation }) {
  const dispatch = useDispatch();
  const { status, error } = useSelector((state) => state.auth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submitRegister = () => {
    dispatch(register({email, password }));
  };

  return (
    <View style={global.container}>
      <Text style={global.label}>Email</Text>
      <TextInput style={global.input} value={email} onChangeText={setEmail} autoCapitalize="none" />

      <Text style={global.label}>Password</Text>
      <TextInput style={global.input} value={password} onChangeText={setPassword} secureTextEntry />
      
      {error && <Text style={global.error}>{error}</Text>}

      <TouchableOpacity style={global.button} onPress={submitRegister}>
        <Text style={global.btnText}>
          {status === "loading" ? "Creating..." : "Register"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("Login")}>
        <Text style={global.authlink}>Already have an account? Login</Text>
      </TouchableOpacity>   
    </View>
  );
}
