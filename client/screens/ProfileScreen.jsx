import React from "react";
import { View, Text, Alert, TouchableOpacity, ScrollView, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { global, useThemeColors, useThemedStyles, BAR_HEIGHT } from "../styles/global";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../store/slices/authSlice";
import { toggleDarkMode, saveThemeToStorage } from "../store/slices/themeSlice";
import { AntDesign, Entypo, Ionicons, FontAwesome5 } from "@expo/vector-icons";

export default function ProfileScreen({ navigation }) {
  const dispatch = useDispatch();
  const { username, role } = useSelector((state) => state.auth);
  const themeState = useSelector((state) => state.theme);
  const { isDarkMode } = themeState;
  const { primaryColor, textSecondary } = useThemeColors();
  const themedStyles = useThemedStyles();

  const handleToggleDarkMode = async () => {
    dispatch(toggleDarkMode());
    const newTheme = {
      ...themeState,
      isDarkMode: !isDarkMode,
    };
    dispatch(saveThemeToStorage(newTheme));
  };

  const ShopManagementData = [
    {
      id: 1,
      title: "Manage shops",
      icon: <Entypo name="shop" size={24} color={primaryColor} />,
      navigatePage: "ShopManagement",
    },
    {
      id: 2,
      title: "Manage staff",
      icon: <AntDesign name="team" size={24} color={primaryColor} />,
      navigatePage: "StaffManagement",
    },
    {
      id: 3,
      title: "Manage categories",
      icon: <AntDesign name="appstore" size={24} color={primaryColor} />,
      navigatePage: "CategoryManagement",
    },
    {
      id: 4,
      title: "Manage customers",
      icon: <AntDesign name="user" size={24} color={primaryColor} />,
      navigatePage: "CustomerManagement",
    },
    {
      id: 5,
      title: "Import/Export",
      icon: <AntDesign name="swap" size={24} color={primaryColor} />,
      navigatePage: "ImportExport",
    },
  ];

  const preferenceData = [
    {
      id: 1,
      title: "Theme Settings",
      icon: (
        <Ionicons name="color-palette-outline" size={24} color={primaryColor} />
      ),
      navigatePage: "ThemeSettings",
    },
  ];

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
    <SafeAreaView style={themedStyles.safeArea}>
      <ScrollView
        style={themedStyles.mainContainer}
        contentContainerStyle={{ paddingBottom: BAR_HEIGHT + 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={global.profileHeader}>
          <View
            style={{ ...global.profileIcon, backgroundColor: primaryColor }}
          >
            <FontAwesome5 name="user-alt" size={34} color="white" />
          </View>
          <Text style={[themedStyles.text, { fontSize: 22, fontWeight: "700" }]}>{username}</Text>
          <Text style={{ fontSize: 14, color: primaryColor }}>{role}</Text>
        </View>

        {role !== "staff" && (
          <>
            <Text style={themedStyles.sectionHeader}>
              Shop Management
            </Text>

            <View style={themedStyles.profileContainer}>
              <TouchableOpacity
                style={themedStyles.profileRow}
                onPress={() => navigation.navigate("EditProfile")}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <AntDesign name="edit" size={24} color={primaryColor} />
                  <Text style={[themedStyles.text, { fontSize: 16 }]}>Edit Profile</Text>
                </View>
                <AntDesign name="right" size={20} color={"#999"} />
              </TouchableOpacity>

              {ShopManagementData.map((item, index) => (
                <TouchableOpacity
                  onPress={() => navigation.navigate(item.navigatePage)}
                  key={item.id}
                  style={
                    index === ShopManagementData.length - 1
                        ? themedStyles.profileRowLast
                        : themedStyles.profileRow
                    }
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    {item.icon}
                    <Text style={[themedStyles.text, { fontSize: 16 }]}>{item.title}</Text>
                  </View>
                  <AntDesign name="right" size={20} color={textSecondary} />
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {role === "staff" && (
          <>
            <Text style={{ marginBottom: 10, marginTop: 10, color: textSecondary }}>
              Management
            </Text>
            <View style={themedStyles.profileContainer}>
              <TouchableOpacity
                style={themedStyles.profileRow}
                onPress={() => navigation.navigate("CategoryManagement")}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <AntDesign name="appstore" size={24} color={primaryColor} />
                  <Text style={[themedStyles.text, { fontSize: 16 }]}>Manage Categories</Text>
                </View>
                <AntDesign name="right" size={20} color={textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={themedStyles.profileRowLast}
                onPress={() => navigation.navigate("CustomerManagement")}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <AntDesign name="user" size={24} color={primaryColor} />
                  <Text style={[themedStyles.text, { fontSize: 16 }]}>Manage Customers</Text>
                </View>
                <AntDesign name="right" size={20} color={textSecondary} />
              </TouchableOpacity>
            </View>
          </>
        )}

        <Text style={[themedStyles.sectionHeader, { marginTop: 10 }]}>
          Preference
        </Text>
        <View style={themedStyles.profileContainer}>
          <TouchableOpacity
            style={themedStyles.profileRow}
            onPress={handleToggleDarkMode}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
            >
              <Ionicons name="moon-outline" size={24} color={primaryColor} />
              <Text style={[themedStyles.text, { fontSize: 16 }]}>Dark Mode</Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={handleToggleDarkMode}
              trackColor={{ false: "#ddd", true: primaryColor }}
              thumbColor={isDarkMode ? "#fff" : "#f4f3f4"}
            />
          </TouchableOpacity>

          {preferenceData.map((item, index) => (
            <TouchableOpacity
              onPress={() => navigation.navigate(item.navigatePage)}
              key={item.id}
              style={themedStyles.profileRowLast}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
              >
                {item.icon}
                <Text style={[themedStyles.text, { fontSize: 16 }]}>{item.title}</Text>
              </View>
              <AntDesign name="right" size={20} color={textSecondary} />
            </TouchableOpacity>
          ))}

          <TouchableOpacity style={global.logoutBtn} onPress={handleLogout}>
            <Text style={{ textAlign: "center", color: "red", fontSize: 16 }}>
              Logout
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
