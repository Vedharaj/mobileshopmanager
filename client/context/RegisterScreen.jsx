import React, { useState, useContext } from 'react';
import { View, TextInput, Button, Text, Alert } from 'react-native';
import API from '../api';
import AuthContext from './AuthContext';
import { global } from '../styles/global';

export default function RegisterScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signIn } = useContext(AuthContext);

  const handleRegister = async () => {
    try {
      const res = await API.post('/auth/register', { username, email, password });
      signIn(res.data.token);
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.msg || 'Registration failed');
  }
  };

  return (
    <View style={{...global.container, justifyContent: 'center', paddingHorizontal: 16}}>
      <Text style={global.label}>Username</Text>
      <TextInput style={global.input} value={username} onChangeText={setUsername} autoCapitalize="none" />

      <Text style={global.label}>Email</Text>
      <TextInput style={global.input} value={email} onChangeText={setEmail} autoCapitalize="none" />

      <Text style={global.label}>Password</Text>
      <TextInput style={global.input} value={password} onChangeText={setPassword} secureTextEntry />

      <Button title="Register" onPress={handleRegister} />
      <View style={{ height: 10 }} />
      <Button title="Already have account? Login" onPress={() => navigation.navigate('Login')} />
    </View>
  );
}
