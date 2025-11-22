import React from 'react';
import { View, Text } from 'react-native';
import { global } from '../styles/global';

const StatsScreen = () => {
  return (
    <View style={global.container}>
      <View style={global.navbarContainer}>
        <Text style={global.navbarName}>Stats</Text>
      </View>
      <Text style={global.message}>Application statistics and metrics go here</Text>
    </View>
  );
};

export default StatsScreen;