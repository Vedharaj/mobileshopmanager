// HomeScreen.jsx
import React, { useEffect, useState, useRef, useContext } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { global } from '../styles/global';
import AuthContext from '../context/AuthContext';

export default function HomeScreen() {
  const { signOut } = useContext(AuthContext);
  const appName = "Mobile Shop";

  const onLogout = () => {
    // Your logout logic here: navigate to login, clear tokens, etc.
    Alert.alert("Logout", "Do you want to logout?", [
      { text: "Cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async() => {
          await signOut();
        },
      },
    ]);
  };

  const today = new Date();
  const months = [
    "Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"
  ];
  const formattedDate = `${today.getDate()} ${months[today.getMonth()]} ${today.getFullYear()}`;

  return (
    <SafeAreaView style={global.safeArea}>
      <StatusBar className="statusBarStyleHomeScreen" barStyle="dark-content" backgroundColor="#fff" />
      {/* Navbar */}
      <View style={{...global.navbarContainer, paddingTop: 2, elevation: 0}}>
        <Text numberOfLines={1} style={global.navbarName}>
          {appName}
        </Text>

        <View style={global.navbarRight}>
          <Text style={global.navbarDate}>{formattedDate}</Text>

          <TouchableOpacity
            onPress={onLogout}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={global.logoutBtn}
            accessibilityLabel="Logout"
          >
            <MaterialIcons name="logout" size={24} color="#111" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}