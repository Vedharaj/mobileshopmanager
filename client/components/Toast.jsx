// src/components/Toast.jsx
import React, { useEffect, useRef } from "react";
import { Animated, Text, StyleSheet, Dimensions } from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { hideToast } from "../store/slices/toastSlice";

const { width } = Dimensions.get("window");

const Toast = () => {
  try {
    const dispatch = useDispatch();
    const { visible, message, type, duration } = useSelector(
      (state) => state.toast
    );

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(40)).current;
    const timerRef = useRef(null);

    useEffect(() => {
      try {
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
            try {
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
                try {
                  dispatch(hideToast());
                } catch (dispatchError) {
                  console.error('❌ Error dispatching hideToast:', dispatchError);
                }
              });
            } catch (animError) {
              console.error('❌ Error in toast animation:', animError);
            }
          }, duration || 3000);
        }

        return () => {
          try {
            if (timerRef.current) clearTimeout(timerRef.current);
          } catch (cleanupError) {
            console.error('❌ Error in toast cleanup:', cleanupError);
          }
        };
      } catch (effectError) {
        console.error('❌ Error in toast useEffect:', effectError);
        return () => {};
      }
    }, [visible, duration, fadeAnim, translateY, dispatch]);

    if (!visible) return null;

    const getBgColor = () => {
      try {
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
      } catch (error) {
        console.error('❌ Error in getBgColor:', error);
        return "#4caf50";
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
        <Text style={styles.text} numberOfLines={2}>
          {message || 'Notification'}
        </Text>
      </Animated.View>
    );
  } catch (error) {
    console.error('❌ Toast component error:', error);
    return null;
  }
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
