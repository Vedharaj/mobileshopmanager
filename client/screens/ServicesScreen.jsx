import React from 'react';
import { View, Text } from 'react-native';
import { global } from '../styles/global';
import Navbar from '../components/Navbar'; 

const ServicesScreen = () => {
  return (
    <View style={global.container}>
      <View style={global.navbarContainer}>
        <Text style={global.navbarName}>Services</Text>
      </View>
      <Text style={global.message}>Transaction history and details go here</Text>
    </View>
  );
};

export default ServicesScreen;