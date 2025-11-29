// HomeScreen.jsx
import React, { useEffect, useState, useRef, useContext } from "react";
import { View, Text, TouchableOpacity, Alert, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { global, useThemeColors } from "../styles/global";
import { useDispatch, useSelector } from "react-redux";

export default function HomeScreen() {
  const { role, username } = useSelector((state) => state.auth);
  const { shops } = useSelector((state) => state.shops);
  const dispatch = useDispatch();
  const { primaryColor } = useThemeColors();

  const today = new Date();
  const months = [
    "Jan",
  "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const formattedDate = `${today.getDate()} ${
    months[today.getMonth()]
  } ${today.getFullYear()}`;

  return (
    <SafeAreaView style={global.safeArea}>
      <StatusBar
        className="statusBarStyleHomeScreen"
        barStyle="dark-content"
        backgroundColor="#fff"
      />
      {/* Navbar */}
      <View style={{ ...global.navbarContainer, paddingTop: 2, elevation: 0 }}>
        <Text numberOfLines={2} style={global.navbarName}>
          {username}
          <Text>{"\n"}</Text>
          <Text style={{ ...global.navbarRole, color: primaryColor }}>{role || "User"}</Text>
        </Text>

        <View style={global.navbarRight}>
          <Text style={global.navbarDate}>{formattedDate}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
