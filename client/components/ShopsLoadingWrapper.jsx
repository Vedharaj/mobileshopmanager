import React from "react";
import { View, ActivityIndicator, Text } from "react-native";
import { useSelector } from "react-redux";

/**
 * Wrapper component that shows loading state while shops are being fetched
 * Usage: <ShopsLoadingWrapper><YourComponent /></ShopsLoadingWrapper>
 */
const ShopsLoadingWrapper = ({ children, message = "Loading shops..." }) => {
  const shopsStatus = useSelector((state) => state.shops.status);
  const shops = useSelector((state) => state.shops?.shops || []);

  // Show loading only if status is "loading" and shops haven't been loaded yet
  if (shopsStatus === "loading" && shops.length === 0) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#f5f5f5",
        }}
      >
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 10, fontSize: 16, color: "#666" }}>
          {message}
        </Text>
      </View>
    );
  }

  return <>{children}</>;
};

export default ShopsLoadingWrapper;
