// App.js
import React, { useEffect, useState, useRef } from "react";
import { View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { SafeAreaProvider } from "react-native-safe-area-context";

// components
import BottomNavbar from "./components/BottomNavbar.jsx";
import Toast from "./components/Toast.jsx";

// screens
import LoginScreen from "./screens/LoginScreen.jsx";
import RegisterScreen from "./screens/RegisterScreen.jsx";
import HomeScreen from "./screens/HomeScreen.jsx";
import ProfileScreen from "./screens/ProfileScreen.jsx";
import StockScreen from "./screens/StockScreen.jsx";
import TransactionsScreen from "./screens/TransactionsScreen.jsx";
import StatsScreen from "./screens/StatsScreen.jsx";
import ScannerScreen from "./screens/ScannerScreen.jsx";

// ✅ Redux
import { Provider, useDispatch, useSelector } from "react-redux";
import { store } from "./store/store.js";
import { setCredentials } from "./store/slices/authSlice.js";

const Stack = createNativeStackNavigator();

const ROUTE_TO_INDEX = {
  Profile: 1,
  Stats: 2,
  Home: 3,
  Stocks: 4,
  Transactions: 5,
};

const KEY_TO_ROUTE = {
  scanner: "Scanner",
  profile: "Profile",
  stats: "Stats",
  home: "Home",
  stocks: "Stocks",
  transactions: "Transactions",
};

// 🔁 This component is INSIDE <Provider>, so it can use useDispatch/useSelector
function RootNavigator() {
  const navigationRef = useRef(null);
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(3);
  const [currentRoute, setCurrentRoute] = useState(null);

  // ✅ Get token from Redux instead of userToken variable
  const userToken = useSelector((state) => state.auth.token);

  useEffect(() => {
    const loadToken = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (token) {
          dispatch(setCredentials(token));
        }
      } catch (err) {
        console.error("Failed to load token", err);
      } finally {
        setLoading(false);
      }
    };
    loadToken();
  }, [dispatch]);

  const handleTabPress = (index, key) => {
    const routeName = KEY_TO_ROUTE[key] ?? "Home";
    if (navigationRef.current?.navigate) {
      navigationRef.current.navigate(routeName);
    }
    setActiveIndex(index);
  };

  if (loading) return null;

  return (
    <NavigationContainer
      ref={navigationRef}
      onStateChange={() => {
        try {
          const route = navigationRef.current?.getCurrentRoute?.();
          const name = route?.name;
          if (name) {
            setCurrentRoute(name);
            if (ROUTE_TO_INDEX[name]) setActiveIndex(ROUTE_TO_INDEX[name]);
          }
        } catch (e) {
          // ignore
        }
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
              <Stack.Screen
                name="Transactions"
                component={TransactionsScreen}
              />
              <Stack.Screen name="Scanner" component={ScannerScreen} />
            </>
          )}
        </Stack.Navigator>

        {userToken != null && currentRoute !== "Scanner" && (
          <BottomNavbar
            activeIndex={activeIndex}
            onTabPress={handleTabPress}
            navigationRef={navigationRef}
          />
        )}

        <Toast />
      </View>
    </NavigationContainer>
  );
}

// 🔰 OUTER component: wraps everything with Provider + SafeAreaProvider
export default function App() {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <RootNavigator />
      </SafeAreaProvider>
    </Provider>
  );
}
