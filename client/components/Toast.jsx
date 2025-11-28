// src/components/Toast.jsx
import React, { useEffect, useRef } from "react";
import { Animated, Text, StyleSheet, Dimensions } from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { hideToast } from "../store/slices/toastSlice";

const { width } = Dimensions.get("window");

const Toast = () => {
  const dispatch = useDispatch();
  const { visible, message, type, duration } = useSelector(
    (state) => state.toast
  );

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(40)).current;
  const timerRef = useRef(null);

  useEffect(() => {
    if (visible) {
      // clear previous timer if any
      if (timerRef.current) clearTimeout(timerRef.current);

      // animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // auto hide
      timerRef.current = setTimeout(() => {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: 40,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start(() => {
          dispatch(hideToast());
        });
      }, duration);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [visible, duration, fadeAnim, translateY, dispatch]);

  if (!visible) return null;

  const getBgColor = () => {
    switch (type) {
      case "error":
        return "#ff6459ff";
      case "warning":
        return "#ff9800";
      case "info":
        return "#2196f3";
      default:
        return "#4caf50"; // success
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY }],
          backgroundColor: getBgColor(),
        },
      ]}
    >
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: width * 0.3,
    // left: width * 0.3,
    right: width * 0.06,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    elevation: 2,
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
});

export default Toast;
