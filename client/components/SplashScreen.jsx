import React from "react";
import { View, Text, ActivityIndicator, StyleSheet, Image } from "react-native";
import { useThemeColors, PRIMARY_COLOR_DEFAULT } from "../styles/global";

const SplashScreen = () => {
  const { primaryColor } = useThemeColors();
  const color = primaryColor || PRIMARY_COLOR_DEFAULT;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Image
          source={require("../assets/splash-icon.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={[styles.title, { color: color }]}>
          MobX
        </Text>
        <ActivityIndicator
          size="large"
          color={color}
          style={styles.loader}
        />
        <Text style={styles.loadingText}>Loading...</Text>
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
    fontSize: 24,
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

