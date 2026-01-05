import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Keyboard,
  ActivityIndicator,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useDispatch, useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import { global, useThemeColors, useThemedStyles } from "../../styles/global";
import {
  fetchProducts,
  createProduct,
  deleteProduct,
  updateProduct,
  incrementProductQty,
  decrementProductQty,
} from "../../store/slices/productSlice";
import {
  fetchCategories,
  createCategory,
} from "../../store/slices/categorySlice";
import { showToast } from "../../store/slices/toastSlice";
import Entypo from "@expo/vector-icons/Entypo";

export default function ProductsTab({
  displayLimit,
  isLoadingMore,
  onLoadMore,
}) {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const {
    primaryColor,
    textSecondary,
    cardBg,
    borderColor,
    textColor,
    isDarkMode,
  } = useThemeColors();
  const themedStyles = useThemedStyles();

  const { products, status } = useSelector((state) => state.products);
  const { categories } = useSelector((state) => state.categories);
  const { customers } = useSelector((state) => state.customers);
  const { shops } = useSelector((state) => state.shops);
  const { userid, role, user } = useSelector((state) => state.auth);

  const staffShops = user?.shops || [];
  const isStaffSingleShop = role === "staff" && shops.length === 1; // staff with exactly one shop

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

  const [filterSearch, setFilterSearch] = useState("");
  const [filterShopId, setFilterShopId] = useState("");
  const [filterCategoryId, setFilterCategoryId] = useState("");

  const [nameSuggestions, setNameSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedExistingProduct, setSelectedExistingProduct] = useState(null);

  useEffect(() => {
    // ensure defaults for shop selection
    if (role === "staff" && staffShops.length > 0) {
      const staffShopId = staffShops[0]?._id || staffShops[0];
      setSelectedShopId(staffShopId);
      setFilterShopId(staffShopId);
    } else if (shops.length > 0) {
      setSelectedShopId(shops[0]._id);
      setFilterShopId("");
    }
  }, [role, shops, staffShops]);

  // optional: ensure products/categories are loaded (safe even if already loaded)
  useEffect(() => {
    if (!products?.length) dispatch(fetchProducts());
    if (!categories?.length) dispatch(fetchCategories());
  }, [dispatch]);

  const shopCategories = categories.filter(
    (cat) =>
      cat.shop_id === selectedShopId || cat.shop_id?._id === selectedShopId
  );

  const filterCategories = categories.filter((cat) => {
    const sid = cat.shop_id?._id || cat.shop_id;
    if (!filterShopId) return true;
    return sid === filterShopId;
  });

  const handleCreateCategory = async () => {
    if (!newCategoryName || !selectedShopId) {
      dispatch(
        showToast({ message: "Please enter category name", type: "error" })
      );
      return;
    }
    try {
      const result = await dispatch(
        createCategory({ name: newCategoryName, shop_id: selectedShopId })
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
      if (newCategory) setSelectedCategoryId(newCategory._id);
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
      await dispatch(deleteProduct(productId)).unwrap();
      dispatch(showToast({ message: "Product deleted!", type: "success" }));
    } catch (error) {
      dispatch(
        showToast({
          message: error || "Failed to delete product",
          type: "error",
        })
      );
    }
  };

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
    setSelectedExistingProduct(null);
  };

  const handlePickSuggestion = (product) => {
    setSelectedExistingProduct(product);
    setName(product.name || "");
    const prodShopId = product.shop_id?._id || product.shop_id;
    if (role !== "staff" && prodShopId) setSelectedShopId(prodShopId);
    const catId = product.category_id?._id || product.category_id;
    if (catId) setSelectedCategoryId(catId);
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
    setQty("");
    setShowCreateCategory(false);
    setShowSuggestions(false);
    setNameSuggestions([]);
  };

  const handleAddProduct = async () => {
    if (!qty || qty.trim() === "") {
      dispatch(showToast({ message: "Please enter Quantity", type: "error" }));
      return;
    }
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
        showToast({ message: "Please enter Cost Price", type: "error" })
      );
      return;
    }
    if (!sellingPrice || sellingPrice.trim() === "") {
      dispatch(
        showToast({ message: "Please enter Selling Price", type: "error" })
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
          qty: parseInt(qty, 10) || 0,
          cost_price: parseFloat(costPrice) || 0,
          selling_price: parseFloat(sellingPrice) || 0,
          cgst: parseFloat(cgst) || 0,
          sgst: parseFloat(sgst) || 0,
          minimum_stock: parseInt(minimumStock, 10) || 0,
          shop_id: selectedShopId,
          category_id: selectedCategoryId || null,
          date: productDate || getCurrentDate(),
          note: note || "",
        })
      ).unwrap();
      dispatch(
        showToast({ message: "Product created successfully!", type: "success" })
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
        showToast({ message: err || "Failed to create product", type: "error" })
      );
    } finally {
      setIsAddingProduct(false);
    }
  };

  const isFormLocked = !!selectedExistingProduct;

  const ProductContainer = ({ product, index, data }) => {
    const navigation = useNavigation();
    const [, setIsUpdatingProduct] = useState(false);
    const [quickAdjustLoading, setQuickAdjustLoading] = useState(null); // 'add' | 'sub' | null
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
    const productShopId = product.shop_id?._id || product.shop_id;
    const productShopCategories = categories.filter(
      (cat) =>
        cat.shop_id === productShopId || cat.shop_id?._id === productShopId
    );

    const handleQuickAdjust = async (type) => {
      const delta = 1;
      const oldQty = parseInt(productQty, 10) || 0;
      let newQty = oldQty;
      setQuickAdjustLoading(type);
      try {
        if (type === "add") {
          newQty = oldQty + delta;
          setProductQty(newQty.toString());
          await dispatch(
            incrementProductQty({ productId: product._id, amount: delta })
          ).unwrap();
          dispatch(
            showToast({
              message: `Added 1 to "${productName}"`,
              type: "success",
            })
          );
        } else {
          newQty = Math.max(0, oldQty - delta);
          setProductQty(newQty.toString());
          await dispatch(
            decrementProductQty({ productId: product._id, amount: delta })
          ).unwrap();
          dispatch(
            showToast({
              message: `Subtracted 1 from "${productName}"`,
              type: "success",
            })
          );
        }
      } catch (err) {
        dispatch(
          showToast({
            message: err || "Failed to update quantity",
            type: "error",
          })
        );
        setProductQty(oldQty.toString());
      } finally {
        setQuickAdjustLoading(null);
      }
    };

    const shopName = product.shop_id?.name || "N/A";
    const categoryName =
      product.category_id?.name || product.category_id?.label || "N/A";

    return (
      <View
        key={product._id}
        style={{
          paddingVertical: 6,
          paddingHorizontal: 8,
          flexDirection: "column",
          backgroundColor: cardBg,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: borderColor,
          marginBottom: 10,
        }}
      >
        <TouchableOpacity
          onPress={() => navigation.navigate("ProductDetail", { product })}
          style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <View style={{ flexDirection: "row", gap: 10, flex: 1 }}>
              <View style={{ flexDirection: "column", gap: 5, flex: 1 }}>
                <Text style={{ color: primaryColor, fontSize: 16 }}>
                  {product.name}
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    gap: 20,
                    flexWrap: "wrap",
                    margin: 0,
                  }}
                >
                  <Text
                    style={{
                      color: textSecondary,
                      fontSize: 12,
                      maxWidth: 60,
                      flexShrink: 1,
                    }}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    Qty:{" "}
                    <Text style={{ color: textColor }}>
                      {productQty || "0"}
                    </Text>
                  </Text>
                  <Text
                    style={{
                      color: textSecondary,
                      fontSize: 12,
                      flexShrink: 1,
                    }}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    CP/SP:{" "}
                    <Text style={{ color: textColor }}>
                      ₹{productCostPrice || "0"} / ₹{productSellingPrice || "0"}
                    </Text>
                  </Text>
                  <Text
                    style={{
                      color: textSecondary,
                      fontSize: 12,
                      flexShrink: 1,
                    }}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    Note:{" "}
                    <Text style={{ color: primaryColor }}>
                      {productNote && productNote.length > 5
                        ? `${productNote.slice(0, 5)}...`
                        : productNote || "—"}
                    </Text>
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginTop: 8,
            marginBottom: 4,
            gap: 10,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              gap: 10,
              alignItems: "center",
              flex: 1,
            }}
          >
            <TouchableOpacity
              style={{
                ...themedStyles.selectedDateItem,
                borderWidth: 1,
                borderRadius: 50,
                paddingVertical: 4,
                paddingHorizontal: 10,
              }}
              onPress={() => {}}
            >
              <Text style={themedStyles.text}>{shopName}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                ...themedStyles.selectedDateItem,
                borderWidth: 1,
                borderRadius: 50,
                paddingVertical: 4,
                paddingHorizontal: 10,
              }}
              onPress={() => {}}
            >
              {categoryName !== "N/A" && (
                <Text style={themedStyles.text}>{categoryName}</Text>
              )}
            </TouchableOpacity>
          </View>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <TouchableOpacity
              onPress={() => handleQuickAdjust("add")}
              style={{
                paddingVertical: 4,
                paddingHorizontal: 10,
                borderRadius: 6,
                borderWidth: 1,
                borderColor: primaryColor,
                backgroundColor: primaryColor + "20",
                minWidth: 40,
                alignItems: "center",
                justifyContent: "center",
                opacity: quickAdjustLoading === "add" ? 0.7 : 1,
              }}
              disabled={quickAdjustLoading === "add"}
            >
              {quickAdjustLoading === "add" ? (
                <ActivityIndicator size="small" color={primaryColor} />
              ) : (
                <Text style={{ fontSize: 12, color: primaryColor }}>+ 1</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleQuickAdjust("sub")}
              style={{
                paddingVertical: 4,
                paddingHorizontal: 10,
                borderRadius: 6,
                borderWidth: 1,
                borderColor: "#ba181b",
                backgroundColor: "#ba181b33",
                minWidth: 40,
                alignItems: "center",
                justifyContent: "center",
                opacity: quickAdjustLoading === "sub" ? 0.7 : 1,
              }}
              disabled={quickAdjustLoading === "sub"}
            >
              {quickAdjustLoading === "sub" ? (
                <ActivityIndicator size="small" color="#ba181b" />
              ) : (
                <Text style={{ fontSize: 12, color: "#ba181b" }}>- 1</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View>
      {status === "loading" && (
        <View
          style={{
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: 30,
          }}
        >
          <ActivityIndicator size="large" color={primaryColor} />
          <Text style={{ marginTop: 10, color: textSecondary }}>
            Loading products...
          </Text>
        </View>
      )}

      {status !== "loading" && (
        <>
          <View style={{ marginTop: 8, marginBottom: 4, flexDirection: "row", gap: 5 }}>
            <TextInput
              style={{
                ...themedStyles.input,
                marginBottom: 0,
                paddingVertical: 4,
                height: 38,
                fontSize: 12,
                flex: 3,
              }}
              placeholder="Search by name, category, note..."
              placeholderTextColor={textSecondary}
              value={filterSearch}
              onChangeText={setFilterSearch}
            />
            <TouchableOpacity
              style={{
                padding: 5,
                borderRadius: 6,
                justifyContent: "center",
                backgroundColor: primaryColor,
                flex: 1,
              }}
              onPress={() => navigation.navigate("AddProductScreen")}
            >
              <Text style={{...global.btnText1, fontSize: 14, textAlign: "center" }}>
                <Entypo name="plus" size={16} color="white" /> Add
              </Text>
            </TouchableOpacity>
          </View>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              marginBottom: 8,
              marginTop: 4,
            }}
          >
            {!isStaffSingleShop && shops.length > 0 && (
              <View
                style={{
                  ...themedStyles.input,
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
                  style={{ fontSize: 10, color: textColor }}
                  itemStyle={{ fontSize: 10, color: textColor }}
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
                ...themedStyles.input,
                flex: 1,
                width: isStaffSingleShop ? "100%" : undefined,
                paddingVertical: 0,
                paddingHorizontal: 0,
                marginBottom: 0,
                height: 38,
                justifyContent: "center",
                alignSelf: isStaffSingleShop ? "stretch" : undefined,
              }}
            >
              <Picker
                selectedValue={filterCategoryId}
                onValueChange={(itemValue) => setFilterCategoryId(itemValue)}
                style={{ fontSize: 10, color: textColor }}
                itemStyle={{ fontSize: 10, color: textColor }}
              >
                <Picker.Item label="All Categories" value="" />
                {filterCategories.map((cat) => (
                  <Picker.Item key={cat._id} label={cat.name} value={cat._id} />
                ))}
              </Picker>
            </View>
          </View>
          <Text style={[themedStyles.text, { marginVertical: 5, fontSize: 14 }]}>Product List</Text>

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
                    catName = (p.category_id.name || p.category_id.label || "")
                      .toString()
                      .toLowerCase();
                  } else {
                    const cat = categories.find((c) => c._id === p.category_id);
                    if (cat?.name) catName = cat.name.toLowerCase();
                  }
                }
                const noteText = (p.note || "").toLowerCase();
                const combined = `${name} ${catName} ${noteText}`;
                return combined.includes(q);
              });
            }
            const sortedProducts = [...filteredProducts].sort((a, b) => {
              const dateA = a.date ? new Date(a.date).getTime() : 0;
              const dateB = b.date ? new Date(b.date).getTime() : 0;
              return dateB - dateA;
            });
            if (sortedProducts.length === 0) {
              return (
                <Text
                  style={{
                    textAlign: "center",
                    color: textSecondary,
                    marginTop: 20,
                  }}
                >
                  No products found
                </Text>
              );
            }
            const paginatedProducts = sortedProducts.slice(0, displayLimit);
            const hasMore = sortedProducts.length > displayLimit;
            return (
              <>
                <View style={{ marginTop: 15 }}>
                  {paginatedProducts.map((product, index) => (
                    <ProductContainer
                      key={product._id}
                      product={product}
                      index={index}
                      data={paginatedProducts}
                    />
                  ))}
                </View>

                {hasMore && isLoadingMore && (
                  <View style={{ alignItems: "center", paddingVertical: 20 }}>
                    <ActivityIndicator size="small" color={primaryColor} />
                    <Text
                      style={{
                        marginTop: 8,
                        color: textSecondary,
                        fontSize: 12,
                      }}
                    >
                      Loading more products...
                    </Text>
                  </View>
                )}

                {hasMore && !isLoadingMore && (
                  <View
                    style={{
                      alignItems: "center",
                      paddingVertical: 15,
                      gap: 8,
                    }}
                  >
                    <Text
                      style={{
                        textAlign: "center",
                        color: textSecondary,
                        fontSize: 12,
                      }}
                    >
                      Showing {paginatedProducts.length} of{" "}
                      {sortedProducts.length} products • Scroll for more
                    </Text>
                    <TouchableOpacity
                      onPress={onLoadMore}
                      style={{
                        ...themedStyles.button1,
                        paddingVertical: 8,
                        minWidth: 140,
                        alignItems: "center",
                      }}
                    >
                      <Text style={global.btnText}>Load more</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {!hasMore && sortedProducts.length > 10 && (
                  <Text
                    style={{
                      textAlign: "center",
                      color: textSecondary,
                      fontSize: 12,
                      paddingVertical: 15,
                    }}
                  >
                    All {sortedProducts.length} products loaded
                  </Text>
                )}
              </>
            );
          })()}
        </>
      )}
    </View>
  );
}
