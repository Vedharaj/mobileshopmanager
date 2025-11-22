import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { global } from '../styles/global';

const Navbar = ({ name = "Mobile Shop", onLogout }) => {
  // Format current date
  const today = new Date();
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const formattedDate = `${today.getDate()} ${months[today.getMonth()]} ${today.getFullYear()}`;

  return (
    <View style={global.navbarContainer}>
      {/* Left: Name */}
      <Text style={global.navbarName}>{name}</Text>

      <View style={global.navbarRight}>
        {/* Current Date */}
        <Text style={global.navbarDate}>{formattedDate}</Text>

        {/* Logout Icon */}
        <TouchableOpacity onPress={onLogout}>
          <MaterialIcons name="logout" size={24} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Navbar;
