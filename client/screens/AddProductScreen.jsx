import React, { useState } from "react";
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useSelector, useDispatch } from "react-redux";
import { useThemeColors, useThemedStyles } from "../styles/global";
import { showToast } from "../store/slices/toastSlice";
import { createProduct } from "../store/slices/productSlice";
import { createCategory } from "../store/slices/categorySlice";
import { Picker } from "@react-native-picker/picker";
import {
  TextInput,
  TouchableOpacity,
  Text,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

const AddProductScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { shops } = useSelector((state) => state.shops);
  const { categories } = useSelector((state) => state.categories);
  const { products } = useSelector((state) => state.products || { products: [] });
  const { userid, role, user } = useSelector((state) => state.auth);
  const themedStyles = useThemedStyles();
  const { cardBg, textColor, textSecondary, isDarkMode, primaryColor } = useThemeColors();

  const staffShops = user?.shops || [];
  const [name, setName] = useState("");
  const [qty, setQty] = useState("");
  const [showProductNameResults, setShowProductNameResults] = useState(false);
  const [costPrice, setCostPrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [cgst, setCgst] = useState("");
  const [sgst, setSgst] = useState("");
  const [minimumStock, setMinimumStock] = useState("");
  const [selectedShopId, setSelectedShopId] = useState(
    shops && shops.length > 0 ? shops[0]._id : ""
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [productDate, setProductDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [note, setNote] = useState("");
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");


  const shopCategories = categories.filter(
    (cat) =>
      cat.shop_id === selectedShopId || cat.shop_id?._id === selectedShopId
  );

  // Filter products for name search (from selected shop only)
  const filteredProductNameResults =
    name && selectedShopId && Array.isArray(products)
      ? products.filter(
          (p) =>
            (p.shop_id === selectedShopId || (p.shop_id && p.shop_id._id === selectedShopId)) &&
            p.name &&
            p.name.toLowerCase().includes(name.toLowerCase())
        )
      : [];

  const handleCreateCategory = async () => {
    if (!newCategoryName || !selectedShopId) {
      dispatch(
        showToast({ message: "Please enter category name", type: "error" })
      );
      return;
    }
    try {
      await dispatch(
        createCategory({ name: newCategoryName, shop_id: selectedShopId })
      ).unwrap();
      dispatch(
        showToast({
          message: "Category created successfully!",
          type: "success",
        })
      );
      setNewCategoryName("");
      setShowCreateCategory(false);
    } catch (err) {
      dispatch(
        showToast({
          message: err || "Failed to create category",
          type: "error",
        })
      );
    }
  };

  const handleAddProduct = async () => {
    if (!name || !selectedShopId) {
      dispatch(
        showToast({
          message: "Please enter product name and select a shop",
          type: "error",
        })
      );
      return;
    }
    if (!selectedCategoryId) {
      dispatch(
        showToast({
          message: "Please select a category",
          type: "error",
        })
      );
      return;
    }
    // Check if product name already exists in the selected shop
    const nameExists = Array.isArray(products)
      ? products.some(
          (p) =>
            (p.shop_id === selectedShopId || (p.shop_id && p.shop_id._id === selectedShopId)) &&
            p.name &&
            p.name.trim().toLowerCase() === name.trim().toLowerCase()
        )
      : false;
    if (nameExists) {
      dispatch(
        showToast({
          message: "Product name already exists in this shop!",
          type: "error",
        })
      );
      return;
    }
    if (!qty) {
      dispatch(showToast({ message: "Please enter Quantity", type: "error" }));
      return;
    }
    if (!costPrice) {
      dispatch(
        showToast({ message: "Please enter Cost Price", type: "error" })
      );
      return;
    }
    if (!sellingPrice) {
      dispatch(
        showToast({ message: "Please enter Selling Price", type: "error" })
      );
      return;
    }
    setIsAddingProduct(true);
    try {
      await dispatch(
        createProduct({
          name,
          qty: parseInt(qty) || 0,
          cost_price: parseFloat(costPrice) || 0,
          selling_price: parseFloat(sellingPrice) || 0,
          cgst: parseFloat(cgst) || 0,
          sgst: parseFloat(sgst) || 0,
          minimum_stock: parseInt(minimumStock) || 0,
          shop_id: selectedShopId,
          user_id: userid,
          category_id: selectedCategoryId,
          date: productDate,
          note: note || "",
        })
      ).unwrap();
      dispatch(
        showToast({ message: "Product created successfully!", type: "success" })
      );
      navigation.goBack();
    } catch (err) {
      dispatch(
        showToast({ message: err || "Failed to create product", type: "error" })
      );
    } finally {
      setIsAddingProduct(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: cardBg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 16 }}>
        <View style={{ flex: 1 }}>
          {/* Product Name Field */}
          <View style={{ flexDirection: "row", gap: 10 }}>
            <TextInput
              style={[themedStyles.input, { flex: 1 }]}
              placeholder="Product Name *"
              placeholderTextColor={textSecondary}
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (text && selectedShopId) {
                  setShowProductNameResults(true);
                } else {
                  setShowProductNameResults(false);
                }
              }}
              onFocus={() => {
                if (name && selectedShopId) setShowProductNameResults(true);
              }}
              onBlur={() => {
                setTimeout(() => setShowProductNameResults(false), 200);
              }}
              autoCorrect={false}
              autoCapitalize="none"
            />
          </View>
          {/* Product name search results (rendered just below the field, not inside the row) */}
          {/* {showProductNameResults && filteredProductNameResults.length > 0 && (
            <View style={{ backgroundColor: cardBg, borderRadius: 8, marginTop: 2, marginBottom: 8, borderWidth: 1, borderColor: textSecondary }}>
              {filteredProductNameResults.slice(0, 5).map((prod) => (
                <TouchableOpacity
                  key={prod._id}
                  onPress={() => {
                    setName(prod.name || "");
                    setQty(prod.qty ? String(prod.qty) : "");
                    setCostPrice(prod.cost_price ? String(prod.cost_price) : "");
                    setSellingPrice(prod.selling_price ? String(prod.selling_price) : "");
                    setCgst(prod.cgst ? String(prod.cgst) : "");
                    setSgst(prod.sgst ? String(prod.sgst) : "");
                    setMinimumStock(prod.minimum_stock ? String(prod.minimum_stock) : "");
                    setNote(prod.note || "");
                    setSelectedCategoryId(prod.category_id ? (prod.category_id._id || prod.category_id) : "");
                    setProductDate(prod.date ? prod.date.slice(0, 10) : new Date().toISOString().slice(0, 10));
                    setTimeout(() => setShowProductNameResults(false), 100);
                  }}
                  style={{ padding: 10 }}
                >
                  <Text style={{ color: textColor }}>{prod.name}
                    <Text style={{ color: textSecondary }}> ({prod.category_id ? (prod.category_id.name || "") : ""})</Text>
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )} */}
          <View style={{ flexDirection: "row", gap: 10 }}>
            <TextInput
              style={[themedStyles.input, { flex: 1 }]}
              placeholder="Minimum Stock"
              placeholderTextColor={textSecondary}
              value={minimumStock}
              onChangeText={setMinimumStock}
              keyboardType="numeric"
            />
            <TextInput
              style={[themedStyles.input, { flex: 1 }]}
              placeholder="Quantity *"
              placeholderTextColor={textSecondary}
              value={qty}
              onChangeText={setQty}
              keyboardType="numeric"
            />
          </View>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <TextInput
              style={[themedStyles.input, { flex: 1 }]}
              placeholder="Cost Price *"
              placeholderTextColor={textSecondary}
              value={costPrice}
              onChangeText={setCostPrice}
              keyboardType="decimal-pad"
            />
            <TextInput
              style={[themedStyles.input, { flex: 1 }]}
              placeholder="Selling Price *"
              placeholderTextColor={textSecondary}
              value={sellingPrice}
              onChangeText={setSellingPrice}
              keyboardType="decimal-pad"
            />
          </View>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <TextInput
              style={[themedStyles.input, { flex: 1 }]}
              placeholder="CGST (%)"
              placeholderTextColor={textSecondary}
              value={cgst}
              onChangeText={setCgst}
              keyboardType="decimal-pad"
            />
            <TextInput
              style={[themedStyles.input, { flex: 1 }]}
              placeholder="SGST (%)"
              placeholderTextColor={textSecondary}
              value={sgst}
              onChangeText={setSgst}
              keyboardType="decimal-pad"
            />
          </View>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <TextInput
                style={[themedStyles.input, { width: "100%" }]}
                placeholder="Note"
                placeholderTextColor={textSecondary}
                value={note}
                onChangeText={setNote}
                multiline
              />
            </View>
            <View style={{ flex: 1 }}>
              <Pressable onPress={() => setShowDatePicker(true)} style={{ width: "100%" }}>
                <View pointerEvents="none">
                  <TextInput
                    style={[themedStyles.input, { width: "100%" }]}
                    placeholder="Date (YYYY-MM-DD) *"
                    placeholderTextColor={textSecondary}
                    value={productDate}
                    editable={false}
                  />
                </View>
              </Pressable>
              {showDatePicker && (
                <DateTimePicker
                  value={productDate ? new Date(productDate) : new Date()}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  themeVariant={isDarkMode ? "dark" : "light"}
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) {
                      const d = new Date(selectedDate);
                      const year = d.getFullYear();
                      const month = String(d.getMonth() + 1).padStart(2, "0");
                      const day = String(d.getDate()).padStart(2, "0");
                      setProductDate(`${year}-${month}-${day}`);
                    }
                  }}
                  maximumDate={new Date()}
                />
              )}
            </View>
          </View>
          {role !== "staff" && shops.length > 0 && (
            <View style={[themedStyles.input, { padding: 0 }]}>
              <Picker
                selectedValue={selectedShopId}
                onValueChange={(itemValue) => {
                  setSelectedShopId(itemValue);
                  setSelectedCategoryId("");
                }}
                style={{ color: textColor }}
                itemStyle={{ color: textColor }}
              >
                <Picker.Item label="Select Shop" value="" />
                {shops.map((shop) => (
                  <Picker.Item
                    key={shop._id}
                    label={shop.name}
                    value={shop._id}
                  />
                ))}
              </Picker>
            </View>
          )}
          {selectedShopId && !showCreateCategory ? (
            <View style={[themedStyles.input, { padding: 0 }]}>
              <Picker
                selectedValue={selectedCategoryId}
                onValueChange={(itemValue) => {
                  if (itemValue === "create_new") {
                    setShowCreateCategory(true);
                  } else {
                    setSelectedCategoryId(itemValue);
                  }
                }}
                style={{ color: textColor }}
                itemStyle={{ color: textColor }}
              >
                <Picker.Item label="No Category" value="" />
                {shopCategories.map((category) => (
                  <Picker.Item
                    key={category._id}
                    label={category.name}
                    value={category._id}
                  />
                ))}
                <Picker.Item label="+ Create New Category" value="create_new" />
              </Picker>
            </View>
          ) : null}
          {showCreateCategory && (
            <View>
              <TextInput
                style={themedStyles.input}
                placeholder="New Category Name *"
                placeholderTextColor={textSecondary}
                value={newCategoryName}
                onChangeText={setNewCategoryName}
              />
              <View style={{ flexDirection: "row", gap: 10, marginBottom: 10, }}>
                <TouchableOpacity
                  style={{
                    ...themedStyles.button1,
                    flex: 1,
                    backgroundColor: textSecondary,
                  }}
                  onPress={() => {
                    setShowCreateCategory(false);
                    setNewCategoryName("");
                  }}
                >
                  <Text style={{ ...themedStyles.text, textAlign: "center", color: isDarkMode ? "#000" : "#fff" }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ ...themedStyles.button1, flex: 1, backgroundColor: primaryColor }}
                  onPress={handleCreateCategory}
                >
                  <Text style={{ ...themedStyles.text, textAlign: "center", color: "#fff" }}>Create</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "flex-end",
              gap: 10,
              marginTop: 10,
            }}
          >
            <TouchableOpacity
              style={{
                ...themedStyles.button1,
                width: "20%",
                backgroundColor: textSecondary,
              }}
              onPress={() => navigation.goBack()}
            >
              <Text style={{ ...themedStyles.text, textAlign: "center", color: isDarkMode ? "#000" : "#fff" }}>Close</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                ...themedStyles.button1,
                width: "20%",
                opacity: isAddingProduct ? 0.6 : 1,
                backgroundColor: primaryColor
              }}
              onPress={handleAddProduct}
              disabled={isAddingProduct}
            >
              {isAddingProduct ? (
                <ActivityIndicator color={isDarkMode ? "#000" : "#fff"} />
              ) : (
                <Text style={{ ...themedStyles.text, textAlign: "center", color: "#fff" }}>Add</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>color: "#fff"
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default AddProductScreen;
