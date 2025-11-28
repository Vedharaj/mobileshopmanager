import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { global } from '../styles/global';

export default function WelcomeScreen({ navigation }) {
  return (
    <View style={global.container}>
      <Text style={global.message}>Welcome — set up your first shop</Text>

      <TouchableOpacity
        style={global.button}
        onPress={() => navigation.navigate('Home')}
      >
        <Text style={global.btnText}>Continue to Home</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{ marginTop: 12 }}
        onPress={() => navigation.navigate('Profile')}
      >
        <Text style={global.authlink}>Set up shops later in Profile</Text>
      </TouchableOpacity>
    </View>
  );
}