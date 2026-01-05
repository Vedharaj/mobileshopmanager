import React, { useContext } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { global, useThemedStyles } from '../styles/global';
import { useDispatch } from 'react-redux';
import { logout } from '../store/slices/authSlice';


const Navbar = () => {
  const dispatch = useDispatch();
  const themedStyles = useThemedStyles();

  // Format current date
  const today = new Date();
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const formattedDate = `${today.getDate()} ${months[today.getMonth()]} ${today.getFullYear()}`;

  return (
    <View style={themedStyles.navbarContainer}>
      {/* Left: Name */}
      <Text style={themedStyles.navbarName}>{name}</Text>

      <View style={global.navbarRight}>
        {/* Current Date */}
        <Text style={themedStyles.navbarDate}>{formattedDate}</Text>

        {/* Logout Icon */}
        <TouchableOpacity
          onPress={() => {
            // console.log('Logout pressed');
            dispatch(logout());
          }}
          accessibilityLabel="Logout"
        >
          <Text>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Navbar;
