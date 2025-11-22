import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet
} from 'react-native';

import { CameraView, useCameraPermissions } from 'expo-camera';
import { global } from '../styles/global';

export default function ScannerScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  // animation for scanning line
  const lineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(lineAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(lineAnim, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [lineAnim]);

  const translateY = lineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 180], // move inside the scan box
  });

  if (!permission) {
    // still loading permission state
    return <View style={global.loadingContainer} />;
  }

  // If permission NOT granted yet -> show info + button on THIS screen
  if (!permission.granted) {
    return (
      <View style={global.permissionContainer}>
        <TouchableOpacity
          style={global.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={global.backButtonText}>← Back</Text>
        </TouchableOpacity>

        <Text style={global.permissionTitle}>Camera Permission Needed</Text>
        <Text style={global.permissionText}>
          We need access to your camera to scan barcodes.
        </Text>

        <TouchableOpacity
          style={{...global.primaryButton, backgroundColor: "#4d94ffff", padding: 5, borderRadius: 3}}
          onPress={requestPermission}
        >
          <Text style={{...global.primaryButtonText, color: "#ffffffff"}}>Give Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // When permission is granted, show camera + overlay
  const handleBarCodeScanned = (scanningResult) => {
    if (scanned) return;

    setScanned(true);
    const { data, type } = scanningResult;

    console.log(`Scanned barcode with data: ${data} and type: ${type}`);

    // Navigate with scanned value
    // navigation.navigate('Result', { value: data, type });

    // if you want to allow scanning again after back to this screen:
    setTimeout(() => setScanned(false), 1000);
  };

  return (
    <View style={global.scannerContainer}>
      {/* custom back button over camera */}
      <View style={global.scannerTopBar}>
        <TouchableOpacity
          style={global.backButtonTransparent}
          onPress={() => navigation.goBack()}
        >
          <Text style={global.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={global.scannerTitle}>Scan a Barcode</Text>
      </View>

      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr', 'code128', 'ean13', 'ean8', 'upc_a', 'upc_e'],
        }}
      />

      {/* Dark overlay + scan box + animated line (positioned absolutely on top) */}
      <View style={global.overlay}>
        <View style={global.scanBox}>
          <Animated.View
            style={[global.scanLine, { transform: [{ translateY }] }]}
          />
        </View>
        <Text style={global.scanHint}>Align the barcode inside the box</Text>
      </View>
    </View>
  );
}
