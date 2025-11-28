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
import Productscreen from "./screens/ProductScreen.jsx";
import ServicesScreen from "./screens/ServicesScreen.jsx";
import StatsScreen from "./screens/StatsScreen.jsx";
import ScannerScreen from "./screens/ScannerScreen.jsx";
import WelcomeScreen from "./screens/WelcomeScreen.jsx";

// Redux
import { Provider, useDispatch, useSelector } from "react-redux";
import { store } from "./store/store.js";
import { setCredentials, fetchMe } from "./store/slices/authSlice.js";
import { fetchShops } from "./store/slices/shopsSlice.js";

const Stack = createNativeStackNavigator();

const ROUTE_TO_INDEX = {
  Profile: 1,
  Stats: 2,
  Home: 3,
  Products: 4,
  Services: 5,
};

const KEY_TO_ROUTE = {
  scanner: "Scanner",
  profile: "Profile",
  stats: "Stats",
  home: "Home",
  Products: "Products",
  Services: "Services",
};

function RootNavigator() {
  const navigationRef = useRef(null);
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(3);
  const [currentRoute, setCurrentRoute] = useState(null);

  const userToken = useSelector((state) => state.auth.token);
  const shops = useSelector((state) => state.shops?.shops || []);

  useEffect(() => {
    const loadToken = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (token) {
          await dispatch(setCredentials(token));
          await dispatch(fetchShops());
          await dispatch(fetchMe());
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

  const isAuthenticated = !!userToken;
  const initialRouteName = !isAuthenticated
    ? "Login"
    : shops.length === 0
    ? "welcome"
    : "Home";

  const activeRoute = currentRoute ?? initialRouteName;

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
        } catch (e) {}
      }}
    >
      <View style={{ flex: 1 }}>
        <Stack.Navigator
          screenOptions={{ headerShown: false }}
          initialRouteName={initialRouteName}
          key={initialRouteName}
        >
          {!isAuthenticated ? (
            <>
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Register" component={RegisterScreen} />
            </>
          ) : (
            <>
              <Stack.Screen name="welcome" component={WelcomeScreen} />
              <Stack.Screen name="Home" component={HomeScreen} />
              <Stack.Screen name="Profile" component={ProfileScreen} />
              <Stack.Screen name="Stats" component={StatsScreen} />
              <Stack.Screen name="Products" component={Productscreen} />
              <Stack.Screen
                name="Services"
                component={ServicesScreen}
              />
              <Stack.Screen name="Scanner" component={ScannerScreen} />
            </>
          )}
        </Stack.Navigator>

        {userToken != null && activeRoute !== "Scanner" && activeRoute !== "welcome" && (
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

export default function App() {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <RootNavigator />
      </SafeAreaProvider>
    </Provider>
  );
}
