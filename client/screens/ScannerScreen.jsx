import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Alert
} from 'react-native';

import { CameraView, useCameraPermissions } from 'expo-camera';
import { useFocusEffect } from '@react-navigation/native';
import { global } from '../styles/global';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts } from '../store/slices/productSlice';

export default function ScannerScreen({ navigation, route }) {
  const dispatch = useDispatch();
  const { products = [] } = useSelector((state) => state.products || {});
  
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  
  // Check if we came from Transaction screen (sales form)
  const fromScreen = route?.params?.from || null;

  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  // Reset scanning state every time this screen is focused
  useFocusEffect(
    React.useCallback(() => {
      setScanned(false);
      return () => setScanned(false);
    }, [])
  );

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

    // Find product by barcode or ID
    const matchedProduct = products.find(
      (p) => p.barcode === data || p.barcode === data.toLowerCase() || p._id === data
    );

    if (matchedProduct) {
      console.log('Product matched:', matchedProduct);
      console.log('From screen:', fromScreen);
      
      if (fromScreen === 'Transaction') {
        // Already on Transaction screen, just go back with the product
        navigation.navigate('Transaction', {
          scannedProduct: matchedProduct,
          openSalesForm: true,
          scannedAt: Date.now(),
        });
      } else {
        // Coming from navbar/elsewhere, navigate to Transaction
        navigation.navigate('Transaction', {
          scannedProduct: matchedProduct,
          openSalesForm: true,
          scannedAt: Date.now(),
        });
      }
      
      // Reset immediately to allow continuous scanning
      setTimeout(() => setScanned(false), 500);
    } else {
      console.log('No product found for barcode:', data);
      Alert.alert(
        'Product Not Found',
        `No product found with barcode: ${data}`,
        [
          {
            text: 'Scan Again',
            onPress: () => setScanned(false),
          },
          {
            text: 'Cancel',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    }
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
