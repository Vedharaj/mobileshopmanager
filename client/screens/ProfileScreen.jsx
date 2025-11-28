import React, { useContext } from 'react';
import { View, Text, Button, Alert } from 'react-native';
import { global } from '../styles/global';
import { useDispatch } from 'react-redux';
import { logout } from '../store/slices/authSlice';

const ProfileScreen = () => {
  const dispatch = useDispatch();

  const handleLogout = async () => {
    try {
      Alert.alert("Logout", "Do you want to logout?", [
            { text: "Cancel" },
            {
              text: "Logout",
              style: "destructive",
              onPress: () => {
                dispatch(logout());
              },
            },
          ]);
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