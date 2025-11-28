// HomeScreen.jsx
import React, { useEffect, useState, useRef, useContext } from "react";
import { View, Text, TouchableOpacity, Alert, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { global } from "../styles/global";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../store/slices/authSlice";

export default function HomeScreen() {
  const { role } = useSelector((state) => state.auth);
  const { shops } = useSelector((state) => state.shops);
  const appName = shops.length > 0 ? shops[0].shop_name : "My Store";
  const dispatch = useDispatch();

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
          {appName}
          {"\n"}
          <Text style={global.navbarRole}>{role || "User"}</Text>
        </Text>

        <View style={global.navbarRight}>
          <Text style={global.navbarDate}>{formattedDate}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
