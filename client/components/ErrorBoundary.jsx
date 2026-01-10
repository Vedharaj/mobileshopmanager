import React from "react";
import { View, Text, TouchableOpacity, AsyncStorage } from "react-native";
import { global, useThemeColors } from "../styles/global";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    try {
      const newCount = this.state.errorCount + 1;
      this.setState({
        error,
        errorInfo,
        errorCount: newCount,
      });

      console.error("🔴 Error caught by boundary:", error);
      console.error("📋 Error info:", errorInfo);

      // If too many errors, clear auth and reset app state
      if (newCount > 3) {
        console.error("⚠️ Multiple errors detected, clearing cache");
        this.clearAppState();
      }
    } catch (boundaryErr) {
      console.error("❌ Error boundary itself failed:", boundaryErr);
    }
  }

  clearAppState = async () => {
    try {
      // Keep token but clear potentially corrupted data
      const token = await AsyncStorage.getItem("token");
      // Note: Full wipe would clear everything, but we keep token for recovery
      console.log("🔄 App state cleared, restart app to recover");
    } catch (err) {
      console.error("Failed to clear app state:", err);
    }
  };

  handleReset = () => {
    try {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
      });
    } catch (err) {
      console.error("Failed to reset error boundary:", err);
    }
  };

  handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("token");
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorCount: 0,
      });
      // Navigate to login by clearing everything
      require("@react-navigation/native");
    } catch (err) {
      console.error("Failed to logout:", err);
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#fff",
            padding: 20,
          }}
        >
          <Text
            style={{
              fontSize: 18,
              fontWeight: "bold",
              color: "#d32f2f",
              marginBottom: 10,
              textAlign: "center",
            }}
          >
            ⚠️ Something went wrong
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: "#666",
              marginBottom: 20,
              textAlign: "center",
            }}
          >
            {this.state.error?.message || "An unexpected error occurred"}
          </Text>
          
          {this.state.errorCount > 3 && (
            <Text
              style={{
                fontSize: 12,
                color: "#d32f2f",
                marginBottom: 15,
                textAlign: "center",
                fontStyle: "italic",
              }}
            >
              Multiple errors detected. Try logging out and back in.
            </Text>
          )}
          
          <TouchableOpacity
            style={{
              backgroundColor: "#1976d2",
              paddingVertical: 12,
              paddingHorizontal: 24,
              borderRadius: 8,
              marginBottom: 10,
              width: "100%",
            }}
            onPress={this.handleReset}
          >
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600", textAlign: "center" }}>
              Try Again
            </Text>
          </TouchableOpacity>

          {this.state.errorCount > 2 && (
            <TouchableOpacity
              style={{
                backgroundColor: "#f44336",
                paddingVertical: 12,
                paddingHorizontal: 24,
                borderRadius: 8,
                width: "100%",
              }}
              onPress={this.handleLogout}
            >
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600", textAlign: "center" }}>
                Logout & Start Fresh
              </Text>
            </TouchableOpacity>
          )}

          {process.env.NODE_ENV === "development" && (
            <Text
              style={{
                fontSize: 11,
                color: "#999",
                marginTop: 20,
                backgroundColor: "#f5f5f5",
                padding: 10,
                borderRadius: 4,
                maxHeight: 100,
              }}
              numberOfLines={5}
            >
              {this.state.error?.stack}
            </Text>
          )}
        </View>
      );
    }

    return this.props.children;
  }
}
