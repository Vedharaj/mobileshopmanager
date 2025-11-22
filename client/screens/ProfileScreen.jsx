import React, { useContext } from 'react';
import { View, Text, Button, Alert } from 'react-native';
import { global } from '../styles/global';
import AuthContext from '../context/AuthContext';

const ProfileScreen = () => {
  const { signOut } = useContext(AuthContext);

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (err) {
      Alert.alert('Error', 'Failed to sign out');
    }
  };

  return (
    <View style={global.container}>
      <View style={global.navbarContainer}>
        <Text style={global.navbarName}>Profile</Text>
      </View>
      <Text style={global.message}>User profile information goes here</Text>
      <Button title="Sign Out" onPress={handleLogout} />
    </View>
  );
};

export default ProfileScreen;