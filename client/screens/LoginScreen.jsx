import React, { useState, useContext } from 'react';
import { View, TextInput, Button, Text, Alert } from 'react-native';
import API from '../api';
import AuthContext from '../context/AuthContext';
import { global } from '../styles/global';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signIn } = useContext(AuthContext);

  const handleLogin = async () => {
    try {
      const res = await API.post('/auth/login', { email, password });
      signIn(res.data.token);
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.msg || 'Login failed');
    }
  };

  return (
    <View style={{...global.container, justifyContent: 'center', paddingHorizontal: 16,}}>
      <Text style={global.label}>Email</Text>
      <TextInput style={global.input} value={email} onChangeText={setEmail} autoCapitalize="none" />

      <Text style={global.label}>Password</Text>
      <TextInput style={global.input} value={password} onChangeText={setPassword} secureTextEntry />

      <Button title="Login" onPress={handleLogin} />
      <View style={{ height: 12 }} />
      <Button title="Create account" onPress={() => navigation.navigate('Register')} />
    </View>
  );
}