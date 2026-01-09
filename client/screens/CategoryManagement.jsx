import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
} from "react-native";
import { Picker } from '@react-native-picker/picker';
import { global, useThemeColors } from "../styles/global";
import { useDispatch, useSelector } from "react-redux";
import { fetchCategories, createCategory, deleteCategory, updateCategory } from "../store/slices/categorySlice";
import { AntDesign, MaterialIcons } from "@expo/vector-icons";
import { showToast } from "../store/slices/toastSlice";

const CategoryManagement = () => {
  const dispatch = useDispatch();

  const { categories, status, error } = useSelector((state) => state.categories);
  const { shops } = useSelector((state) => state.shops);
  const { role } = useSelector((state) => state.auth);
  const { primaryColor } = useThemeColors();
  const isStaff = role === "staff";

  const [name, setName] = useState("");
  const [selectedShopId, setSelectedShopId] = useState("");
  const [isNameFocused, setIsNameFocused] = useState(false);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        await dispatch(fetchCategories()).unwrap();
      } catch (error) {
        console.error('Error loading categories data:', error);
        dispatch(
          showToast({
            message: error || "Failed to load categories",
            type: "error",
          })
        );
      }
    };
    loadCategories();

    // Set initial selected shop if shops are available
    if (shops.length > 0) {
      setSelectedShopId(shops[0]._id);
    }
  }, [dispatch, shops]);

  const handleDeleteCategory = async (categoryId) => {
    try {
      Alert.alert("Delete Category", "Do you want to delete this category?", [
        { text: "Cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await dispatch(deleteCategory(categoryId)).unwrap();
            dispatch(
              showToast({
                message: "Category deleted!",
                type: "success",
              })
            );
          },
        },
      ]);
    } catch (error) {
      dispatch(
        showToast({
          message: error || "Failed to delete category",
          type: "error",
        })
      );
      console.error("Category deletion error:", error);
    }
  };

  const CategoryContainer = ({ category, isStaff }) => {
    const [showDetails, setShowDetails] = useState(false);
    const [categoryName, setCategoryName] = useState(category.name || "");

    const handleUpdateCategory = async () => {
      if (categoryName === (category.name || "")) {
        dispatch(showToast({
          message: "No changes made to category details",
          type: "info",
        }));
        setShowDetails(false);
        return;
      }
      try {
        await dispatch(updateCategory({
          categoryId: category._id,
          categoryData: {
            name: categoryName,
          },
        })).unwrap();
        dispatch(showToast({
          message: `Category "${categoryName}" updated successfully!`,
          type: "success",
        }));
        setShowDetails(false);
      } catch (error) {
        const errorMessage = error.message || error.msg || "Failed to update category";
        dispatch(showToast({
          message: errorMessage,
          type: "error",
        }));
        console.error("Category update error:", error);
      }
    };

    return (
      <View
        key={category._id}
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
                {category.name}
              </Text>
            </TouchableOpacity>
          </View>
          {!isStaff && (
            <View style={{ marginLeft: "auto" }}>
              <TouchableOpacity onPress={() => handleDeleteCategory(category._id)}>
                <MaterialIcons name="delete" size={24} color="#ba181b" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {showDetails && (
          <View style={{ marginTop: 10, width: "100%" }}>
            <TextInput
              style={global.input}
              placeholder="Category Name *"
              value={categoryName}
              onChangeText={setCategoryName}
              editable={true}
            />

            {!isStaff && (
              <View>
                <TouchableOpacity
                  style={{ marginTop: 10, ...global.button1 }}
                  onPress={handleUpdateCategory}
                >
                  <Text style={global.btnText1}>Save {categoryName}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  const handleAddCategory = async () => {
    if (!name || !selectedShopId) {
      dispatch(
        showToast({
          message: "Please enter category name and select a shop",
          type: "error",
        })
      );
      return;
    }

    try {
      await dispatch(createCategory({
        name,
        shop_id: selectedShopId,
      })).unwrap();

      dispatch(
        showToast({
          message: "Category created successfully!",
          type: "success",
        })
      );
      setName("");
      setSelectedShopId(shops.length > 0 ? shops[0]._id : "");
      setIsNameFocused(false);
      Keyboard.dismiss();
    } catch (err) {
      dispatch(
        showToast({
          message: err || "Failed to create category",
          type: "error",
        })
      );
    }
  };

  return (
    <TouchableWithoutFeedback onPress={() => { Keyboard.dismiss(); setIsNameFocused(false); }}>
      <View style={global.mainContainer}>
        <View style={{ marginTop: 10 }}>
          <Text style={{ marginBottom: 10 }}>Add Category</Text>
            <TextInput
              style={global.input}
              placeholder="Category Name *"
              value={name}
              onChangeText={setName}
              onFocus={() => setIsNameFocused(true)}
            />

          {isNameFocused && (
            <>
              {shops.length > 0 && (
                <View style={{ ...global.input, padding: 0 }}>
                  <Picker
                    selectedValue={selectedShopId}
                    onValueChange={(itemValue) => setSelectedShopId(itemValue)}
                    enabled={!isStaff}
                  >
                    {shops.map((shop) => (
                      <Picker.Item key={shop._id} label={shop.name} value={shop._id} />
                    ))}
                  </Picker>
                </View>
              )}

              <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
                <TouchableOpacity
                  style={{ ...global.button1, width: "30%", backgroundColor: "#666" }}
                  onPress={() => {
                    setIsNameFocused(false);
                    setName("");
                    Keyboard.dismiss();
                  }}
                >
                  <Text style={global.btnText}>Close</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ ...global.button1, width: "30%" }}
                  onPress={handleAddCategory}
                >
                  <Text style={global.btnText}>Add</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
        <Text style={{ marginBottom: 5, marginTop: isStaff ? 10 : 20 }}>Category List</Text>
        {categories.map((category) => (
          <CategoryContainer key={category._id} category={category} isStaff={isStaff} />
        ))}
      </View>
    </TouchableWithoutFeedback>
  );
};

export default CategoryManagement;

