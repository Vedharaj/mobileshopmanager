import React, { useEffect, useRef } from "react";
import {
  View,
  ActivityIndicator,
  StyleSheet,
  Animated,
} from "react-native";
import {
  useThemeColors,
  PRIMARY_COLOR_DEFAULT,
  useThemedStyles,
} from "../styles/global";
import { global } from "../styles/global";

const SplashScreen = () => {
  const { primaryColor } = useThemeColors();
  const color = primaryColor || PRIMARY_COLOR_DEFAULT;
  const themedStyles = useThemedStyles();

  const text = "Mobx";

  // Each letter has its own values
  const bounceValues = useRef(text.split("").map(() => new Animated.Value(0))).current;
  const opacityValues = useRef(text.split("").map(() => new Animated.Value(0))).current;
  const scaleValues = useRef(text.split("").map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const animations = bounceValues.map((bv, idx) => {
      // random delay (natural motion)
      const randomDelay = 80 + Math.random() * 180;

      return Animated.sequence([
        Animated.delay(randomDelay),

        // fade in + scale up first time
        Animated.parallel([
          Animated.timing(opacityValues[idx], {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),

          Animated.spring(scaleValues[idx], {
            toValue: 1,
            friction: 5,
            tension: 90,
            useNativeDriver: true,
          }),
        ]),

        // slow bounce loop
        Animated.sequence([
          Animated.spring(bv, {
            toValue: 1,
            friction: 7,
            tension: 60,
            useNativeDriver: true,
          }),
          Animated.spring(bv, {
            toValue: 0,
            friction: 7,
            tension: 60,
            useNativeDriver: true,
          }),
        ]),
      ]);
    });

    // loop everything
    Animated.loop(Animated.parallel(animations)).start();
  }, []);

  return (
    <View style={themedStyles.authcontainer}>
      <View style={global.content}>
        <View style={{ flexDirection: "row", justifyContent: "center", marginBottom: 30 }}>
          {text.split("").map((char, idx) => (
            <Animated.Text
              key={idx}
              style={[
                styles.title,
                {
                  color,
                  opacity: opacityValues[idx],
                  transform: [
                    {
                      translateY: bounceValues[idx].interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -20],
                      }),
                    },
                    {
                      scale: scaleValues[idx].interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.7, 1],
                      }),
                    },
                  ],
                },
              ]}
            >
              {char}
            </Animated.Text>
          ))}
        </View>

        <ActivityIndicator size="large" color={color} style={styles.loader} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 42,
    fontWeight: "bold",
    textAlign: "center",
  },
  loader: {
    marginBottom: 15,
  },
});

export default SplashScreen;
