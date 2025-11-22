import React from 'react';
import { View, Text } from 'react-native';
import { global } from '../styles/global';

const StockScreen = () => {
  return (
    <View style={global.container}>
      <View style={global.navbarContainer}>
        <Text style={global.navbarName}>Stocks</Text>
      </View>
      <Text style={global.message}>Inventory and stock management goes here</Text>
    </View>
  );
};

export default StockScreen;