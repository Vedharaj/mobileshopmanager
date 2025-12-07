import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Image,
  Animated,
} from "react-native";
import {
  useThemeColors,
  PRIMARY_COLOR_DEFAULT,
} from "../styles/global";

const SplashScreen = () => {
  const { primaryColor } = useThemeColors();
  const color = primaryColor || PRIMARY_COLOR_DEFAULT;

  const bounceValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.spring(bounceValue, {
          toValue: -20,
          useNativeDriver: true,
          friction: 6,
        }),
        Animated.spring(bounceValue, {
          toValue: 0,
          useNativeDriver: true,
          friction: 6,
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* <Image
          source={require("../assets/splash-icon.png")}
          style={styles.logo}
          resizeMode="contain"
        /> */}

        {/* ONLY BOUNCE */}
        <Animated.Text
          style={[
            styles.title,
            {
              transform: [{ translateY: bounceValue }],
              color,
            },
          ]}
        >
          MobX
        </Animated.Text>

        <ActivityIndicator size="large" color={color} style={styles.loader} />
        {/* <Text style={styles.loadingText}>Loading...</Text> */}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  title: {
    fontSize: 42,
    fontWeight: "bold",
    marginBottom: 30,
  },
  loader: {
    marginBottom: 15,
  },
  loadingText: {
    fontSize: 14,
    color: "#666",
  },
});

export default SplashScreen;
