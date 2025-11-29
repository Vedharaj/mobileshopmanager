// components/BottomNavbar.jsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Pressable,
  StyleSheet,
  Animated,
  Dimensions,
  Text,
} from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeColors } from "../styles/global"; // Import useThemeColors

const { width: SCREEN_W } = Dimensions.get("window");

const LEFT_TABS = [
  { key: "profile", icon: "person", label: "Profile" },
  { key: "stats", icon: "insert-chart", label: "Stats" },
];

const RIGHT_TABS = [
  { key: "Products", icon: "show-chart", label: "Products" },
  { key: "Services", icon: "receipt-long", label: "Services" },
];

const CENTER_TAB = { key: "home", icon: "qr-code-scanner" };

const BAR_HEIGHT = 64;
const CENTER_DIAMETER = 72;

export default function BottomNavbar({
  initialIndex = 3,
  activeIndex, // optional controlled prop
  onTabPress,
  navigationRef,
}) {
  const { primaryColor } = useThemeColors(); // Use the hook to get primaryColor
  // compute default index from controlled prop or initial prop
  const defaultIndex = Math.max(1, Math.min(activeIndex ?? initialIndex, 5));
  const [active, setActive] = useState(defaultIndex);

  // animated values for 5 slots: 0..4 -> left1,left2,center,right1,right2
  const scalesRef = useRef(Array(5).fill().map(() => new Animated.Value(1))).current;
  const liftsRef = useRef(Array(5).fill().map(() => new Animated.Value(0))).current;

  const insets = useSafeAreaInsets();
  const barBottomOffset = insets.bottom;
  const centerBottom = barBottomOffset + BAR_HEIGHT / 2 + 12; // Adjusted for floating center button

  // animate function (useCallback so effects can depend on it)
  const animateTo = useCallback((index) => {
    scalesRef.forEach((_, i) => {
      const isActive = i === index - 1;
      Animated.parallel([
        Animated.timing(scalesRef[i], {
          toValue: isActive ? 1.14 : 1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(liftsRef[i], {
          toValue: isActive ? (i === 2 ? -8 : -4) : 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [scalesRef, liftsRef]);

  // Sync when controlled activeIndex prop changes
  useEffect(() => {
    if (typeof activeIndex === "number") {
      const bounded = Math.max(1, Math.min(activeIndex, 5));
      setActive(bounded);
      animateTo(bounded);
    }
  }, [activeIndex, animateTo]);

  // Initial mount: animate to current active (only if not controlled)
  useEffect(() => {
    if (typeof activeIndex !== "number") {
      animateTo(active);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openScanner = useCallback(() => {
    // console.log('Home re-clicked');
    // console.log(navigationRef.current.navigate("Scanner"));
    if (navigationRef?.current) {
      navigationRef.current.navigate('Scanner');
    }
  }, [navigationRef]);

  // handle tab press: if uncontrolled, update internal state; always notify parent
  const handlePressIndex = (index) => {
    const currentActive = typeof activeIndex === "number" ? activeIndex : active;

    // console.log(`Tab pressed: index=${index}, currentActive=${currentActive}`);

    // If already on Home and center button re-clicked, open Scanner and stop
    if (index === 3 && currentActive === 3) {
      openScanner();
      return; // prevent calling onTabPress which would trigger another navigation
    }

    if (typeof activeIndex !== "number") {
      setActive(index);
      animateTo(index);
    } else {
      // still animate locally for immediate feedback (but do not override parent value)
      animateTo(index);
    }

    const mapping = [
      LEFT_TABS[0].key,
      LEFT_TABS[1].key,
      CENTER_TAB.key,
      RIGHT_TABS[0].key,
      RIGHT_TABS[1].key,
    ];
    onTabPress?.(index, mapping[index - 1]);
  };

  const handlePressIn = (i) => {
    Animated.spring(scalesRef[i], {
      toValue: 0.92,
      useNativeDriver: true,
      speed: 40,
      bounciness: 4,
    }).start();
  };
  const handlePressOut = (i, index) => {
    Animated.spring(scalesRef[i], {
      toValue: active === index ? 1.14 : 1,
      useNativeDriver: true,
      speed: 40,
      bounciness: 4,
    }).start();
  };

  // reusable tab renderer (with label)
  const renderTab = (tab, slotIndex, displayIndex) => {
    const animatedStyle = {
      transform: [{ translateY: liftsRef[slotIndex] }, { scale: scalesRef[slotIndex] }],
    };

    return (
      <Pressable
        key={tab.key}
        onPress={() => handlePressIndex(displayIndex)}
        onPressIn={() => handlePressIn(slotIndex)}
        onPressOut={() => handlePressOut(slotIndex, displayIndex)}
        style={styles.tabButton}
        android_ripple={{ color: "rgba(0,0,0,0.06)", radius: 24 }}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Animated.View style={[styles.iconWrapper, animatedStyle]}>
          <Icon
            name={tab.icon}
            size={24}
            color={active === displayIndex ? primaryColor : "#9aa0a6"}
          />
          <Text
            style={[
              styles.label,
              { color: active === displayIndex ? primaryColor : "#9aa0a6" },
            ]}
            numberOfLines={1}
          >
            {tab.label}
          </Text>
        </Animated.View>
      </Pressable>
    );
  };

  return (
    <View style={styles.outer} pointerEvents="box-none">
      {/* BOTTOM BAR */}
      <View
        style={[
          styles.bar,
          { bottom: barBottomOffset, marginHorizontal: 16 },
        ]}
        pointerEvents="box-none"
      >
        <View style={styles.side}>
          {renderTab(LEFT_TABS[0], 0, 1)}
          {renderTab(LEFT_TABS[1], 1, 2)}
        </View>

        {/* spacer reserves width for center floating button so icons won't overlap */}
        <View style={{ width: CENTER_DIAMETER }} />

        <View style={styles.side}>
          {renderTab(RIGHT_TABS[0], 3, 4)}
          {renderTab(RIGHT_TABS[1], 4, 5)}
        </View>
      </View>

      {/* FLOATING QR BUTTON */}
      <Animated.View
        style={[
          styles.centerWrapper,
          {
            bottom: centerBottom,
            left: (SCREEN_W - CENTER_DIAMETER) / 2,
            transform: [{ translateY: liftsRef[1] }],
          },
        ]}
      >
        <Pressable
          onPress={() => handlePressIndex(3)}
          onPressIn={() => handlePressIn(2)}
          onPressOut={() => handlePressOut(2, 3)}
          style={({ pressed }) => [
            styles.centerButton,
            { backgroundColor: primaryColor, shadowColor: primaryColor },
            pressed && { opacity: 0.95 },
          ]}
          android_ripple={{ color: "rgba(255,255,255,0.12)", radius: CENTER_DIAMETER / 2 }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon
            name={CENTER_TAB.icon}
            size={30}
            color={active === 3 ? "#fff" : "#ffffffdd"}
          />
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 50,
  },

  bar: {
    position: "absolute",
    height: BAR_HEIGHT,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
  },

  side: {
    flexDirection: "row",
    alignItems: "center",
  },

  tabButton: {
    width: (SCREEN_W - 16 * 2 - CENTER_DIAMETER - 28) / 3.5,
    alignItems: "center",
    justifyContent: "center",
  },

  iconWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },

  label: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: "500",
  },

  centerWrapper: {
    position: "absolute",
    width: CENTER_DIAMETER,
    height: CENTER_DIAMETER,
    borderRadius: CENTER_DIAMETER / 2,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 60,
  },

  centerButton: {
    width: CENTER_DIAMETER,
    height: CENTER_DIAMETER,
    borderRadius: CENTER_DIAMETER / 2,
    backgroundColor: "#4c956c", // static fallback, overridden dynamically
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#4c956c", // static fallback, overridden dynamically
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 12,
  },
});
