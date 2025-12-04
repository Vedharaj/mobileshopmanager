import React from 'react';
import { View, Text } from 'react-native';
import { global } from '../styles/global';

const StatsScreen = () => {
  return (
    <View style={global.container}>
      <Text style={global.message}>Application statistics and metrics goes here</Text>
    </View>
  );
};

export default StatsScreen;