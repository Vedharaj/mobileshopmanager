import React, { useEffect, useState, useRef } from "react";
import { View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaProvider } from "react-native-safe-area-context";

import BottomNavbar from "./components/BottomNavbar.jsx";

// screens (make sure exports match these names)
import LoginScreen from "./screens/LoginScreen.jsx";
import RegisterScreen from "./screens/RegisterScreen.jsx";
import HomeScreen from "./screens/HomeScreen.jsx";
import ProfileScreen from "./screens/ProfileScreen.jsx";
import StockScreen from "./screens/StockScreen.jsx";
import TransactionsScreen from "./screens/TransactionsScreen.jsx"; // << correct name
import StatsScreen from "./screens/StatsScreen.jsx";

import AuthContext from "./context/AuthContext.js";

const Stack = createNativeStackNavigator();

const ROUTE_TO_INDEX = {
  Profile: 1,
  Stats: 2,
  Home: 3,
  Stocks: 4,
  Transactions: 5,
};

// inside App.js (where navigationRef and handleTabPress are defined)
const KEY_TO_ROUTE = {
  profile: "Profile",
  stats: "Stats",
  home: "Home",
  stocks: "Stocks",
  transactions: "Transactions",
};

const handleTabPress = (index, key) => {
  const routeName = KEY_TO_ROUTE[key] ?? "Home";

  const currentRoute = navigationRef.current?.getCurrentRoute?.()?.name;

  if (routeName === "Home" && currentRoute === "Home") {
    // already on Home -> set param to timestamp to trigger scanner
    navigationRef.current?.navigate("Home", { openCamera: Date.now() });
  } else {
    navigationRef.current?.navigate(routeName);
  }

  // update UI active index state for BottomNavbar (if used)
  setActiveIndex(index);
};



export default function App() {
  const navigationRef = useRef(null);

  const [userToken, setUserToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(3);

  useEffect(() => {
    const loadToken = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (token) setUserToken(token);
      } catch (err) {
        console.error("Failed to load token", err);
      } finally {
        setLoading(false);
      }
    };
    loadToken();
  }, []);

  const authContextValue = {
    userToken,
    signIn: async (token) => {
      try {
        await AsyncStorage.setItem("token", token);
        setUserToken(token);
      } catch (e) {
        console.error("signIn error", e);
      }
    },
    signOut: async () => {
      try {
        await AsyncStorage.removeItem("token");
        setUserToken(null);
      } catch (e) {
        console.error("signOut error", e);
      }
    },
  };

  if (loading) return null; // or a Splash screen

  const handleTabPress = (index, key) => {
    const routeName = KEY_TO_ROUTE[key] ?? "Home";
    if (navigationRef.current?.navigate) navigationRef.current.navigate(routeName);
    setActiveIndex(index);
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      <SafeAreaProvider>
        <NavigationContainer
          ref={navigationRef}
          onStateChange={() => {
            try {
              const route = navigationRef.current?.getCurrentRoute?.();
              const name = route?.name;
              if (name && ROUTE_TO_INDEX[name]) setActiveIndex(ROUTE_TO_INDEX[name]);
            } catch (e) { /* ignore */ }
          }}
        >
          <View style={{ flex: 1 }}>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              {userToken == null ? (
                <>
                  <Stack.Screen name="Login" component={LoginScreen} />
                  <Stack.Screen name="Register" component={RegisterScreen} />
                </>
              ) : (
                <>
                  <Stack.Screen name="Home" component={HomeScreen} />
                  <Stack.Screen name="Profile" component={ProfileScreen} />
                  <Stack.Screen name="Stats" component={StatsScreen} />
                  <Stack.Screen name="Stocks" component={StockScreen} />
                  <Stack.Screen name="Transactions" component={TransactionsScreen} />
                </>
              )}
            </Stack.Navigator>

            {userToken != null && (
              <BottomNavbar
                activeIndex={activeIndex}    // controlled prop
                onTabPress={handleTabPress}
              />
            )}
          </View>
        </NavigationContainer>
      </SafeAreaProvider>
    </AuthContext.Provider>
  );
}
