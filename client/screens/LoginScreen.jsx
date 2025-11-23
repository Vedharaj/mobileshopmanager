import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, globalheet } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { login } from "../store/slices/authSlice";
import { global } from "../styles/global";

export default function LoginScreen({ navigation }) {
  const dispatch = useDispatch();
  const { status, error } = useSelector((state) => state.auth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submitLogin = () => {
    dispatch(login({ email, password }));
  };

  return (
    <View style={{...global.container, justifyContent: 'center', paddingHorizontal: 16,}}>
      <Text style={global.label}>Email</Text>
      <TextInput style={global.input} value={email} onChangeText={setEmail} autoCapitalize="none" />

      <Text style={global.label}>Password</Text>
      <TextInput style={global.input} value={password} onChangeText={setPassword} secureTextEntry />

      {error && <Text style={global.error}>{error}</Text>}

      <TouchableOpacity style={global.button} onPress={submitLogin}>
        <Text style={global.btnText}>
          {status === "loading" ? "Logging in..." : "Login"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("Register")}>
        <Text style={global.authlink}>Create New Account</Text>
      </TouchableOpacity>
    </View>
  );
}