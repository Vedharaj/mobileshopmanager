import React, { useContext } from "react";
import { View, Text, Button, Alert, TouchableOpacity } from "react-native";
import { global } from "../styles/global";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../store/slices/authSlice";
import { AntDesign, Entypo, Ionicons } from "@expo/vector-icons";
import { PRIMARY_COLOR } from "../styles/global";

const ShopManagementData = [
  {
    id: 1,
    title: "Manage shop",
    icon: <Entypo name="shop" size={24} color={PRIMARY_COLOR} />,
    navigatePage: "ShopManagement",
  },
  {
    id: 2,
    title: "Staff Management",
    icon: <AntDesign name="team" size={24} color={PRIMARY_COLOR} />,
    navigatePage: "StaffManagement",
  },
];

const preferenceData = [
  {
    id: 1,
    title: "Theme",
    icon: (
      <Ionicons name="color-palette-outline" size={24} color={PRIMARY_COLOR} />
    ),
    navigatePage: "ThemeSettings",
  },
];

const ProfileScreen = ({ navigation }) => {
  const dispatch = useDispatch();

  const shops = useSelector((state) => state.shops.shops);
  const { role, username } = useSelector((state) => state.auth);

  const ProfileContainer = ({ data, children }) => {
    return (
      <View style={global.profileContainer}>
        {data &&
          data.map((item, index) => (
            <TouchableOpacity
              onPress={() => navigation.navigate(item.navigatePage)}
              key={item.id}
              style={
                index === data.length - 1 && !children
                  ? global.profileRowLast
                  : global.profileRow
              }
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
              >
                {item.icon}
                <Text>{item.title}</Text>
              </View>
              <AntDesign name="arrow-right" size={18} color="#b7b5b5ff" />
            </TouchableOpacity>
          ))}
        {children && <View style={global.profileRowLast}>{children}</View>}
      </View>
    );
  };

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
      Alert.alert("Error", "Failed to sign out");
    }
  };

  return (
    <View style={{ ...global.container, padding: 10 }}>
      <View style={global.profileHeader}>
        <View style={global.profileIcon}>
          <AntDesign name="shop" size={42} color="white" />
        </View>
        <View style={{ alignItems: "center" }}>
          <Text style={{ ...global.title, fontSize: 16 }}>{username}</Text>
          <Text style={{ color: "#717171ff" }}>{role}</Text>
        </View>
        <TouchableOpacity
          style={global.button1}
          onPress={() => navigation.navigate("EditProfile")}
        >
          <Text style={global.btnText1}>Edit Profile</Text>
        </TouchableOpacity>
      </View>
      {role === "owner" && (
        <>
          <Text
            style={{ ...global.subtitle, marginBottom: 10, marginStart: 16 }}
          >
            Shop Management
          </Text>
          <ProfileContainer data={ShopManagementData} />
        </>
      )}

      <Text
        style={{
          ...global.subtitle,
          marginBottom: 10,
          marginStart: 16,
          marginTop: 20,
        }}
      >
        Preference
      </Text>
      <ProfileContainer data={preferenceData}>
        <TouchableOpacity
          style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
          onPress={handleLogout}
        >
          <Entypo name="log-out" size={22} color="red" />
          <Text style={{ color: "red" }}>Sign Out</Text>
        </TouchableOpacity>
      </ProfileContainer>
    </View>
  );
};

export default ProfileScreen;
