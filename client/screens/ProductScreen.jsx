import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
  ScrollView,
} from "react-native";
import { Picker } from '@react-native-picker/picker';
import { global, useThemeColors, BAR_HEIGHT } from "../styles/global";
import { useDispatch, useSelector } from "react-redux";
import { fetchProducts, createProduct, deleteProduct, updateProduct } from "../store/slices/productSlice";
import { fetchCategories, createCategory } from "../store/slices/categorySlice";
import { AntDesign, MaterialIcons } from "@expo/vector-icons";
import { showToast } from "../store/slices/toastSlice";

const ProductScreen = () => {
  const dispatch = useDispatch();

  const { products, status, error } = useSelector((state) => state.products);
  const { categories } = useSelector((state) => state.categories);
  const { customers } = useSelector((state) => state.customers);
  const { shops } = useSelector((state) => state.shops);
  const { role, user } = useSelector((state) => state.auth);
  const { primaryColor } = useThemeColors();
  
  // Get staff's shop from user object
  const staffShops = user?.shops || [];

  const [name, setName] = useState("");
  const [qty, setQty] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [cgst, setCgst] = useState("");
  const [sgst, setSgst] = useState("");
  const [minimumStock, setMinimumStock] = useState("");
  const [selectedShopId, setSelectedShopId] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [isNameFocused, setIsNameFocused] = useState(false);
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  useEffect(() => {
    const loadData = async () => {
      dispatch(fetchProducts());
      dispatch(fetchCategories());
    };
    loadData();

    // Set initial selected shop
    if (role === 'staff' && staffShops.length > 0) {
      // Staff: use their assigned shop
      const staffShopId = staffShops[0]?._id || staffShops[0];
      setSelectedShopId(staffShopId);
    } else if (shops.length > 0) {
      // Owner: use shops from shops state
      setSelectedShopId(shops[0]._id);
    }
  }, [dispatch, shops, role, staffShops]);

  // Filter categories by selected shop
  const shopCategories = categories.filter(cat => cat.shop_id === selectedShopId || cat.shop_id?._id === selectedShopId);

  const handleCreateCategory = async () => {
    if (!newCategoryName || !selectedShopId) {
      dispatch(
        showToast({
          message: "Please enter category name",
          type: "error",
        })
      );
      return;
    }

    try {
      const result = await dispatch(createCategory({
        name: newCategoryName,
        shop_id: selectedShopId,
      })).unwrap();

      dispatch(
        showToast({
          message: "Category created successfully!",
          type: "success",
        })
      );
      
      // Find and select the newly created category from the returned categories
      const newCategory = result?.find(cat => 
        cat.name === newCategoryName && 
        (cat.shop_id === selectedShopId || cat.shop_id?._id === selectedShopId)
      );
      
      if (newCategory) {
        setSelectedCategoryId(newCategory._id);
      }
      
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

  const handleDeleteProduct = async (productId) => {
    try {
      Alert.alert("Delete Product", "Do you want to delete this product?", [
        { text: "Cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await dispatch(deleteProduct(productId)).unwrap();
            dispatch(
              showToast({
                message: "Product deleted!",
                type: "success",
              })
            );
          },
        },
      ]);
    } catch (error) {
      dispatch(
        showToast({
          message: error || "Failed to delete product",
          type: "error",
        })
      );
      console.error("Product deletion error:", error);
    }
  };

  const ProductContainer = ({ product }) => {
    const [showDetails, setShowDetails] = useState(false);
    const [productName, setProductName] = useState(product.name || "");
    const [productQty, setProductQty] = useState(product.qty?.toString() || "0");
    const [productCostPrice, setProductCostPrice] = useState(product.cost_price?.toString() || "0");
    const [productSellingPrice, setProductSellingPrice] = useState(product.selling_price?.toString() || "0");
    const [productCgst, setProductCgst] = useState(product.cgst?.toString() || "0");
    const [productSgst, setProductSgst] = useState(product.sgst?.toString() || "0");
    const [productMinimumStock, setProductMinimumStock] = useState(product.minimum_stock?.toString() || "0");
    const [productCategoryId, setProductCategoryId] = useState(product.category_id?._id || product.category_id || "");
    const [productCustomerId, setProductCustomerId] = useState(product.customer_id?._id || product.customer_id || "");

    // Filter categories by product's shop
    const productShopId = product.shop_id?._id || product.shop_id;
    const productShopCategories = categories.filter(cat => 
      cat.shop_id === productShopId || cat.shop_id?._id === productShopId
    );

    const handleUpdateProduct = async () => {
      if (
        productName === (product.name || "") &&
        productQty === (product.qty?.toString() || "0") &&
        productCostPrice === (product.cost_price?.toString() || "0") &&
        productSellingPrice === (product.selling_price?.toString() || "0") &&
        productCgst === (product.cgst?.toString() || "0") &&
        productSgst === (product.sgst?.toString() || "0") &&
        productMinimumStock === (product.minimum_stock?.toString() || "0") &&
        productCategoryId === (product.category_id?._id || product.category_id || "") &&
        productCustomerId === (product.customer_id?._id || product.customer_id || "")
      ) {
        dispatch(showToast({
          message: "No changes made to product details",
          type: "info",
        }));
        setShowDetails(false);
        return;
      }
      try {
        await dispatch(updateProduct({
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
          },
        })).unwrap();
        dispatch(showToast({
          message: `Product "${productName}" updated successfully!`,
          type: "success",
        }));
        setShowDetails(false);
      } catch (error) {
        const errorMessage = error.message || error.msg || "Failed to update product";
        dispatch(showToast({
          message: errorMessage,
          type: "error",
        }));
        console.error("Product update error:", error);
      }
    };

  return (
      <View
        key={product._id}
        style={{
          ...global.profileRow,
          paddingVertical: 10,
          paddingHorizontal: 8,
          flexDirection: "column",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <View style={{ flexDirection: "row", gap: 10 }}>
            <TouchableOpacity
              onPress={() => {
                setShowDetails(!showDetails);
                setIsNameFocused(false);
                Keyboard.dismiss();
              }}
              style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
            >
              <AntDesign
                style={{ marginTop: 5 }}
                name={showDetails ? "caret-up" : "caret-down"}
                size={20}
                color="black"
              />
              <Text style={{ color: primaryColor, fontSize: 16 }}>
                {product.name}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={{ marginLeft: "auto" }}>
            <TouchableOpacity onPress={() => handleDeleteProduct(product._id)}>
              <MaterialIcons name="delete" size={24} color="#ba181b" />
            </TouchableOpacity>
          </View>
        </View>

        {showDetails && (
          <ScrollView style={{ marginTop: 10, width: "100%" }}>
            <TextInput
              style={global.input}
              placeholder="Product Name *"
              value={productName}
              onChangeText={setProductName}
            />

            <TextInput
              style={global.input}
              placeholder="Quantity *"
              value={productQty}
              onChangeText={setProductQty}
              keyboardType="numeric"
            />

            <TextInput
              style={global.input}
              placeholder="Cost Price *"
              value={productCostPrice}
              onChangeText={setProductCostPrice}
              keyboardType="decimal-pad"
            />

            <TextInput
              style={global.input}
              placeholder="Selling Price *"
              value={productSellingPrice}
              onChangeText={setProductSellingPrice}
              keyboardType="decimal-pad"
            />

            <TextInput
              style={global.input}
              placeholder="CGST (%)"
              value={productCgst}
              onChangeText={setProductCgst}
              keyboardType="decimal-pad"
            />

            <TextInput
              style={global.input}
              placeholder="SGST (%)"
              value={productSgst}
              onChangeText={setProductSgst}
              keyboardType="decimal-pad"
            />

            <TextInput
              style={global.input}
              placeholder="Minimum Stock *"
              value={productMinimumStock}
              onChangeText={setProductMinimumStock}
              keyboardType="numeric"
            />

            {productShopCategories.length > 0 && (
              <View style={{ ...global.input, padding: 0 }}>
                <Picker
                  selectedValue={productCategoryId}
                  onValueChange={(itemValue) => setProductCategoryId(itemValue)}
                >
                  <Picker.Item label="No Category" value="" />
                  {productShopCategories.map((category) => (
                    <Picker.Item key={category._id} label={category.name} value={category._id} />
                  ))}
                </Picker>
              </View>
            )}

            {customers.length > 0 && (
              <View style={{ ...global.input, padding: 0 }}>
                <Picker
                  selectedValue={productCustomerId}
                  onValueChange={(itemValue) => setProductCustomerId(itemValue)}
                >
                  <Picker.Item label="No Customer" value="" />
                  {customers.map((customer) => (
                    <Picker.Item key={customer._id} label={customer.name} value={customer._id} />
                  ))}
                </Picker>
              </View>
            )}

            <View>
              <TouchableOpacity
                style={{ marginTop: 10, ...global.button1 }}
                onPress={handleUpdateProduct}
              >
                <Text style={global.btnText1}>Save {productName}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </View>
    );
  };

  const handleAddProduct = async () => {
    if (!name || !selectedShopId) {
      dispatch(
        showToast({
          message: role === 'staff' 
            ? "Please enter product name" 
            : "Please enter product name and select a shop",
          type: "error",
        })
      );
      return;
    }

    try {
      await dispatch(createProduct({
        name,
        qty: parseInt(qty) || 0,
        cost_price: parseFloat(costPrice) || 0,
        selling_price: parseFloat(sellingPrice) || 0,
        cgst: parseFloat(cgst) || 0,
        sgst: parseFloat(sgst) || 0,
        minimum_stock: parseInt(minimumStock) || 0,
        shop_id: selectedShopId,
        category_id: selectedCategoryId || null,
      })).unwrap();

      dispatch(
        showToast({
          message: "Product created successfully!",
          type: "success",
        })
      );
      setName("");
      setQty("");
      setCostPrice("");
      setSellingPrice("");
      setCgst("");
      setSgst("");
      setMinimumStock("");
      setSelectedCategoryId("");
      // Reset shop selection based on role
      if (role === 'staff' && staffShops.length > 0) {
        const staffShopId = staffShops[0]?._id || staffShops[0];
        setSelectedShopId(staffShopId);
      } else if (shops.length > 0) {
        setSelectedShopId(shops[0]._id);
      }
      setIsNameFocused(false);
      Keyboard.dismiss();
    } catch (err) {
      dispatch(
        showToast({
          message: err || "Failed to create product",
          type: "error",
        })
      );
    }
  };

  return (
    <TouchableWithoutFeedback onPress={() => { Keyboard.dismiss(); setIsNameFocused(false); }}>
      <ScrollView 
        style={global.mainContainer}
        contentContainerStyle={{ paddingBottom: BAR_HEIGHT + 40 }}
      >
        <View style={{ marginTop: 10 }}>
          <Text style={{ marginBottom: 10 }}>Add Product</Text>
          <TextInput
            style={global.input}
            placeholder="Product Name *"
            value={name}
            onChangeText={setName}
            onFocus={() => setIsNameFocused(true)}
          />

          {isNameFocused && (
            <>
              {role !== 'staff' && shops.length > 0 && (
                <View style={{ ...global.input, padding: 0 }}>
                  <Picker
                    selectedValue={selectedShopId}
                    onValueChange={(itemValue) => {
                      setSelectedShopId(itemValue);
                      setSelectedCategoryId(""); // Reset category when shop changes
                    }}
                  >
                    {shops.map((shop) => (
                      <Picker.Item key={shop._id} label={shop.name} value={shop._id} />
                    ))}
                  </Picker>
                </View>
              )}

              {selectedShopId && (
                <View>
                  {!showCreateCategory ? (
                    <View style={{ ...global.input, padding: 0 }}>
                      <Picker
                        selectedValue={selectedCategoryId}
                        onValueChange={(itemValue) => {
                          if (itemValue === "create_new") {
                            setShowCreateCategory(true);
                            setSelectedCategoryId("");
                          } else {
                            setSelectedCategoryId(itemValue);
                          }
                        }}
                      >
                        <Picker.Item label="No Category" value="" />
                        {shopCategories.map((category) => (
                          <Picker.Item key={category._id} label={category.name} value={category._id} />
                        ))}
                        <Picker.Item label="+ Create New Category" value="create_new" />
                      </Picker>
                    </View>
                  ) : (
                    <View>
                      <TextInput
                        style={global.input}
                        placeholder="New Category Name *"
                        value={newCategoryName}
                        onChangeText={setNewCategoryName}
                      />
                      <View style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}>
                        <TouchableOpacity
                          style={{ ...global.button1, flex: 1, backgroundColor: "#666" }}
                          onPress={() => {
                            setShowCreateCategory(false);
                            setNewCategoryName("");
                          }}
                        >
                          <Text style={global.btnText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={{ ...global.button1, flex: 1 }}
                          onPress={handleCreateCategory}
                        >
                          <Text style={global.btnText}>Create</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              )}

              <TextInput
                style={global.input}
                placeholder="Quantity"
                value={qty}
                onChangeText={setQty}
                keyboardType="numeric"
              />

              <TextInput
                style={global.input}
                placeholder="Cost Price"
                value={costPrice}
                onChangeText={setCostPrice}
                keyboardType="decimal-pad"
              />

              <TextInput
                style={global.input}
                placeholder="Selling Price"
                value={sellingPrice}
                onChangeText={setSellingPrice}
                keyboardType="decimal-pad"
              />

              <TextInput
                style={global.input}
                placeholder="CGST (%)"
                value={cgst}
                onChangeText={setCgst}
                keyboardType="decimal-pad"
              />

              <TextInput
                style={global.input}
                placeholder="SGST (%)"
                value={sgst}
                onChangeText={setSgst}
                keyboardType="decimal-pad"
              />

              <TextInput
                style={global.input}
                placeholder="Minimum Stock"
                value={minimumStock}
                onChangeText={setMinimumStock}
                keyboardType="numeric"
              />

              <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
                <TouchableOpacity
                  style={{ ...global.button1, width: "30%", backgroundColor: "#666" }}
                  onPress={() => {
                    setIsNameFocused(false);
                    setName("");
                    setQty("");
                    setCostPrice("");
                    setSellingPrice("");
                    setCgst("");
                    setSgst("");
                    setMinimumStock("");
                    setSelectedCategoryId("");
                    setShowCreateCategory(false);
                    setNewCategoryName("");
                    Keyboard.dismiss();
                  }}
                >
                  <Text style={global.btnText}>Close</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ ...global.button1, width: "30%" }}
                  onPress={handleAddProduct}
                >
                  <Text style={global.btnText}>Add</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
    </View>
        <Text style={{ marginBottom: 5, marginTop: 20 }}>Product List</Text>
        {products.map((product) => (
          <ProductContainer key={product._id} product={product} />
        ))}
      </ScrollView>
    </TouchableWithoutFeedback>
  );
};

export default ProductScreen;
