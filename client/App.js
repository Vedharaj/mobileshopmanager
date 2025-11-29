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
import SplashScreen from "./components/SplashScreen.jsx";

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
import EditProfile from "./screens/EditProfile.jsx";
import ShopManagement from "./screens/ShopManagement.jsx";
import StaffManagement from "./screens/StaffManagement.jsx";
import CategoryManagement from "./screens/CategoryManagement.jsx";
import CustomerManagement from "./screens/CustomerManagement.jsx";
import ThemeSettings from "./screens/ThemeSettings.jsx";

// Redux
import { Provider, useDispatch, useSelector } from "react-redux";
import { store } from "./store/store.js";
import { setCredentials, fetchMe, logout } from "./store/slices/authSlice.js";
import { fetchShops, clearShops } from "./store/slices/shopsSlice.js"; // Import clearShops
import { loadThemeFromStorage } from "./store/slices/themeSlice.js"; // Re-import loadThemeFromStorage

const Stack = createNativeStackNavigator();

const HIDE_BOTTOM_NAVBAR_SCREENS = [
  "Scanner",
  "welcome",
  "EditProfile",
  "ShopManagement",
  "StaffManagement",
  "CategoryManagement",
  "CustomerManagement",
  "ThemeSettings",
];

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
  const [shopsLoaded, setShopsLoaded] = useState(false);
  const [activeIndex, setActiveIndex] = useState(3);
  const [currentRoute, setCurrentRoute] = useState(null);

  const userToken = useSelector((state) => state.auth.token);
  const userRole = useSelector((state) => state.auth.role);
  const shops = useSelector((state) => state.shops?.shops || []);
  const shopsStatus = useSelector((state) => state.shops.status);
  const authStatus = useSelector((state) => state.auth.status);

  useEffect(() => {
    const loadToken = async () => {
      try {
        // Load theme first
        await dispatch(loadThemeFromStorage()).unwrap(); // Re-add loadThemeFromStorage

        const token = await AsyncStorage.getItem("token");
        if (token) {
          dispatch(setCredentials(token));
          try {
            await dispatch(fetchMe()).unwrap();
            await dispatch(fetchShops()).unwrap();
            setShopsLoaded(true);
          } catch (err) {
            // invalid token or fetch failed -> clear credentials
            console.warn("Token invalid or fetchMe failed, logging out", err);
            dispatch(logout());
            dispatch(clearShops()); // Dispatch clearShops after logout
            setShopsLoaded(true);
          }
        } else {
          setShopsLoaded(true);
        }
      } catch (err) {
        console.error("Failed to load token", err);
        setShopsLoaded(true);
      } finally {
        setLoading(false);
      }
    };
    loadToken();
  }, [dispatch]);

  const isAuthenticated = !!userToken;
  const initialRouteName = !isAuthenticated
    ? "Login"
    : userRole === "staff"
    ? "Home" // Changed from "StaffManagement" to "Home"
    : shops.length === 0
    ? "welcome"
    : "Home";

  const activeRoute = currentRoute ?? initialRouteName;

  // Moved the navigation logic to a dedicated useEffect to ensure data is loaded
  useEffect(() => {
    if (
      loading ||
      !shopsLoaded ||
      !navigationRef.current ||
      shopsStatus === "loading"
    )
      return; // Wait for shopsStatus to not be loading

    // Get current route to avoid resetting if user is on a management screen
    const currentRoute = navigationRef.current?.getCurrentRoute?.();
    const currentRouteName = currentRoute?.name;

    // Don't reset if user is on a management or settings screen
    const protectedRoutes = [
      "ShopManagement",
      "StaffManagement",
      "CategoryManagement",
      "CustomerManagement",
      "ThemeSettings",
      "EditProfile",
      "Scanner",
    ];
    if (currentRouteName && protectedRoutes.includes(currentRouteName)) {
      return; // Don't reset navigation if user is on a protected route
    }

    let targetRoute;
    if (!isAuthenticated) {
      targetRoute = "Login";
    } else if (userRole === "staff") {
      targetRoute = "Home"; // Staff always go to Home
    } else if (shops.length === 0) {
      targetRoute = "welcome"; // Owners with no shops go to Welcome
    } else {
      targetRoute = "Home"; // Owners with shops go to Home
    }

    // Only reset if we're not already on the target route
    if (currentRouteName !== targetRoute) {
      navigationRef.current.reset({
        index: 0,
        routes: [{ name: targetRoute }],
      });
    }
  }, [
    loading,
    shopsLoaded,
    isAuthenticated,
    userRole,
    shops.length,
    shopsStatus,
  ]); // Add shopsStatus to dependencies

  const handleTabPress = (index, key) => {
    const routeName = KEY_TO_ROUTE[key] ?? "Home";
    if (navigationRef.current?.navigate) {
      navigationRef.current.navigate(routeName);
    }
    setActiveIndex(index);
  };

  // Show splash screen while loading (only if authenticated or still checking authentication)
  // Don't show splash screen if user is logged out (not authenticated and initial load is complete)
  const shouldShowSplash = loading || 
    (!isAuthenticated && !shopsLoaded) || 
    (isAuthenticated && (!shopsLoaded || authStatus === "loading" || shopsStatus === "loading"));
  
  if (shouldShowSplash) {
    return <SplashScreen />;
  }

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
          // initialRouteName is now handled by the useEffect above
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
              <Stack.Screen
                name="Stats"
                component={StatsScreen}
                options={{ headerShown: true, headerBackVisible: false }}
              />
              <Stack.Screen
                name="Products"
                component={Productscreen}
                options={{ headerShown: true, headerBackVisible: false }}
              />
              <Stack.Screen
                name="EditProfile"
                component={EditProfile}
                options={{ headerShown: true }}
              />
              <Stack.Screen
                name="ShopManagement"
                component={ShopManagement}
                options={{ headerShown: true }}
              />
              <Stack.Screen
                name="StaffManagement"
                component={StaffManagement}
                options={{ headerShown: true }}
              />
              <Stack.Screen
                name="CategoryManagement"
                component={CategoryManagement}
                options={{ headerShown: true }}
              />
              <Stack.Screen
                name="CustomerManagement"
                component={CustomerManagement}
                options={{ headerShown: true }}
              />
              <Stack.Screen
                name="ThemeSettings"
                component={ThemeSettings}
                options={{ headerShown: true }}
              />
              <Stack.Screen
                name="Services"
                component={ServicesScreen}
                options={{ headerShown: true, headerBackVisible: false }}
              />
              <Stack.Screen name="Scanner" component={ScannerScreen} />
            </>
          )}
        </Stack.Navigator>

        {userToken != null &&
          activeRoute &&
          !HIDE_BOTTOM_NAVBAR_SCREENS.includes(activeRoute) && (
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
