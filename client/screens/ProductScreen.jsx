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
  ActivityIndicator,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import {
  global,
  useThemeColors,
  BAR_HEIGHT,
  SECONDARY_COLOR_DEFAULT,
} from "../styles/global";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchProducts,
  createProduct,
  deleteProduct,
  updateProduct,
} from "../store/slices/productSlice";
import { fetchCategories, createCategory } from "../store/slices/categorySlice";
import { AntDesign, MaterialIcons } from "@expo/vector-icons";
import { showToast } from "../store/slices/toastSlice";

const ProductScreen = () => {
  const dispatch = useDispatch();

  const { products } = useSelector((state) => state.products);
  const { categories } = useSelector((state) => state.categories);
  const { customers } = useSelector((state) => state.customers);
  const { shops } = useSelector((state) => state.shops);
  const { userid, role, user } = useSelector((state) => state.auth);
  const { primaryColor } = useThemeColors();

  const staffShops = user?.shops || [];

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

  const [name, setName] = useState("");
  const [qty, setQty] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [cgst, setCgst] = useState("");
  const [sgst, setSgst] = useState("");
  const [minimumStock, setMinimumStock] = useState("");
  const [selectedShopId, setSelectedShopId] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [productDate, setProductDate] = useState(getCurrentDate());
  const [note, setNote] = useState("");
  const [isNameFocused, setIsNameFocused] = useState(false);
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isAddingProduct, setIsAddingProduct] = useState(false);

  // filters
  const [filterSearch, setFilterSearch] = useState("");
  const [filterShopId, setFilterShopId] = useState("");
  const [filterCategoryId, setFilterCategoryId] = useState("");

  // suggestions
  const [nameSuggestions, setNameSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // track collapsed state per category in product list
  const [collapsedCategories, setCollapsedCategories] = useState({});

  // when user picks an existing product from suggestions
  const [selectedExistingProduct, setSelectedExistingProduct] = useState(null);

  // top navbar tabs: 0 = Name Manager, 1 = QR Generator
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      dispatch(fetchProducts());
      dispatch(fetchCategories());
    };
    loadData();

    if (role === "staff" && staffShops.length > 0) {
      const staffShopId = staffShops[0]?._id || staffShops[0];
      setSelectedShopId(staffShopId);
      setFilterShopId(staffShopId);
    } else if (shops.length > 0) {
      setSelectedShopId(shops[0]._id);
      setFilterShopId("");
    }
  }, [dispatch, shops, role, staffShops]);

  // Add form: categories filtered by selected shop
  const shopCategories = categories.filter(
    (cat) =>
      cat.shop_id === selectedShopId || cat.shop_id?._id === selectedShopId
  );

  // Filter bar: categories filtered by filterShopId (or all if none)
  const filterCategories = categories.filter((cat) => {
    const sid = cat.shop_id?._id || cat.shop_id;
    if (!filterShopId) return true;
    return sid === filterShopId;
  });

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
      const result = await dispatch(
        createCategory({
          name: newCategoryName,
          shop_id: selectedShopId,
        })
      ).unwrap();

      dispatch(
        showToast({
          message: "Category created successfully!",
          type: "success",
        })
      );

      const newCategory = result?.find(
        (cat) =>
          cat.name === newCategoryName &&
          (cat.shop_id === selectedShopId ||
            cat.shop_id?._id === selectedShopId)
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

  const ProductContainer = ({ product, index, data }) => {
    const [showDetails, setShowDetails] = useState(false);
    const [isUpdatingProduct, setIsUpdatingProduct] = useState(false);
    const [isQuickAdjusting, setIsQuickAdjusting] = useState(false);
    const [productName, setProductName] = useState(product.name || "");
    const [productQty, setProductQty] = useState(
      product.qty?.toString() || "0"
    );
    const [productCostPrice, setProductCostPrice] = useState(
      product.cost_price?.toString() || "0"
    );
    const [productSellingPrice, setProductSellingPrice] = useState(
      product.selling_price?.toString() || "0"
    );
    const [productCgst, setProductCgst] = useState(
      product.cgst?.toString() || "0"
    );
    const [productSgst, setProductSgst] = useState(
      product.sgst?.toString() || "0"
    );
    const [productMinimumStock, setProductMinimumStock] = useState(
      product.minimum_stock?.toString() || "0"
    );
    const [productCategoryId, setProductCategoryId] = useState(
      product.category_id?._id || product.category_id || ""
    );
    const [productCustomerId, setProductCustomerId] = useState(
      product.customer_id?._id || product.customer_id || ""
    );
    const [productDateValue, setProductDateValue] = useState(
      product.date ? formatDate(new Date(product.date)) : getCurrentDate()
    );
    const [productNote, setProductNote] = useState(product.note || "");

    // quick qty state for add/sub buttons
    const [quickQty, setQuickQty] = useState("");

    const productShopId = product.shop_id?._id || product.shop_id;
    const productShopCategories = categories.filter(
      (cat) =>
        cat.shop_id === productShopId || cat.shop_id?._id === productShopId
    );

    const handleUpdateProduct = async () => {
      if (!productQty || productQty.trim() === "") {
        dispatch(
          showToast({
            message: "Please enter Quantity",
            type: "error",
          })
        );
        return;
      }

      if (!productCostPrice || productCostPrice.trim() === "") {
        dispatch(
          showToast({
            message: "Please enter Cost Price",
            type: "error",
          })
        );
        return;
      }

      if (!productSellingPrice || productSellingPrice.trim() === "") {
        dispatch(
          showToast({
            message: "Please enter Selling Price",
            type: "error",
          })
        );
        return;
      }

      if (!productDateValue || !isValidDate(productDateValue)) {
        dispatch(
          showToast({
            message: "Please enter a valid date (YYYY-MM-DD)",
            type: "error",
          })
        );
        return;
      }

      if (
        productName === (product.name || "") &&
        productQty === (product.qty?.toString() || "0") &&
        productCostPrice === (product.cost_price?.toString() || "0") &&
        productSellingPrice === (product.selling_price?.toString() || "0") &&
        productCgst === (product.cgst?.toString() || "0") &&
        productSgst === (product.sgst?.toString() || "0") &&
        productMinimumStock === (product.minimum_stock?.toString() || "0") &&
        productCategoryId ===
          (product.category_id?._id || product.category_id || "") &&
        productCustomerId ===
          (product.customer_id?._id || product.customer_id || "") &&
        productNote === (product.note || "")
      ) {
        const existingDate = product.date
          ? formatDate(new Date(product.date))
          : getCurrentDate();
        if (productDateValue === existingDate) {
          dispatch(
            showToast({
              message: "No changes made to product details",
              type: "info",
            })
          );
          setShowDetails(false);
          return;
        }
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
        dispatch(
          showToast({
            message: `Product "${productName}" updated successfully!`,
            type: "success",
          })
        );
        setShowDetails(false);
      } catch (error) {
        const errorMessage =
          error.message || error.msg || "Failed to update product";
        dispatch(
          showToast({
            message: errorMessage,
            type: "error",
          })
        );
        console.error("Product update error:", error);
      } finally {
        setIsUpdatingProduct(false);
      }
    };

    // quick add/sub handler
    // quick add/sub handler (always +/- 1)
    const handleQuickAdjust = async (type) => {
      const delta = 1; // always 1
      const oldQty = parseInt(productQty, 10) || 0;
      const newQty =
        type === "add" ? oldQty + delta : Math.max(0, oldQty - delta);

      // update local state so UI reflects immediately
      setProductQty(newQty.toString());

      const effectiveDate = isValidDate(productDateValue)
        ? productDateValue
        : getCurrentDate();

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

        dispatch(
          showToast({
            message:
              type === "add"
                ? `Added 1 to "${productName}"`
                : `Subtracted 1 from "${productName}"`,
            type: "success",
          })
        );
      } catch (err) {
        dispatch(
          showToast({
            message: err || "Failed to update quantity",
            type: "error",
          })
        );
        // revert on error
        setProductQty(oldQty.toString());
      } finally {
        setIsQuickAdjusting(false);
      }
    };

    const shopName = product.shop_id?.name || "N/A";
    const categoryName =
      product.category_id?.name || product.category_id?.label || "N/A";

    return (
      <View
        key={product._id}
        style={{
          ...(index === data.length - 1
            ? global.profileRowLast
            : global.profileRow),
          paddingVertical: 6,
          paddingHorizontal: 8,
          flexDirection: "column",
        }}
      >
        {/* Top row */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            position: "relative",
          }}
        >
          <View style={{ flexDirection: "row", gap: 10, flex: 1 }}>
            <View style={{ flexDirection: "column", gap: 5, flex: 1 }}>
              <View style={{ flexDirection: "row", gap: 10, marginLeft: 10 }}>
                <Text style={global.productLabel}>{shopName}</Text>
                {categoryName !== "N/A" && (
                  <Text style={global.productLabel}>{categoryName}</Text>
                )}
              </View>
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

              <View
                style={{
                  flexDirection: "row",
                  gap: 20,
                  marginLeft: 10,
                  flexWrap: "wrap",
                  margin: 0,
                }}
              >
                <Text
                  style={{
                    color: "#666",
                    fontSize: 12,
                    maxWidth: 60,
                    flexShrink: 1,
                  }}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  Qty:{" "}
                  <Text style={{ color: primaryColor }}>
                    {productQty || "0"}
                  </Text>
                </Text>
                <Text
                  style={{
                    color: "#666",
                    fontSize: 12,
                    flexShrink: 1,
                  }}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  CP/SP:{" "}
                  <Text style={{ color: primaryColor }}>
                    ₹{productCostPrice || "0"} / ₹{productSellingPrice || "0"}
                  </Text>
                </Text>
              </View>
            </View>
          </View>
        </View>
        {/* Quick qty controls below each product (always +/- 1) */}
        <View
          style={{
            flexDirection: "row",
            alignSelf: "flex-end",
            marginTop: 8,
            gap: 10,
          }}
        >
          <TouchableOpacity
            onPress={() => handleQuickAdjust("add")}
            disabled={isQuickAdjusting}
            style={{
              paddingVertical: 4,
              paddingHorizontal: 10,
              borderRadius: 6,
              borderWidth: 1,
              borderColor: primaryColor,
              opacity: isQuickAdjusting ? 0.6 : 1,
            }}
          >
            {isQuickAdjusting ? (
              <ActivityIndicator size="small" color={primaryColor} />
            ) : (
              <Text style={{ fontSize: 12, color: primaryColor }}>+ 1</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleQuickAdjust("sub")}
            disabled={isQuickAdjusting}
            style={{
              paddingVertical: 4,
              paddingHorizontal: 10,
              borderRadius: 6,
              borderWidth: 1,
              borderColor: "#ba181b",
              opacity: isQuickAdjusting ? 0.6 : 1,
            }}
          >
            {isQuickAdjusting ? (
              <ActivityIndicator size="small" color="#ba181b" />
            ) : (
              <Text style={{ fontSize: 12, color: "#ba181b" }}>- 1</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleDeleteProduct(product._id)}
            style={{
              paddingVertical: 4,
              paddingHorizontal: 10,
              borderRadius: 6,
              borderWidth: 1,
              borderColor: "#ba181b",
              marginLeft: 4,
            }}
          >
            <Text style={{ fontSize: 12, color: "#ba181b" }}>Delete</Text>
          </TouchableOpacity>
        </View>

        {/* full edit details */}
        {showDetails && (
          <View style={{ marginTop: 10, width: "100%" }}>
            <TextInput
              style={global.input}
              placeholder="Product Name *"
              value={productName}
              onChangeText={setProductName}
              editable={!isUpdatingProduct}
            />

            <TextInput
              style={global.input}
              placeholder="Quantity *"
              value={productQty}
              onChangeText={setProductQty}
              keyboardType="numeric"
              editable={!isUpdatingProduct}
            />

            <TextInput
              style={global.input}
              placeholder="Cost Price *"
              value={productCostPrice}
              onChangeText={setProductCostPrice}
              keyboardType="decimal-pad"
              editable={!isUpdatingProduct}
            />

            <TextInput
              style={global.input}
              placeholder="Selling Price *"
              value={productSellingPrice}
              onChangeText={setProductSellingPrice}
              keyboardType="decimal-pad"
              editable={!isUpdatingProduct}
            />

            <TextInput
              style={global.input}
              placeholder="CGST (%)"
              value={productCgst}
              onChangeText={setProductCgst}
              keyboardType="decimal-pad"
              editable={!isUpdatingProduct}
            />

            <TextInput
              style={global.input}
              placeholder="SGST (%)"
              value={productSgst}
              onChangeText={setProductSgst}
              keyboardType="decimal-pad"
              editable={!isUpdatingProduct}
            />

            <TextInput
              style={global.input}
              placeholder="Minimum Stock"
              value={productMinimumStock}
              onChangeText={setProductMinimumStock}
              keyboardType="numeric"
              editable={!isUpdatingProduct}
            />

            <TextInput
              style={global.input}
              placeholder="Date (YYYY-MM-DD) *"
              value={productDateValue}
              onChangeText={setProductDateValue}
              editable={!isUpdatingProduct}
            />

            <TextInput
              style={global.input}
              placeholder="Note"
              value={productNote}
              onChangeText={setProductNote}
              multiline
              editable={!isUpdatingProduct}
            />

            {productShopCategories.length > 0 && (
              <View style={{ ...global.input, padding: 0, opacity: isUpdatingProduct ? 0.6 : 1 }}>
                <Picker
                  selectedValue={productCategoryId}
                  onValueChange={(itemValue) => setProductCategoryId(itemValue)}
                  enabled={!isUpdatingProduct}
                  style={{ fontSize: 12 }}
                  itemStyle={{ fontSize: 12 }}
                >
                  <Picker.Item label="No Category" value="" />
                  {productShopCategories.map((category) => (
                    <Picker.Item
                      key={category._id}
                      label={category.name}
                      value={category._id}
                    />
                  ))}
                </Picker>
              </View>
            )}

            {customers.length > 0 && (
              <View style={{ ...global.input, padding: 0, opacity: isUpdatingProduct ? 0.6 : 1 }}>
                <Picker
                  selectedValue={productCustomerId}
                  onValueChange={(itemValue) => setProductCustomerId(itemValue)}
                  enabled={!isUpdatingProduct}
                  style={{ fontSize: 12 }}
                  itemStyle={{ fontSize: 12 }}
                >
                  <Picker.Item label="No Customer" value="" />
                  {customers.map((customer) => (
                    <Picker.Item
                      key={customer._id}
                      label={customer.name}
                      value={customer._id}
                    />
                  ))}
                </Picker>
              </View>
            )}

            <View>
              <TouchableOpacity
                style={{ 
                  marginTop: 10, 
                  ...global.button1,
                  opacity: isUpdatingProduct ? 0.6 : 1,
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
        )}
      </View>
    );
  };

  // suggestion logic for Add Product name
  const updateNameAndSuggestions = (text) => {
    setName(text);

    if (!text || text.trim().length < 3) {
      setSelectedExistingProduct(null);
      setNameSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const search = text.toLowerCase();
    let base = products;

    if (selectedShopId) {
      base = base.filter((p) => {
        const psid = p.shop_id?._id || p.shop_id;
        return psid === selectedShopId;
      });
    }

    const seenNames = new Set();
    const matches = [];

    for (const p of base) {
      if (!p.name) continue;
      const n = p.name.toLowerCase();
      if (n.includes(search) && !seenNames.has(n)) {
        seenNames.add(n);
        matches.push(p);
      }
      if (matches.length >= 5) break;
    }

    setNameSuggestions(matches);
    setShowSuggestions(matches.length > 0);
    setSelectedExistingProduct(null); // new typing => unlock
  };

  const handlePickSuggestion = (product) => {
    setSelectedExistingProduct(product);

    setName(product.name || "");

    const prodShopId = product.shop_id?._id || product.shop_id;
    if (role !== "staff" && prodShopId) {
      setSelectedShopId(prodShopId);
    }

    const catId = product.category_id?._id || product.category_id;
    if (catId) {
      setSelectedCategoryId(catId);
    }

    setCostPrice(
      product.cost_price != null ? product.cost_price.toString() : ""
    );
    setSellingPrice(
      product.selling_price != null ? product.selling_price.toString() : ""
    );
    setCgst(product.cgst != null ? product.cgst.toString() : "");
    setSgst(product.sgst != null ? product.sgst.toString() : "");
    setMinimumStock(
      product.minimum_stock != null ? product.minimum_stock.toString() : ""
    );
    setProductDate(
      product.date ? formatDate(new Date(product.date)) : getCurrentDate()
    );
    setNote(product.note || "");

    // qty is only what user wants to add
    setQty("");

    setShowCreateCategory(false);
    setShowSuggestions(false);
    setNameSuggestions([]);
  };

  const handleAddProduct = async () => {
    if (!qty || qty.trim() === "") {
      dispatch(
        showToast({
          message: "Please enter Quantity",
          type: "error",
        })
      );
      return;
    }

    // restock existing product if selected
    if (selectedExistingProduct) {
      const oldQty = parseInt(selectedExistingProduct.qty || 0, 10) || 0;
      const addQty = parseInt(qty, 10) || 0;
      const newQty = oldQty + addQty;

      if (!productDate || !isValidDate(productDate)) {
        dispatch(
          showToast({
            message: "Please enter a valid date (YYYY-MM-DD)",
            type: "error",
          })
        );
        return;
      }

      try {
        await dispatch(
          updateProduct({
            productId: selectedExistingProduct._id,
            productData: {
              name: selectedExistingProduct.name,
              qty: newQty,
              cost_price: selectedExistingProduct.cost_price || 0,
              selling_price: selectedExistingProduct.selling_price || 0,
              cgst: selectedExistingProduct.cgst || 0,
              sgst: selectedExistingProduct.sgst || 0,
              minimum_stock: selectedExistingProduct.minimum_stock || 0,
              shop_id:
                selectedExistingProduct.shop_id?._id ||
                selectedExistingProduct.shop_id,
              category_id:
                selectedExistingProduct.category_id?._id ||
                selectedExistingProduct.category_id ||
                null,
              date: productDate || getCurrentDate(),
              note: selectedExistingProduct.note || "",
            },
          })
        ).unwrap();

        dispatch(
          showToast({
            message: `Quantity updated for "${selectedExistingProduct.name}"`,
            type: "success",
          })
        );
      } catch (err) {
        dispatch(
          showToast({
            message: err || "Failed to update product quantity",
            type: "error",
          })
        );
        return;
      }

      // reset form
      setSelectedExistingProduct(null);
      setName("");
      setQty("");
      setCostPrice("");
      setSellingPrice("");
      setCgst("");
      setSgst("");
      setMinimumStock("");
      setSelectedCategoryId("");
      setProductDate(getCurrentDate());
      setNote("");
      setIsNameFocused(false);
      Keyboard.dismiss();
      return;
    }

    // normal create new product
    if (!name || !selectedShopId) {
      dispatch(
        showToast({
          message:
            role === "staff"
              ? "Please enter product name"
              : "Please enter product name and select a shop",
          type: "error",
        })
      );
      return;
    }

    if (!costPrice || costPrice.trim() === "") {
      dispatch(
        showToast({
          message: "Please enter Cost Price",
          type: "error",
        })
      );
      return;
    }

    if (!sellingPrice || sellingPrice.trim() === "") {
      dispatch(
        showToast({
          message: "Please enter Selling Price",
          type: "error",
        })
      );
      return;
    }

    if (!productDate || !isValidDate(productDate)) {
      dispatch(
        showToast({
          message: "Please enter a valid date (YYYY-MM-DD)",
          type: "error",
        })
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
          category_id: selectedCategoryId || null,
          date: productDate || getCurrentDate(),
          note: note || "",
        })
      ).unwrap();

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
      setProductDate(getCurrentDate());
      setNote("");
      setNameSuggestions([]);
      setShowSuggestions(false);
      setSelectedExistingProduct(null);

      if (role === "staff" && staffShops.length > 0) {
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
    } finally {
      setIsAddingProduct(false);
    }
  };

  const isFormLocked = !!selectedExistingProduct;

  return (
    <TouchableWithoutFeedback
      onPress={() => {
        Keyboard.dismiss();
        setIsNameFocused(false);
        setShowSuggestions(false);
      }}
    >
      <ScrollView
        style={global.mainContainer}
        contentContainerStyle={{ paddingBottom: BAR_HEIGHT + 60 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Top navbar tab view */}
        <View
          style={{
            flexDirection: "row",
            marginTop: 10,
            marginBottom: 10,
          }}
        >
          <TouchableOpacity
            style={{
              flex: 1,
              borderBottomWidth: activeTab === 0 ? 3 : 0,
              borderBottomColor: activeTab === 0 ? primaryColor : "transparent",
              alignItems: "center",
              paddingBottom: 6,
            }}
            onPress={() => setActiveTab(0)}
          >
            <Text
              style={{
                color: activeTab === 0 ? primaryColor : "#666",
                fontWeight: activeTab === 0 ? "600" : "400",
              }}
            >
              Product Manager
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              flex: 1,
              borderBottomWidth: activeTab === 1 ? 3 : 0,
              borderBottomColor: activeTab === 1 ? primaryColor : "transparent",
              alignItems: "center",
              paddingBottom: 6,
            }}
            onPress={() => setActiveTab(1)}
          >
            <Text
              style={{
                color: activeTab === 1 ? primaryColor : "#666",
                fontWeight: activeTab === 1 ? "600" : "400",
              }}
            >
              QR Generator
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 0 && (
          <>
            {/* ADD PRODUCT */}
            <View style={{ marginTop: 10 }}>
              <Text style={{ marginBottom: 10 }}>Add Product</Text>
              <TextInput
                style={global.input}
                placeholder="Product Name *"
                value={name}
                editable={!isFormLocked}
                onChangeText={updateNameAndSuggestions}
                onFocus={() => {
                  setIsNameFocused(true);
                  if (
                    !isFormLocked &&
                    name &&
                    name.length >= 3 &&
                    nameSuggestions.length > 0
                  ) {
                    setShowSuggestions(true);
                  }
                }}
              />

              {/* Suggestions under product name */}
              {isNameFocused &&
                showSuggestions &&
                nameSuggestions.length > 0 && (
                  <View
                    style={{
                      borderWidth: 1,
                      borderColor: "#ddd",
                      borderRadius: 8,
                      paddingVertical: 6,
                      paddingHorizontal: 8,
                      marginTop: 4,
                      marginBottom: 8,
                      backgroundColor: "#fafafa",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        color: "#666",
                        marginBottom: 4,
                        fontWeight: "500",
                      }}
                    >
                      Similar products:
                    </Text>
                    {nameSuggestions.map((p) => (
                      <TouchableOpacity
                        key={p._id}
                        onPress={() => handlePickSuggestion(p)}
                        style={{
                          paddingVertical: 4,
                          borderRadius: 4,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 13,
                            color: primaryColor,
                          }}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {p.name}
                        </Text>
                        <Text
                          style={{
                            fontSize: 11,
                            color: "#666",
                          }}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {p.shop_id?.name
                            ? `Shop: ${p.shop_id.name}`
                            : p.shop_id
                            ? `Shop: ${p.shop_id}`
                            : "Shop: -"}
                          {p.category_id?.name
                            ? `  •  Cat: ${p.category_id.name}`
                            : ""}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

              {isNameFocused && (
                <>
                  {role !== "staff" && shops.length > 0 && (
                    <View style={{ ...global.input, padding: 0 }}>
                      <Picker
                        selectedValue={selectedShopId}
                        enabled={!isFormLocked}
                        onValueChange={(itemValue) => {
                          setSelectedShopId(itemValue);
                          setSelectedCategoryId("");
                        }}
                        style={{ fontSize: 12 }}
                        itemStyle={{ fontSize: 12 }}
                      >
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

                  {selectedShopId && (
                    <View>
                      {!showCreateCategory ? (
                        <View style={{ ...global.input, padding: 0 }}>
                          <Picker
                            selectedValue={selectedCategoryId}
                            enabled={!isFormLocked}
                            onValueChange={(itemValue) => {
                              if (itemValue === "create_new") {
                                setShowCreateCategory(true);
                                setSelectedCategoryId("");
                              } else {
                                setSelectedCategoryId(itemValue);
                              }
                            }}
                            style={{ fontSize: 12 }}
                            itemStyle={{ fontSize: 12 }}
                          >
                            <Picker.Item label="No Category" value="" />
                            {shopCategories.map((category) => (
                              <Picker.Item
                                key={category._id}
                                label={category.name}
                                value={category._id}
                              />
                            ))}
                            <Picker.Item
                              label="+ Create New Category"
                              value="create_new"
                            />
                          </Picker>
                        </View>
                      ) : (
                        !isFormLocked && (
                          <View>
                            <TextInput
                              style={global.input}
                              placeholder="New Category Name *"
                              value={newCategoryName}
                              onChangeText={setNewCategoryName}
                            />
                            <View
                              style={{
                                flexDirection: "row",
                                gap: 10,
                                marginBottom: 10,
                              }}
                            >
                              <TouchableOpacity
                                style={{
                                  ...global.button1,
                                  flex: 1,
                                  backgroundColor: "#666",
                                }}
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
                        )
                      )}
                    </View>
                  )}

                  <TextInput
                    style={global.input}
                    placeholder={
                      selectedExistingProduct
                        ? "Add Qty to existing *"
                        : "Quantity *"
                    }
                    value={qty}
                    onChangeText={setQty}
                    keyboardType="numeric"
                  />

                  <TextInput
                    style={global.input}
                    placeholder="Cost Price *"
                    value={costPrice}
                    onChangeText={setCostPrice}
                    keyboardType="decimal-pad"
                    editable={!isFormLocked}
                  />

                  <TextInput
                    style={global.input}
                    placeholder="Selling Price *"
                    value={sellingPrice}
                    onChangeText={setSellingPrice}
                    keyboardType="decimal-pad"
                    editable={!isFormLocked}
                  />

                  <TextInput
                    style={global.input}
                    placeholder="CGST (%)"
                    value={cgst}
                    onChangeText={setCgst}
                    keyboardType="decimal-pad"
                    editable={!isFormLocked}
                  />

                  <TextInput
                    style={global.input}
                    placeholder="SGST (%)"
                    value={sgst}
                    onChangeText={setSgst}
                    keyboardType="decimal-pad"
                    editable={!isFormLocked}
                  />

                  <TextInput
                    style={global.input}
                    placeholder="Minimum Stock"
                    value={minimumStock}
                    onChangeText={setMinimumStock}
                    keyboardType="numeric"
                    editable={!isFormLocked}
                  />

                  <TextInput
                    style={global.input}
                    placeholder="Date (YYYY-MM-DD) *"
                    value={productDate}
                    onChangeText={setProductDate}
                    editable={!isFormLocked}
                  />

                  <TextInput
                    style={global.input}
                    placeholder="Note"
                    value={note}
                    onChangeText={setNote}
                    multiline
                    editable={!isFormLocked}
                  />

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
                        ...global.button1,
                        width: "30%",
                        backgroundColor: "#666",
                      }}
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
                        setProductDate(getCurrentDate());
                        setNote("");
                        setShowCreateCategory(false);
                        setNewCategoryName("");
                        setNameSuggestions([]);
                        setShowSuggestions(false);
                        setSelectedExistingProduct(null);
                        Keyboard.dismiss();
                      }}
                    >
                      <Text style={global.btnText}>Close</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{
                        ...global.button1,
                        width: "30%",
                        opacity: isAddingProduct ? 0.6 : 1,
                      }}
                      onPress={handleAddProduct}
                      disabled={isAddingProduct}
                    >
                      {isAddingProduct ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={global.btnText}>
                          {selectedExistingProduct ? "Update Qty" : "Add"}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>

            {/* PRODUCT LIST HEADER */}
            <Text style={{ marginBottom: 5, marginTop: 20 }}>Product List</Text>

            {/* Row 1: Search */}
            <View
              style={{
                marginTop: 8,
                marginBottom: 4,
              }}
            >
              <TextInput
                style={{
                  ...global.input,
                  marginBottom: 0,
                  paddingVertical: 4,
                  height: 38,
                  fontSize: 12,
                }}
                placeholder="Search by name, category, note..."
                value={filterSearch}
                onChangeText={setFilterSearch}
              />
            </View>

            {/* Row 2: Shop + Category filters */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                marginBottom: 8,
              }}
            >
              {role !== "staff" && shops.length > 0 && (
                <View
                  style={{
                    ...global.input,
                    flex: 1,
                    paddingVertical: 0,
                    paddingHorizontal: 0,
                    marginBottom: 0,
                    height: 38,
                    justifyContent: "center",
                  }}
                >
                  <Picker
                    selectedValue={filterShopId}
                    onValueChange={(itemValue) => {
                      setFilterShopId(itemValue);
                      setFilterCategoryId("");
                    }}
                    style={{ fontSize: 10 }}
                    itemStyle={{ fontSize: 10 }}
                  >
                    <Picker.Item label="All Shops" value="" />
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

              <View
                style={{
                  ...global.input,
                  flex: 1,
                  paddingVertical: 0,
                  paddingHorizontal: 0,
                  marginBottom: 0,
                  height: 38,
                  justifyContent: "center",
                }}
              >
                <Picker
                  selectedValue={filterCategoryId}
                  onValueChange={(itemValue) => setFilterCategoryId(itemValue)}
                  style={{ fontSize: 10 }}
                  itemStyle={{ fontSize: 10 }}
                >
                  <Picker.Item label="All Categories" value="" />
                  {filterCategories.map((cat) => (
                    <Picker.Item
                      key={cat._id}
                      label={cat.name}
                      value={cat._id}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            {/* PRODUCT LIST grouped by category asc */}
            {(() => {
              let filteredProducts = products;

              if (filterShopId) {
                filteredProducts = filteredProducts.filter((p) => {
                  const sid = p.shop_id?._id || p.shop_id;
                  return sid === filterShopId;
                });
              }

              if (filterCategoryId) {
                filteredProducts = filteredProducts.filter((p) => {
                  const cid = p.category_id?._id || p.category_id;
                  return cid === filterCategoryId;
                });
              }

              if (filterSearch.trim()) {
                const q = filterSearch.trim().toLowerCase();
                filteredProducts = filteredProducts.filter((p) => {
                  const name = (p.name || "").toLowerCase();

                  let catName = "";
                  if (p.category_id) {
                    if (typeof p.category_id === "object") {
                      catName = (
                        p.category_id.name ||
                        p.category_id.label ||
                        ""
                      )
                        .toString()
                        .toLowerCase();
                    } else {
                      const cat = categories.find(
                        (c) => c._id === p.category_id
                      );
                      if (cat?.name) catName = cat.name.toLowerCase();
                    }
                  }

                  const noteText = (p.note || "").toLowerCase();

                  const combined = `${name} ${catName} ${noteText}`;
                  return combined.includes(q);
                });
              }

              const groupedByCategory = filteredProducts.reduce(
                (acc, product) => {
                  let catLabel = "No Category";
                  let catKey = "zzz_no_category";

                  if (product.category_id) {
                    if (typeof product.category_id === "object") {
                      const nm =
                        product.category_id.name || product.category_id.label;
                      if (nm) {
                        catLabel = nm;
                        catKey = nm.toLowerCase();
                      }
                    } else {
                      const cat = categories.find(
                        (c) => c._id === product.category_id
                      );
                      if (cat?.name) {
                        catLabel = cat.name;
                        catKey = cat.name.toLowerCase();
                      }
                    }
                  }

                  if (!acc[catKey]) {
                    acc[catKey] = {
                      label: catLabel,
                      items: [],
                    };
                  }
                  acc[catKey].items.push(product);
                  return acc;
                },
                {}
              );

              const sortedCatKeys = Object.keys(groupedByCategory).sort(
                (a, b) =>
                  groupedByCategory[a].label
                    .toLowerCase()
                    .localeCompare(groupedByCategory[b].label.toLowerCase())
              );

              if (sortedCatKeys.length === 0) {
                return (
                  <Text
                    style={{
                      textAlign: "center",
                      color: "#999",
                      marginTop: 20,
                    }}
                  >
                    No products found
                  </Text>
                );
              }

              return sortedCatKeys.map((key) => {
                const group = groupedByCategory[key];
                const items = [...group.items].sort((a, b) =>
                  (a.name || "")
                    .toLowerCase()
                    .localeCompare((b.name || "").toLowerCase())
                );

                // Default to collapsed if not yet toggled
                const isCollapsed = collapsedCategories[key] !== false;

                return (
                  <View
                    key={key}
                    style={{
                      ...global.profileContainer,
                      fontSize: 16,
                      marginTop: 15,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 10,
                        paddingBottom: 5,
                        borderBottomWidth: 1,
                        borderBottomColor: "#ddd",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "bold",
                          color: primaryColor,
                        }}
                      >
                        {group.label}
                      </Text>
                      <TouchableOpacity
                        onPress={() =>
                          setCollapsedCategories((prev) => ({
                            ...prev,
                            [key]: !isCollapsed,
                          }))
                        }
                        style={{ paddingHorizontal: 6, paddingVertical: 4 }}
                      >
                        <MaterialIcons
                          name={isCollapsed ? "keyboard-arrow-down" : "keyboard-arrow-up"}
                          size={22}
                          color={primaryColor}
                        />
                      </TouchableOpacity>
                    </View>
                    {!isCollapsed &&
                      items.map((product, index) => (
                        <ProductContainer
                          key={product._id}
                          product={product}
                          index={index}
                          data={items}
                        />
                      ))}
                  </View>
                );
              });
            })()}
          </>
        )}

        {activeTab === 1 && (
          <View style={{ marginTop: 30, alignItems: "center" }}>
            <Text style={{ color: "#666", marginBottom: 10 }}>
              QR Generator
            </Text>
            <Text style={{ color: "#999", fontSize: 12 }}>
              (Coming soon – design your QR-based product workflow here)
            </Text>
          </View>
        )}
      </ScrollView>
    </TouchableWithoutFeedback>
  );
};

export default ProductScreen;
