import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Keyboard,
  ActivityIndicator,
  ScrollView,
  Alert,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useRoute } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import { global, useThemeColors, useThemedStyles } from "../styles/global";
import { updateProduct, deleteProduct } from "../store/slices/productSlice";
import { showToast } from "../store/slices/toastSlice";

const formatDate = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getCurrentDate = () => formatDate(new Date());

const isValidDate = (dateString) => {
  if (!dateString) return false;
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
};


const ProductDetailScreen = () => {
  const route = useRoute();
  const product = route.params?.product;
  const dispatch = useDispatch();
  const navigation = require('@react-navigation/native').useNavigation();
  const { categories } = useSelector((state) => state.categories);
  const { customers } = useSelector((state) => state.customers);
  const { primaryColor, cardBg, textColor, textSecondary } = useThemeColors();
  const themedStyles = useThemedStyles();

  if (!product) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: textColor, fontSize: 16, fontWeight: "600" }}>Product not found</Text>
        <Text style={{ color: textSecondary, marginTop: 6 }}>Go back and try again.</Text>
      </View>
    );
  }

  const productShopId = product.shop_id?._id || product.shop_id;
  const productShopCategories = categories.filter(
    (cat) => cat.shop_id === productShopId || cat.shop_id?._id === productShopId
  );

  const [productName, setProductName] = useState(product.name || "");
  const [productQty, setProductQty] = useState(product.qty?.toString() || "0");
  const [productCostPrice, setProductCostPrice] = useState(product.cost_price?.toString() || "0");
  const [productSellingPrice, setProductSellingPrice] = useState(product.selling_price?.toString() || "0");
  const [productCgst, setProductCgst] = useState(product.cgst?.toString() || "0");
  const [productSgst, setProductSgst] = useState(product.sgst?.toString() || "0");
  const [productMinimumStock, setProductMinimumStock] = useState(product.minimum_stock?.toString() || "0");
  const [productCategoryId, setProductCategoryId] = useState(product.category_id?._id || product.category_id || "");
  const [productCustomerId, setProductCustomerId] = useState(product.customer_id?._id || product.customer_id || "");
  const [productDateValue, setProductDateValue] = useState(product.date ? formatDate(new Date(product.date)) : getCurrentDate());
  const [productNote, setProductNote] = useState(product.note || "");
  const [isUpdatingProduct, setIsUpdatingProduct] = useState(false);
  const [isQuickAdjusting, setIsQuickAdjusting] = useState(false);

  const handleUpdateProduct = async () => {
    if (!productQty || productQty.trim() === "") {
      dispatch(showToast({ message: "Please enter Quantity", type: "error" }));
      return;
    }
    if (!productCostPrice || productCostPrice.trim() === "") {
      dispatch(showToast({ message: "Please enter Cost Price", type: "error" }));
      return;
    }
    if (!productSellingPrice || productSellingPrice.trim() === "") {
      dispatch(showToast({ message: "Please enter Selling Price", type: "error" }));
      return;
    }
    if (!productDateValue || !isValidDate(productDateValue)) {
      dispatch(showToast({ message: "Please enter a valid date (YYYY-MM-DD)", type: "error" }));
      return;
    }
    setIsUpdatingProduct(true);
    try {
      await dispatch(
        updateProduct({
          productId: product._id,
          productData: {
            name: productName,
            qty: parseInt(productQty) || 0,
            cost_price: parseFloat(productCostPrice) || 0,
            selling_price: parseFloat(productSellingPrice) || 0,
            cgst: parseFloat(productCgst) || 0,
            sgst: parseFloat(productSgst) || 0,
            minimum_stock: parseInt(productMinimumStock) || 0,
            category_id: productCategoryId || null,
            customer_id: productCustomerId || null,
            date: productDateValue || getCurrentDate(),
            note: productNote || "",
          },
        })
      ).unwrap();
      dispatch(showToast({ message: `Product "${productName}" updated successfully!`, type: "success" }));
      navigation.goBack();
    } catch (error) {
      const errorMessage = error.message || error.msg || "Failed to update product";
      dispatch(showToast({ message: errorMessage, type: "error" }));
    } finally {
      setIsUpdatingProduct(false);
    }
  };

  const handleQuickAdjust = async (type) => {
    const delta = 1;
    const oldQty = parseInt(productQty, 10) || 0;
    const newQty = type === "add" ? oldQty + delta : Math.max(0, oldQty - delta);
    setProductQty(newQty.toString());
    const effectiveDate = isValidDate(productDateValue) ? productDateValue : getCurrentDate();
    setIsQuickAdjusting(true);
    try {
      await dispatch(
        updateProduct({
          productId: product._id,
          productData: {
            name: productName,
            qty: newQty,
            cost_price: parseFloat(productCostPrice) || 0,
            selling_price: parseFloat(productSellingPrice) || 0,
            cgst: parseFloat(productCgst) || 0,
            sgst: parseFloat(productSgst) || 0,
            minimum_stock: parseInt(productMinimumStock) || 0,
            category_id: productCategoryId || null,
            customer_id: productCustomerId || null,
            date: effectiveDate,
            note: productNote || "",
          },
        })
      ).unwrap();
      dispatch(showToast({ message: type === "add" ? `Added 1 to "${productName}"` : `Subtracted 1 from "${productName}"`, type: "success" }));
    } catch (err) {
      dispatch(showToast({ message: err || "Failed to update quantity", type: "error" }));
      setProductQty(oldQty.toString());
    } finally {
      setIsQuickAdjusting(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert("Delete Product", "Do you want to delete this product?", [
      { text: "Cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await dispatch(deleteProduct(product._id)).unwrap();
            dispatch(showToast({ message: "Product deleted!", type: "success" }));
          } catch (e) {
            dispatch(showToast({ message: "Delete failed", type: "error" }));
          }
        },
      },
    ]);
  };

  const shopName = product.shop_id?.name || "N/A";
  const categoryName = product.category_id?.name || product.category_id?.label || "N/A";

  return (
    <ScrollView style={{ flex: 1, backgroundColor: cardBg }} contentContainerStyle={{ padding: 12, paddingBottom: 24 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 10 }}>
        <View style={{ flexDirection: 'column', gap: 5, flex: 1 }}>
          <View style={{ flexDirection: 'row', gap: 10, marginLeft: 10 }}>
            <Text style={global.productLabel}>{shopName}</Text>
            {categoryName !== 'N/A' && <Text style={global.productLabel}>{categoryName}</Text>}
          </View>
          <Text style={{ color: primaryColor, fontSize: 18, fontWeight: '700', marginLeft: 10 }}>{productName}</Text>
          <View style={{ flexDirection: 'row', gap: 20, marginLeft: 10, flexWrap: 'wrap', margin: 0 }}>
            <Text style={{ color: textSecondary, fontSize: 12, maxWidth: 60, flexShrink: 1 }} numberOfLines={1} ellipsizeMode="tail">
              Qty: <Text style={{ color: primaryColor }}>{productQty || '0'}</Text>
            </Text>
            <Text style={{ color: textSecondary, fontSize: 12, flexShrink: 1 }} numberOfLines={1} ellipsizeMode="tail">
              CP/SP: <Text style={{ color: primaryColor }}>₹{productCostPrice || '0'} / ₹{productSellingPrice || '0'}</Text>
            </Text>
            <Text style={{ color: textSecondary, fontSize: 12, flexShrink: 1 }} numberOfLines={1} ellipsizeMode="tail">
              Note: <Text style={{ color: primaryColor }}>{productNote && productNote.length > 20 ? `${productNote.slice(0, 20)}...` : (productNote || '—')}</Text>
            </Text>
          </View>
        </View>
      </View>

      <View style={{ marginTop: 10, width: '100%' }}>
        {/* Name (full width) */}
        <Text style={{ color: textSecondary, fontSize: 12, marginBottom: 4 }}>Product Name</Text>
        <TextInput style={themedStyles.input} placeholder="Product Name *" placeholderTextColor={textSecondary} value={productName} onChangeText={setProductName} />

        {/* Qty + Minimum Stock */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: textSecondary, fontSize: 12, marginBottom: 4 }}>Quantity</Text>
            <TextInput style={themedStyles.input} placeholder="Quantity *" placeholderTextColor={textSecondary} value={productQty} onChangeText={setProductQty} keyboardType="numeric" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: textSecondary, fontSize: 12, marginBottom: 4 }}>Minimum Stock</Text>
            <TextInput style={themedStyles.input} placeholder="Minimum Stock" placeholderTextColor={textSecondary} value={productMinimumStock} onChangeText={setProductMinimumStock} keyboardType="numeric" />
          </View>
        </View>

        {/* Cost Price + Selling Price */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: textSecondary, fontSize: 12, marginBottom: 4 }}>Cost Price</Text>
            <TextInput style={themedStyles.input} placeholder="Cost Price *" placeholderTextColor={textSecondary} value={productCostPrice} onChangeText={setProductCostPrice} keyboardType="decimal-pad" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: textSecondary, fontSize: 12, marginBottom: 4 }}>Selling Price</Text>
            <TextInput style={themedStyles.input} placeholder="Selling Price *" placeholderTextColor={textSecondary} value={productSellingPrice} onChangeText={setProductSellingPrice} keyboardType="decimal-pad" />
          </View>
        </View>

        {/* CGST + SGST */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: textSecondary, fontSize: 12, marginBottom: 4 }}>CGST (%)</Text>
            <TextInput style={themedStyles.input} placeholder="CGST (%)" placeholderTextColor={textSecondary} value={productCgst} onChangeText={setProductCgst} keyboardType="decimal-pad" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: textSecondary, fontSize: 12, marginBottom: 4 }}>SGST (%)</Text>
            <TextInput style={themedStyles.input} placeholder="SGST (%)" placeholderTextColor={textSecondary} value={productSgst} onChangeText={setProductSgst} keyboardType="decimal-pad" />
          </View>
        </View>

        {/* Date + Category (if categories available) */}
        {productShopCategories.length > 0 ? (
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: textSecondary, fontSize: 12, marginBottom: 4 }}>Date</Text>
              <TextInput style={themedStyles.input} placeholder="Date (YYYY-MM-DD) *" placeholderTextColor={textSecondary} value={productDateValue} onChangeText={setProductDateValue} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: textSecondary, fontSize: 12, marginBottom: 4 }}>Category</Text>
              <View style={[themedStyles.input, { padding: 0 }]}>
                <Picker selectedValue={productCategoryId} onValueChange={(itemValue) => setProductCategoryId(itemValue)} style={{ fontSize: 12, color: textColor }} itemStyle={{ fontSize: 12, color: textColor }}>
                  <Picker.Item label="No Category" value="" />
                  {productShopCategories.map((category) => (
                    <Picker.Item key={category._id} label={category.name} value={category._id} />
                  ))}
                </Picker>
              </View>
            </View>
          </View>
        ) : (
          <>
            <Text style={{ color: textSecondary, fontSize: 12, marginBottom: 4 }}>Date</Text>
            <TextInput style={themedStyles.input} placeholder="Date (YYYY-MM-DD) *" placeholderTextColor={textSecondary} value={productDateValue} onChangeText={setProductDateValue} />
          </>
        )}



        {/* Note (last) */}
        <Text style={{ color: textSecondary, fontSize: 12, marginBottom: 4 }}>Note</Text>
        <TextInput style={themedStyles.input} placeholder="Note" placeholderTextColor={textSecondary} value={productNote} onChangeText={setProductNote} multiline />

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 10, justifyContent: 'flex-end' }}>
          <TouchableOpacity
            style={{
              marginTop: 10,
              ...themedStyles.button1,
              backgroundColor: '#ba181b',
              borderColor: '#ba181b',
            }}
            onPress={confirmDelete}
          >
            <Text style={global.btnText}>Delete</Text>
          </TouchableOpacity>
                    <TouchableOpacity
            style={{
              marginTop: 10,
              ...themedStyles.button1,
              backgroundColor: primaryColor,
              borderColor: primaryColor,
            }}
            onPress={handleUpdateProduct}
            disabled={isUpdatingProduct}
          >
            {isUpdatingProduct ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={global.btnText1}>Save {productName}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

export default ProductDetailScreen;
