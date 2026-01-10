import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { global, useThemeColors } from "../styles/global";
import { useDispatch, useSelector } from "react-redux";
import { MaterialIcons, AntDesign } from "@expo/vector-icons";
import { showToast } from "../store/slices/toastSlice";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { fetchProducts } from "../store/slices/productSlice";
import { fetchShops } from "../store/slices/shopsSlice";
import { fetchCategories } from "../store/slices/categorySlice";
import api from "../store/api/axiosClient";

const ImportExportScreen = () => {
  const dispatch = useDispatch();
  const { primaryColor } = useThemeColors();
  const { token } = useSelector((state) => state.auth);
  const { shops = [] } = useSelector((state) => state.shops);
  const { categories = [] } = useSelector((state) => state.categories);
  const { products = [] } = useSelector((state) => state.products);
  
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [activeTab, setActiveTab] = useState("import"); // "import" or "export"
  const [importProgress, setImportProgress] = useState(0);
  const [importMessage, setImportMessage] = useState("");
  const [isImporting, setIsImporting] = useState(false); // Local loading for import only

  // Parse CSV content
  const parseCSV = (csvText) => {
    const lines = csvText.split("\n").filter((line) => line.trim());
    if (lines.length === 0) return [];

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim());
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || "";
      });
      rows.push(row);
    }

    return rows;
  };

  // Handle file selection
  const handleSelectFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["text/csv", "text/comma-separated-values", "application/vnd.ms-excel"],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const file = result.assets[0];
      setSelectedFile(file);

      // Read file content
      const fileContent = await FileSystem.readAsStringAsync(file.uri);
      
      // Parse CSV
      const parsedData = parseCSV(fileContent);
      setPreviewData(parsedData.slice(0, 5)); // Show first 5 rows

      dispatch(
        showToast({
          message: `✅ File loaded: ${parsedData.length} products found`,
          type: "success",
        })
      );
    } catch (err) {
      console.error("File selection error:", err);
      dispatch(
        showToast({
          message: "Failed to read file",
          type: "error",
        })
      );
    }
  };

  // Process and import products
  const handleImport = async () => {
    if (!selectedFile) {
      dispatch(
        showToast({
          message: "Please select a CSV file first",
          type: "error",
        })
      );
      return;
    }

    Alert.alert(
      "Confirm Import",
      `Import ${previewData.length}+ products from ${selectedFile.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Import",
          style: "default",
          onPress: async () => {
            try {
              setIsImporting(true);
              // Read full file content
              const fileContent = await FileSystem.readAsStringAsync(selectedFile.uri);
              const allRows = parseCSV(fileContent);

              // Validate mandatory fields
              const errors = [];
              const validRows = [];
              const categoriesToCreate = new Map(); // Track categories to create in this batch
              const existingCategoryMap = new Map(); // Map of category name to ID

              // Build map of existing categories for quick lookup
              categories.forEach(cat => {
                existingCategoryMap.set(cat.name.toLowerCase(), cat._id);
              });

              for (let i = 0; i < allRows.length; i++) {
                const row = allRows[i];
                const rowNum = i + 2; // +2 because of header and 0-index

                // Validate mandatory fields
                if (!row.shop || !row.name || !row.qty || !row.category) {
                  errors.push(`Row ${rowNum}: Missing mandatory fields (shop, name, category, qty)`);
                  continue;
                }

                // Find shop by name (mandatory - must match existing)
                const shop = shops.find(
                  (s) => s.name.toLowerCase() === row.shop.toLowerCase()
                );
                if (!shop) {
                  errors.push(`Row ${rowNum}: Shop "${row.shop}" not found`);
                  continue;
                }

                // Find or prepare category (if provided)
                let category_id = null;
                
                if (row.category && row.category.trim()) {
                  const trimmedCategory = row.category.trim();
                  const categoryLower = trimmedCategory.toLowerCase();
                  
                  // Check existing categories first
                  if (existingCategoryMap.has(categoryLower)) {
                    category_id = existingCategoryMap.get(categoryLower);
                  } else if (categoriesToCreate.has(categoryLower)) {
                    // Use the temp ID from the batch
                    category_id = categoriesToCreate.get(categoryLower);
                  } else {
                    // Will be created on server - use a temp ID for batch tracking
                    const tempId = `temp_${categoriesToCreate.size}`;
                    categoriesToCreate.set(categoryLower, tempId);
                    category_id = tempId;
                  }
                }

                // Build product object
                const product = {
                  shop_id: shop._id,
                  user_id: row.user_id || null, // Optional
                  category_id: category_id,
                  customer_id: null, // Always null as per requirement
                  name: row.name.trim(),
                  qty: parseInt(row.qty) || 0,
                  cost_price: parseInt(row.cost_price) || 0,
                  selling_price: parseInt(row.selling_price) || 0,
                  cgst: parseInt(row.cgst) || 0,
                  sgst: parseInt(row.sgst) || 0,
                  minimum_stock: parseInt(row.minimum_stock) || 0,
                  date: row.date || new Date().toISOString(),
                  note: row.note || "",
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                };

                validRows.push(product);
              }

              if (errors.length > 0) {
                setIsImporting(false);
                Alert.alert(
                  "Validation Errors",
                  `${errors.length} errors found:\n\n${errors.slice(0, 5).join("\n")}${
                    errors.length > 5 ? `\n\n...and ${errors.length - 5} more` : ""
                  }`,
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: `Import ${validRows.length} Valid`,
                      onPress: () => processImport(validRows, Array.from(categoriesToCreate.entries())),
                    },
                  ]
                );
              } else {
                await processImport(validRows, Array.from(categoriesToCreate.entries()));
              }
            } catch (err) {
              console.error("❌ Import preparation error:", err);
              console.error("❌ Error details:", {
                message: err.message,
                code: err.code,
                response: err.response?.data
              });
              
              setIsImporting(false);
              
              dispatch(
                showToast({
                  message: `Preparation failed: ${err.message || 'Unknown error'}`,
                  type: "error",
                })
              );
            }
          },
        },
      ]
    );
  };

  // Send products to API with chunking for large batches
  const processImport = async (productsToImport, categoriesToCreate = []) => {
    try {
      setIsImporting(true);
      setImportProgress(0);
      setImportMessage("Preparing upload...");
      
      // Step 1: Create new categories upfront (10%)
      setImportProgress(0.1);
      setImportMessage("Creating new categories...");
      
      const newCategoryMap = new Map();
      if (categoriesToCreate.length > 0) {
        // Extract unique category names
        for (const [categoryLower, tempId] of categoriesToCreate) {
          const categoryName = Array.from(categoriesToCreate.entries()).find(
            ([k, v]) => v === tempId
          )?.[0];
          if (categoryName) {
            newCategoryMap.set(tempId, categoryName);
          }
        }

        // Create categories via API if any need creation
        const categoriesToCreateArray = Array.from(new Map(
          categoriesToCreate.map(([name, tempId]) => [name, name])
        ).entries()).map(([name]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1) }));
        
        if (categoriesToCreateArray.length > 0) {
          try {
            // Create categories one by one to avoid duplicates
            for (const category of categoriesToCreateArray) {
              await api.post("/categories", {
                name: category.name,
                shop_id: productsToImport[0]?.shop_id || null,
              }).catch(err => {
                console.warn(`Category "${category.name}" creation skipped:`, err.message);
              });
            }
          } catch (catErr) {
            console.warn("Category creation had issues, continuing with import...", catErr);
          }
        }
      }

      // Step 2: Validate and prepare (15%)
      setImportProgress(0.15);
      setImportMessage("Validating products...");
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Step 3: Upload to API with chunking (20-80%)
      setImportProgress(0.2);
      const totalProducts = productsToImport.length;
      const chunkSize = 50; // Process 50 products per request
      const totalChunks = Math.ceil(totalProducts / chunkSize);
      
      let totalImported = 0;
      let totalSkipped = 0;
      let totalErrors = [];

      setImportMessage(`Uploading ${totalProducts} products in ${totalChunks} batches...`);

      // Process products in chunks
      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const start = chunkIndex * chunkSize;
        const end = Math.min(start + chunkSize, totalProducts);
        const chunk = productsToImport.slice(start, end);
        
        const progressStart = 0.2 + (chunkIndex / totalChunks) * 0.6;
        const progressEnd = 0.2 + ((chunkIndex + 1) / totalChunks) * 0.6;
        
        setImportProgress(progressStart);
        setImportMessage(`Uploading batch ${chunkIndex + 1}/${totalChunks}...`);

        try {
          const response = await api.post("/products/bulk-import", {
            products: chunk,
          }, {
            timeout: 60000, // 60 second timeout per chunk
          });

          const result = response.data;
          totalImported += result.imported || 0;
          totalSkipped += result.skipped || 0;
          if (result.errors && result.errors.length > 0) {
            totalErrors = totalErrors.concat(result.errors);
          }

          setImportProgress(progressEnd);
        } catch (chunkErr) {
          console.error(`❌ Chunk ${chunkIndex + 1} failed:`, chunkErr);
          throw new Error(`Batch ${chunkIndex + 1}/${totalChunks} failed: ${chunkErr.message}`);
        }
      }

      // Step 4: Refresh data (85%)
      setImportProgress(0.85);
      setImportMessage("Refreshing product list...");

      await dispatch(fetchProducts()).unwrap();

      // Step 5: Complete (100%)
      setImportProgress(1.0);
      setImportMessage("Import complete!");

      // Build success message with details
      let successMessage = `✅ Imported ${totalImported} products`;
      const warnings = [];
      
      if (totalSkipped > 0) {
        warnings.push(`${totalSkipped} skipped (duplicates)`);
      }
      if (totalErrors.length > 0) {
        warnings.push(`${totalErrors.length} errors`);
      }
      
      if (warnings.length > 0) {
        successMessage += ` (${warnings.join(', ')})`;
      }

      dispatch(
        showToast({
          message: successMessage,
          type: warnings.length > 0 ? "warning" : "success",
        })
      );

      // Reset state after delay
      setTimeout(() => {
        setSelectedFile(null);
        setPreviewData([]);
        setImportProgress(0);
        setImportMessage("");
        setIsImporting(false);
      }, 2000);
    } catch (err) {
      console.error("❌ Import API error:", err);
      
      let errorMessage = "Import failed";
      
      // Better error reporting
      if (err.response?.status === 401) {
        errorMessage = "Unauthorized - Please login again";
      } else if (err.response?.status === 403) {
        errorMessage = "Access denied - Check shop permissions";
      } else if (err.response?.status === 400) {
        errorMessage = `Validation error: ${err.response.data?.msg || "Invalid data"}`;
      } else if (err.response?.status === 413) {
        errorMessage = "Payload too large - Try importing fewer products at once";
      } else if (err.response?.status === 504) {
        errorMessage = "Server timeout - Try importing fewer products at once";
      } else if (err.code === 'ECONNABORTED') {
        errorMessage = "Request timeout (>60s) - Try importing fewer products or check server";
      } else if (err.code === 'ERR_NETWORK') {
        errorMessage = "Network error - Check server address and connection";
      } else if (err.code === 'ENOTFOUND') {
        errorMessage = "Server not found - Check if mobileshopmanager.onrender.com is accessible";
      } else if (err.message === 'Network Error' || err.message.includes('Network')) {
        errorMessage = "Network error - Server may be offline or unreachable";
      } else if (err.message.includes('Batch')) {
        errorMessage = err.message; // Show specific batch error
      }
      
      setImportProgress(0);
      setImportMessage("Import failed!");
      
      dispatch(
        showToast({
          message: errorMessage,
          type: "error",
        })
      );
      
      setIsImporting(false);
    } finally {
      // Ensure loading is always stopped
      if (isImporting) {
        setTimeout(() => setIsImporting(false), 100);
      }
    }
  };

  // Export products to CSV
  const handleExportProducts = async () => {
    setIsImporting(true);
    try {
      // Fetch latest products
      await dispatch(fetchProducts()).unwrap();
      
      if (products.length === 0) {
        dispatch(
          showToast({
            message: "No products to export",
            type: "error",
          })
        );
        setIsImporting(false);
        return;
      }

      // Create CSV header
      const csvHeader = "shop,name,barcode,category,qty,cost_price,selling_price,cgst,sgst,minimum_stock,note,date\n";
      
      // Create CSV rows
      const csvRows = products.map((product) => {
        const shop = product.shop_id?.name || "";
        const category = product.category_id?.name || "";
        const date = product.date ? new Date(product.date).toISOString().split('T')[0] : "";
        
        return [
          shop,
          product.name || "",
          product.barcode || "",
          category,
          product.qty || 0,
          product.cost_price || 0,
          product.selling_price || 0,
          product.cgst || 0,
          product.sgst || 0,
          product.minimum_stock || 0,
          (product.note || "").replace(/,/g, ";"), // Replace commas in notes
          date
        ].join(",");
      }).join("\n");

      const csvContent = csvHeader + csvRows;

      // Create filename with timestamp
      const timestamp = new Date().toISOString().split("T")[0];
      const filename = `products_export_${timestamp}.csv`;

      // Write to file system
      const filePath = `${FileSystem.documentDirectory}${filename}`;
      await FileSystem.writeAsStringAsync(filePath, csvContent);

      // Share the file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filePath, {
          mimeType: "text/csv",
          dialogTitle: "Export Products",
          UTI: "public.comma-separated-values-text",
        });

        dispatch(
          showToast({
            message: `✅ Exported ${products.length} products`,
            type: "success",
          })
        );
      } else {
        dispatch(
          showToast({
            message: `File saved: ${filename}`,
            type: "success",
          })
        );
      }

      // console.log(`✅ Exported products to: ${filePath}`);
    } catch (err) {
      console.error("Export error:", err);
      dispatch(
        showToast({
          message: `Export failed: ${err.message}`,
          type: "error",
        })
      );
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <SafeAreaView style={global.safeArea}>
      <ScrollView
        style={global.container}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Tab Switcher */}
        <View
          style={{
            flexDirection: "row",
            marginBottom: 20,
            borderRadius: 8,
            overflow: "hidden",
            backgroundColor: "#f0f0f0",
          }}
        >
          <TouchableOpacity
            style={{
              flex: 1,
              paddingVertical: 12,
              backgroundColor: activeTab === "import" ? primaryColor : "#f0f0f0",
            }}
            onPress={() => setActiveTab("import")}
          >
            <Text
              style={{
                textAlign: "center",
                fontWeight: "600",
                color: activeTab === "import" ? "white" : "#666",
              }}
            >
              Import
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              flex: 1,
              paddingVertical: 12,
              backgroundColor: activeTab === "export" ? primaryColor : "#f0f0f0",
            }}
            onPress={() => setActiveTab("export")}
          >
            <Text
              style={{
                textAlign: "center",
                fontWeight: "600",
                color: activeTab === "export" ? "white" : "#666",
              }}
            >
              Export
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === "import" && (
          <>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "600",
                marginBottom: 10,
                color: "#333",
              }}
            >
              Import Products from CSV
            </Text>

            <Text
              style={{
                fontSize: 14,
                color: "#666",
                marginBottom: 20,
                lineHeight: 20,
              }}
            >
              Upload a CSV file with product data. The system will match shops by name
              and create new categories if needed.
            </Text>

        {/* Mandatory Fields Info */}
        <View
          style={{
            backgroundColor: "#f0f7ff",
            borderRadius: 8,
            padding: 15,
            marginBottom: 20,
            borderLeftWidth: 4,
            borderLeftColor: primaryColor,
          }}
        >
          <Text style={{ fontWeight: "600", color: primaryColor, marginBottom: 8 }}>
            📋 Required CSV Columns
          </Text>
          <Text style={{ fontSize: 13, color: "#555", lineHeight: 20 }}>
            <Text style={{ fontWeight: "600" }}>Mandatory:</Text> shop, name, category, qty{"\n"}
            <Text style={{ fontWeight: "600" }}>Optional:</Text> user_id, cost_price, selling_price, cgst, sgst, minimum_stock, date, note
          </Text>
        </View>

        {/* File Selection */}
        <TouchableOpacity
          style={{
            backgroundColor: primaryColor,
            borderRadius: 8,
            padding: 15,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 20,
          }}
          onPress={handleSelectFile}
          disabled={isImporting}
        >
          <MaterialIcons name="upload-file" size={24} color="white" />
          <Text
            style={{
              color: "white",
              fontSize: 16,
              fontWeight: "600",
              marginLeft: 10,
            }}
          >
            Select CSV File
          </Text>
        </TouchableOpacity>

        {/* Selected File Info */}
        {selectedFile && (
          <View
            style={{
              backgroundColor: "#e8f5e9",
              borderRadius: 8,
              padding: 15,
              marginBottom: 20,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: "600", color: "#2e7d32", marginBottom: 4 }}>
                ✅ File Selected
              </Text>
              <Text style={{ fontSize: 13, color: "#555" }}>
                {selectedFile.name}
              </Text>
              <Text style={{ fontSize: 12, color: "#999", marginTop: 4 }}>
                {previewData.length}+ products ready to import
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                setSelectedFile(null);
                setPreviewData([]);
              }}
            >
              <MaterialIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
        )}

        {/* Preview Data */}
        {previewData.length > 0 && (
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 8,
              padding: 15,
              marginBottom: 20,
              borderWidth: 1,
              borderColor: "#ddd",
            }}
          >
            <Text style={{ fontWeight: "600", marginBottom: 10 }}>
              Preview (First 5 rows)
            </Text>
            {previewData.map((row, index) => (
              <View
                key={index}
                style={{
                  borderBottomWidth: index < previewData.length - 1 ? 1 : 0,
                  borderBottomColor: "#f0f0f0",
                  paddingVertical: 10,
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: "600", color: "#333" }}>
                  {row.name}
                </Text>
                <Text style={{ fontSize: 12, color: "#666", marginTop: 2 }}>
                  Shop: {row.shop} | Qty: {row.qty} | Price: ₹{row.selling_price}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Loading Overlay with Progress Bar */}
        {isImporting && (
          <View
            style={{
              backgroundColor: "#f0f7ff",
              borderRadius: 8,
              padding: 20,
              marginBottom: 20,
              alignItems: "center",
              borderWidth: 2,
              borderColor: primaryColor,
            }}
          >
            <ActivityIndicator size="large" color={primaryColor} />
            <Text
              style={{
                marginTop: 15,
                fontSize: 16,
                fontWeight: "600",
                color: primaryColor,
              }}
            >
              Importing Products...
            </Text>
            <Text
              style={{
                marginTop: 5,
                fontSize: 13,
                color: "#666",
                textAlign: "center",
                marginBottom: 15,
              }}
            >
              {importMessage}
            </Text>

            {/* Progress Bar */}
            <View
              style={{
                width: "100%",
                height: 8,
                backgroundColor: "#e0e0e0",
                borderRadius: 4,
                overflow: "hidden",
                marginBottom: 10,
              }}
            >
              <View
                style={{
                  height: "100%",
                  width: `${importProgress * 100}%`,
                  backgroundColor: primaryColor,
                  borderRadius: 4,
                }}
              />
            </View>

            {/* Progress Percentage */}
            <Text
              style={{
                fontSize: 12,
                color: primaryColor,
                fontWeight: "600",
              }}
            >
              {Math.round(importProgress * 100)}%
            </Text>
          </View>
        )}

        {/* Import Button */}
        {selectedFile && !isImporting && (
          <TouchableOpacity
            style={{
              backgroundColor: "#4caf50",
              borderRadius: 8,
              padding: 15,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 20,
            }}
            onPress={handleImport}
            disabled={isImporting}
          >
            <MaterialIcons name="cloud-upload" size={24} color="white" />
            <Text
              style={{
                color: "white",
                fontSize: 16,
                fontWeight: "600",
                marginLeft: 10,
              }}
            >
              Import Products
            </Text>
          </TouchableOpacity>
        )}

        {/* CSV Template Example */}
        <View
          style={{
            backgroundColor: "#fff9e6",
            borderRadius: 8,
            padding: 15,
            marginTop: 20,
            borderLeftWidth: 4,
            borderLeftColor: "#ff9800",
          }}
        >
          <Text style={{ fontWeight: "600", color: "#f57c00", marginBottom: 8 }}>
            💡 CSV Format Example
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: "#555",
              fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
              lineHeight: 18,
            }}
          >
            shop,name,category,qty,cost_price,selling_price{"\n"}
            Main Shop,iPhone 13,Electronics,2,50000,55000{"\n"}
            Branch,Samsung S21,Electronics,5,40000,45000
          </Text>
        </View>
          </>
        )}

        {activeTab === "export" && (
          <>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "600",
                marginBottom: 10,
                color: "#333",
              }}
            >
              Export Products to CSV
            </Text>

            <Text
              style={{
                fontSize: 14,
                color: "#666",
                marginBottom: 20,
                lineHeight: 20,
              }}
            >
              Download all your products as a CSV file. You can use this for backup
              or to edit in Excel/Google Sheets.
            </Text>

            {/* Product Count */}
            <View
              style={{
                backgroundColor: "#e3f2fd",
                borderRadius: 8,
                padding: 15,
                marginBottom: 20,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View>
                <Text style={{ fontSize: 14, color: "#666", marginBottom: 4 }}>
                  Total Products
                </Text>
                <Text style={{ fontSize: 24, fontWeight: "700", color: primaryColor }}>
                  {products.length}
                </Text>
              </View>
              <MaterialIcons name="inventory" size={48} color={primaryColor} />
            </View>

            {/* Export Button */}
            <TouchableOpacity
              style={{
                backgroundColor: "#4caf50",
                borderRadius: 8,
                padding: 15,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 20,
              }}
              onPress={handleExportProducts}
              disabled={isImporting || products.length === 0}
            >
              {isImporting ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <MaterialIcons name="download" size={24} color="white" />
                  <Text
                    style={{
                      color: "white",
                      fontSize: 16,
                      fontWeight: "600",
                      marginLeft: 10,
                    }}
                  >
                    Download Products CSV
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* Export Info */}
            <View
              style={{
                backgroundColor: "#fff9e6",
                borderRadius: 8,
                padding: 15,
                borderLeftWidth: 4,
                borderLeftColor: "#ff9800",
              }}
            >
              <Text style={{ fontWeight: "600", color: "#f57c00", marginBottom: 8 }}>
                📋 Export Format
              </Text>
              <Text style={{ fontSize: 13, color: "#555", lineHeight: 20 }}>
                CSV file includes:{"\n"}
                • Shop name, Product name, Category{"\n"}
                • Barcode, Quantity, Prices (cost/selling){"\n"}
                • Tax details (CGST/SGST){"\n"}
                • Minimum stock, Notes, Date
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default ImportExportScreen;