import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { global, useThemeColors } from "../styles/global";
import * as Print from "expo-print";
import { readAsStringAsync } from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Asset } from "expo-asset";
import { useDispatch } from "react-redux";
import { showToast } from "../store/slices/toastSlice";
import { fetchSales, deleteSale } from "../store/slices/salesSlice";

const TransactionDetailScreen = ({ navigation, route }) => {
  const { item } = route.params || {};
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { primaryColor } = useThemeColors();
  const dispatch = useDispatch();

  if (!item) {
    return (
      <SafeAreaView style={global.safeArea}>
        <Text>Transaction not found</Text>
      </SafeAreaView>
    );
  }

  const sale = item.sale || {};
  const saleType = sale.type || "sale";
  const customerName = sale.customer_id?.name || "Walk-in";
  const cashAmount = sale.cash_paid || 0;
  const onlineAmount = sale.online_paid || 0;

  const populateInvoiceTemplate = (html, sale, item) => {
    const items = sale.items || [];
    const itemsTableRows = items
      .map(
        (it) => `
      <tr>
        <td>${it.product_id?.name || "Item"}</td>
        <td style="text-align:center">${it.quantity}</td>
        <td style="text-align:right">₹${(it.unit_price || 0).toFixed(2)}</td>
        <td style="text-align:right">₹${(it.total_price || 0).toFixed(2)}</td>
      </tr>
    `
      )
      .join("");

    const filledHtml = html
      .replace(/\{\{invoice_no\}\}/g, sale.invoice_no || "N/A")
      .replace(/\{\{customer_name\}\}/g, customerName)
      .replace(/\{\{order_date\}\}/g, new Date(sale.order_date).toLocaleDateString())
      .replace(/\{\{items_table_rows\}\}/g, itemsTableRows)
      .replace(/\{\{total_amount\}\}/g, (sale.total_amount || 0).toFixed(2))
      .replace(/\{\{paid_amount\}\}/g, (sale.paid_amount || 0).toFixed(2))
      .replace(/\{\{balance\}\}/g, (sale.balance || 0).toFixed(2));

    return filledHtml;
  };

  const handleGenerateInvoice = async () => {
    if (!sale) return;
    if (sale.type !== "sales") {
      Alert.alert("Invoice", "Invoice is available for sales only.");
      return;
    }
    try {
      setExporting(true);

      const asset = Asset.fromModule(
        require("../assets/templates/invoice1.html")
      );
      await asset.downloadAsync();

      let templateHtml = "";
      if (asset.uri && asset.uri.startsWith("http")) {
        const res = await fetch(asset.uri);
        templateHtml = await res.text();
      } else {
        templateHtml = await readAsStringAsync(asset.localUri || asset.uri, {
          encoding: "utf8",
        });
      }

      const filledHtml = populateInvoiceTemplate(templateHtml, sale, item);
      const pdfFileName = sale.invoice_no
        ? `invoice-${sale.invoice_no}`
        : `invoice-${Date.now()}`;
      const { uri } = await Print.printToFileAsync({
        html: filledHtml,
        fileName: pdfFileName,
      });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          UTI: "com.adobe.pdf",
          mimeType: "application/pdf",
        });
      } else {
        Alert.alert("Invoice generated", `PDF saved to: ${uri}`);
      }
    } catch (err) {
      Alert.alert("Invoice error", err?.message || "Could not generate invoice.");
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteTransaction = () => {
    const sale = item?.sale || {};
    const saleId = sale?._id || sale?.id || item?.sale_id || item?._id || item?.id;

    if (!saleId) {
      Alert.alert("Delete Transaction", "Unable to find transaction ID.");
      return;
    }

    Alert.alert(
      "Delete Transaction",
      "Are you sure you want to delete this transaction? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setDeleting(true);
              await dispatch(deleteSale(saleId)).unwrap();
              navigation.goBack();
              // Refresh sales in background
              dispatch(fetchSales());
              dispatch(showToast({ message: "Transaction deleted", type: "success" }));
            } catch (err) {
              const msg =
                typeof err === "string"
                  ? err
                  : err?.payload?.message || err?.message || "Failed to delete";
              dispatch(showToast({ message: msg, type: "error" }));
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const DetailRow = ({ label, value }) => (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 8,
        paddingHorizontal: 0,
        borderBottomWidth: 1,
        borderBottomColor: "#f0f0f0",
      }}
    >
      <Text style={{ fontSize: 13, color: "#666", fontWeight: "500" }}>
        {label}
      </Text>
      <Text style={{ fontSize: 13, color: "#333", fontWeight: "600" }}>
        {value}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={global.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: "#eee",
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: "700", color: "#333" }}>
          Transaction Details
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <TouchableOpacity onPress={handleDeleteTransaction} disabled={deleting}>
            <MaterialIcons name="delete" size={26} color={deleting ? "#bbb" : "#e74c3c"} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialIcons name="close" size={28} color="#666" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: 16 }}
      >
        <View style={{ paddingHorizontal: 16 }}>
          {/* Header Section */}
          <View
            style={{
              marginBottom: 20,
              paddingBottom: 15,
              borderBottomWidth: 1,
              borderBottomColor: "#eee",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 10,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: "700",
                    color: "#333",
                    marginBottom: 5,
                  }}
                >
                  {item.title}
                </Text>
                {sale.invoice_no && (
                  <Text style={{ fontSize: 12, color: "#888", marginBottom: 5 }}>
                    Invoice #{sale.invoice_no}
                  </Text>
                )}
              </View>
              <Text style={{ fontSize: 12, color: "#666", textAlign: "right" }}>
                {item.timeLabel}
                {"\n"}
                {item.date}
              </Text>
            </View>
            {saleType === "sales" && (
              <TouchableOpacity
                onPress={handleGenerateInvoice}
                disabled={exporting}
                style={{
                  backgroundColor: "#f1f5f9",
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: "#e5e7eb",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  marginTop: 10,
                }}
              >
                {exporting && <ActivityIndicator size="small" color={primaryColor} />}
                <Text
                  style={{
                    color: primaryColor,
                    fontWeight: "700",
                    fontSize: 14,
                    textAlign: "center",
                  }}
                >
                  {exporting ? "Generating..." : "Generate Invoice"}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Amount */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 14, color: "#666", marginBottom: 5 }}>
              Amount
            </Text>
            <Text
              style={{
                fontSize: 28,
                fontWeight: "700",
                color:
                  item.type === "income" ? "#2ecc71" : "#e74c3c",
              }}
            >
              {item.type === "income" ? "+" : "-"}₹
              {(item.amount || 0).toFixed(2)}
            </Text>
          </View>

          {/* Details based on type */}
          {saleType === "service" && (
            <>
              <DetailRow label="Service Name" value={sale.name || "N/A"} />
              <DetailRow label="Customer" value={customerName} />
              <DetailRow
                label="Total Amount"
                value={`₹${(sale.total_amount || 0).toFixed(2)}`}
              />
              <DetailRow
                label="Paid Amount"
                value={`₹${(sale.paid_amount || 0).toFixed(2)}`}
              />
              <DetailRow
                label="Balance"
                value={`₹${(sale.balance || 0).toFixed(2)}`}
              />
              <DetailRow label="Status" value={sale.status || "N/A"} />
            </>
          )}

          {saleType === "sales" && (
            <>
              <DetailRow label="Customer" value={customerName} />
              <DetailRow
                label="Total Amount"
                value={`₹${(sale.total_amount || 0).toFixed(2)}`}
              />
              <DetailRow
                label="Paid Amount"
                value={`₹${(sale.paid_amount || 0).toFixed(2)}`}
              />
              <DetailRow
                label="Balance"
                value={`₹${(sale.balance || 0).toFixed(2)}`}
              />
              <DetailRow label="Status" value={sale.status || "N/A"} />

              {sale.items && sale.items.length > 0 && (
                <View style={{ marginTop: 20 }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: "#333",
                      marginBottom: 10,
                    }}
                  >
                    Items
                  </Text>
                  {sale.items.map((saleItem, idx) => (
                    <View
                      key={idx}
                      style={{
                        backgroundColor: "#f9f9f9",
                        padding: 12,
                        borderRadius: 6,
                        marginBottom: 8,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "600",
                          color: "#333",
                          marginBottom: 6,
                        }}
                      >
                        {saleItem.product_id?.name || "Product"}
                      </Text>
                      {saleItem.category_name && (
                        <Text
                          style={{
                            fontSize: 12,
                            color: primaryColor,
                            marginBottom: 4,
                          }}
                        >
                          Category: {saleItem.category_name}
                        </Text>
                      )}
                      <Text style={{ fontSize: 12, color: "#666" }}>
                        Qty: {saleItem.quantity} × ₹{saleItem.unit_price} = ₹
                        {saleItem.total_price}
                      </Text>
                      {saleItem.cgst > 0 && (
                        <Text style={{ fontSize: 11, color: "#888", marginTop: 4 }}>
                          CGST: {saleItem.cgst}% | SGST: {saleItem.sgst}%
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </>
          )}

          {saleType === "add_money" && (
            <>
              <DetailRow label="Amount Added" value={`₹${(sale.paid_amount || 0).toFixed(2)}`} />
              <DetailRow label="Notes" value={sale.notes || "N/A"} />
            </>
          )}

          {saleType === "add_expense" && (
            <>
              <DetailRow label="Expense Amount" value={`₹${(sale.paid_amount || 0).toFixed(2)}`} />
              <DetailRow label="Notes" value={sale.notes || "N/A"} />
            </>
          )}

          {saleType === "return_item" && (
            <>
              <DetailRow label="Return Amount" value={`₹${(sale.paid_amount || 0).toFixed(2)}`} />
              <DetailRow label="Notes" value={sale.notes || "N/A"} />
            </>
          )}

          {/* Payment breakdown */}
          {(cashAmount > 0 || onlineAmount > 0) && (
            <View style={{ marginTop: 20, marginBottom: 20 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: "#333",
                  marginBottom: 10,
                }}
              >
                Payment Breakdown
              </Text>
              {cashAmount > 0 && (
                <DetailRow
                  label="Cash"
                  value={`₹${cashAmount.toFixed(2)}`}
                />
              )}
              {onlineAmount > 0 && (
                <DetailRow
                  label="Online"
                  value={`₹${onlineAmount.toFixed(2)}`}
                />
              )}
            </View>
          )}

          {sale.notes && saleType !== "add_money" && saleType !== "add_expense" && saleType !== "return_item" && (
            <View style={{ marginTop: 20, marginBottom: 20 }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: "#333", marginBottom: 8 }}>
                Notes
              </Text>
              <Text style={{ fontSize: 13, color: "#666", lineHeight: 20 }}>
                {sale.notes}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default TransactionDetailScreen;
