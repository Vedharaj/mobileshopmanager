import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
} from 'react-native';

import { CameraView, useCameraPermissions } from 'expo-camera';
import { useFocusEffect } from '@react-navigation/native';
import { global } from '../styles/global';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts } from '../store/slices/productSlice';
import { showToast } from '../store/slices/toastSlice';
import { selectCartItems } from '../store/slices/salesItemsSlice';

export default function ScannerScreen({ navigation, route }) {
  const dispatch = useDispatch();
  const { products = [] } = useSelector((state) => state.products || {});
  const cartItems = useSelector(selectCartItems);

  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [localToast, setLocalToast] = useState({ visible: false, message: '', type: '' });

  // Ref to block multiple handler executions for the same scan
  const isHandlingScan = useRef(false);
  const lastScannedData = useRef(null);

  // animation for scanning line
  const lineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  // Reset scanning state every time this screen is focused
  useFocusEffect(
    React.useCallback(() => {
      setScanned(false);
      isHandlingScan.current = false;
      lastScannedData.current = null;
      setLocalToast({ visible: false, message: '', type: '' });

      return () => {
        setScanned(false);
        isHandlingScan.current = false;
        lastScannedData.current = null;
        setLocalToast({ visible: false, message: '', type: '' });
      };
    }, [])
  );

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
          style={{
            ...global.primaryButton,
            backgroundColor: '#4d94ffff',
            padding: 5,
            borderRadius: 3,
          }}
          onPress={requestPermission}
        >
          <Text
            style={{ ...global.primaryButtonText, color: '#ffffffff' }}
          >
            Give Permission
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const resetScanState = () => {
    setScanned(false);
    isHandlingScan.current = false;
    lastScannedData.current = null;
  };

  const handleBarCodeScanned = (scanningResult) => {
    // HARD guard: if we're already handling a scan, ignore
    if (isHandlingScan.current) return;

    const { data } = scanningResult;

    // Also skip if this is the exact same barcode we just scanned
    if (lastScannedData.current === data) {
      console.log('⏭️ Ignoring duplicate barcode scan:', data);
      return;
    }

    isHandlingScan.current = true;
    lastScannedData.current = data;
    setScanned(true);

    // Find product by barcode or ID
    const matchedProduct = products.find(
      (p) =>
        p.barcode === data ||
        p.barcode === data.toLowerCase() ||
        p._id === data
    );

    if (!matchedProduct) {
      console.log('No product found for barcode:', data);
      setLocalToast({
        visible: true,
        message: `Product not found: ${data}`,
        type: 'error',
      });
      setTimeout(() => setLocalToast({ visible: false, message: '', type: '' }), 2000);

      // allow next scan after short delay
      setTimeout(resetScanState, 500);
      return;
    }

    // 🔍 DEBUG: Log what we're comparing
    console.log('🔍 matchedProduct._id:', matchedProduct._id);
    console.log(
      '🧺 cartItems structure:',
      cartItems.map((i) => ({
        product_id: i.product_id,
        productId: i.productId,
        _id: i._id,
        barcode: i.barcode,
      }))
    );

    // ✅ Check if product already in cart (duplicate) - only check filled items
    const isDuplicate = cartItems.some(
      (item) =>
        item.product_id && // only check items with product_id (skip empty rows)
        (item.product_id === matchedProduct._id ||
          item.product_id === matchedProduct.id ||
          item._id === matchedProduct._id)
    );

    console.log('isDuplicate result:', isDuplicate);

    if (isDuplicate) {
      // 👉 Duplicate: show toast, stay on scanner, DO NOT navigate
      setLocalToast({
        visible: true,
        message: 'Item already added to cart',
        type: 'error',
      });
      setTimeout(() => setLocalToast({ visible: false, message: '', type: '' }), 2000);

      // after a small delay, allow another scan
      setTimeout(resetScanState, 600);
      return;
    }

    // ✅ Not duplicate: navigate to Transaction screen
    navigation.navigate('Transaction', {
      scannedProduct: matchedProduct,
      openSalesForm: true,
      scannedAt: Date.now(), // ensure Transaction useEffect triggers
    });

    // After some time, allow scanning again (when user comes back)
    // setTimeout(resetScanState, 600);
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
        // only pass handler when scanning is enabled
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

      {/* Local Toast - only visible on this screen */}
      {localToast.visible && (
        <View
          style={{
            position: 'absolute',
            bottom: 80,
            left: 20,
            right: 20,
            backgroundColor: localToast.type === 'error' ? '#e74c3c' : '#27ae60',
            paddingVertical: 14,
            paddingHorizontal: 16,
            borderRadius: 8,
            zIndex: 999,
          }}
        >
          <Text
            style={{
              color: '#fff',
              fontSize: 14,
              fontWeight: '600',
              textAlign: 'center',
            }}
          >
            {localToast.message}
          </Text>
        </View>
      )}
    </View>
  );
}
