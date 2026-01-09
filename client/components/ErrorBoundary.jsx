import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
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

      // If too many errors, something is seriously wrong
      if (newCount > 5) {
        console.error("⚠️ Multiple errors detected, possible critical issue");
      }
    } catch (boundaryErr) {
      console.error("❌ Error boundary itself failed:", boundaryErr);
    }
  }

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
          <TouchableOpacity
            style={{
              backgroundColor: "#1976d2",
              paddingVertical: 12,
              paddingHorizontal: 24,
              borderRadius: 8,
              marginBottom: 10,
            }}
            onPress={this.handleReset}
          >
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
              Try Again
            </Text>
          </TouchableOpacity>
          {__DEV__ && (
            <Text
              style={{
                fontSize: 12,
                color: "#999",
                marginTop: 20,
                backgroundColor: "#f5f5f5",
                padding: 10,
                borderRadius: 4,
              }}
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
