import React, { useState } from "react";
import { View, Text, Modal, ScrollView, TouchableOpacity, TouchableWithoutFeedback, ActivityIndicator, Alert } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { CARD_BG } from "../styles/global";
import * as Print from "expo-print";
import { readAsStringAsync } from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Asset } from "expo-asset";

const TransactionDetailModal = ({ visible, onClose, item }) => {
  const [exporting, setExporting] = useState(false);

  if (!item) return null;

  const sale = item.sale || {};
  const saleType = sale.type || "sale";
  const customerName = sale.customer_id?.name || "Walk-in";
  const cashAmount = sale.cash_paid || 0;
  const onlineAmount = sale.online_paid || 0;

  const handleGenerateInvoice = async () => {
    if (!sale) return;
    if (sale.type !== 'sales') {
      Alert.alert('Invoice', 'Invoice is available for sales only.');
      return;
    }
    try {
      setExporting(true);

      const asset = Asset.fromModule(require("../assets/templates/invoice1.html"));
      await asset.downloadAsync();


      let templateHtml = "";
      if (asset.uri && asset.uri.startsWith("http")) {
        const res = await fetch(asset.uri);
        templateHtml = await res.text();
      } else {
        templateHtml = await readAsStringAsync(asset.localUri || asset.uri, { encoding: 'utf8' });
      }

      const filledHtml = populateInvoiceTemplate(templateHtml, sale, item);
      const pdfFileName = sale.invoice_no ? `invoice-${sale.invoice_no}` : `invoice-${Date.now()}`;
      const { uri } = await Print.printToFileAsync({ html: filledHtml, fileName: pdfFileName });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, { UTI: "com.adobe.pdf", mimeType: "application/pdf" });
      } else {
        Alert.alert("Invoice generated", `PDF saved to: ${uri}`);
      }
    } catch (err) {
      Alert.alert("Invoice error", err?.message || "Could not generate invoice.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={{ backgroundColor: CARD_BG, borderTopLeftRadius: 20, borderTopRightRadius: 20, height: "90%" }}>
              {/* Modal Header */}
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, borderBottomWidth: 1, borderBottomColor: "#eee" }}>
                <Text style={{ fontSize: 18, fontWeight: "700", color: "#333" }}>Transaction Details</Text>
                <TouchableOpacity onPress={onClose}>
                  <MaterialIcons name="close" size={28} color="#666" />
                </TouchableOpacity>
              </View>

              {/* Modal Content */}
              <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            <View style={{ padding: 20 }}>
              {/* Header */}
              <View style={{ marginBottom: 20, borderBottomWidth: 1, borderBottomColor: "#eee", paddingBottom: 15 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 20, fontWeight: "700", color: "#333", marginBottom: 5 }}>
                    {item.title}
                  </Text>
                  {sale.invoice_no && (
                    <Text style={{ fontSize: 12, color: "#888", marginBottom: 5 }}>
                      Invoice #{sale.invoice_no}
                    </Text>
                  )}
                </View>
                <Text style={{ fontSize: 14, color: "#666" }}>
                  {item.timeLabel} · {item.date}
                </Text>
                </View>
                {saleType === 'sales' && (
                  <TouchableOpacity
                    onPress={handleGenerateInvoice}
                    disabled={exporting}
                    style={{ backgroundColor: "#f1f5f9", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: "#e5e7eb", flexDirection: "row", alignItems: "center", gap: 8 }}
                  >
                    {exporting && <ActivityIndicator size="small" color="#2563eb" />}
                    <Text style={{ color: "#2563eb", fontWeight: "700", fontSize: 14, textAlign: "center" }}>
                      {exporting ? "Generating..." : "Generate Invoice"}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              

              {/* Amount */}
              <View style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: 14, color: "#666", marginBottom: 5 }}>Amount</Text>
                <Text style={{ fontSize: 24, fontWeight: "700", color: item.type === "income" ? "#2ecc71" : "#e74c3c" }}>
                  {item.type === "income" ? "+" : "-"}₹{(item.amount || 0).toFixed(2)}
                </Text>
              </View>

              {/* Details based on type */}
              {saleType === "service" && (
                <>
                  <DetailRow label="Service Name" value={sale.name || "N/A"} />
                  <DetailRow label="Customer" value={customerName} />
                  <DetailRow label="Total Amount" value={`₹${(sale.total_amount || 0).toFixed(2)}`} />
                  <DetailRow label="Paid Amount" value={`₹${(sale.paid_amount || 0).toFixed(2)}`} />
                  <DetailRow label="Balance" value={`₹${(sale.balance || 0).toFixed(2)}`} />
                  <DetailRow label="Status" value={sale.status || "N/A"} />
                </>
              )}

              {saleType === "sales" && (
                <>
                  <DetailRow label="Customer" value={customerName} />
                  <DetailRow label="Total Amount" value={`₹${(sale.total_amount || 0).toFixed(2)}`} />
                  <DetailRow label="Paid Amount" value={`₹${(sale.paid_amount || 0).toFixed(2)}`} />
                  <DetailRow label="Balance" value={`₹${(sale.balance || 0).toFixed(2)}`} />
                  <DetailRow label="Status" value={sale.status || "N/A"} />
                  
                  {sale.items && sale.items.length > 0 && (
                    <View style={{ marginTop: 15 }}>
                      <Text style={{ fontSize: 14, fontWeight: "600", color: "#333", marginBottom: 10 }}>Items</Text>
                      {sale.items.map((saleItem, idx) => (
                        <View key={idx} style={{ backgroundColor: "#f9f9f9", padding: 10, borderRadius: 6, marginBottom: 8 }}>
                          <Text style={{ fontSize: 14, fontWeight: "600", color: "#333" }}>
                            {saleItem.product_id?.name || "Product"}
                          </Text>
                          <Text style={{ fontSize: 12, color: "#666", marginTop: 3 }}>
                            Qty: {saleItem.quantity} × ₹{saleItem.unit_price} = ₹{saleItem.total_price}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </>
              )}

              {saleType === "return_item" && (
                <>
                  <DetailRow label="Customer" value={customerName} />
                  <DetailRow label="Return Amount" value={`₹${(sale.paid_amount || 0).toFixed(2)}`} />
                  <DetailRow label="Notes" value={sale.notes || "N/A"} />
                </>
              )}

              {saleType === "add_money" && (
                <>
                  <DetailRow label="Description" value={sale.notes || sale.name || "Money Added"} />
                  <DetailRow label="Amount" value={`₹${(sale.paid_amount || 0).toFixed(2)}`} />
                </>
              )}

              {saleType === "add_expense" && (
                <>
                  <DetailRow label="Description" value={sale.notes || sale.name || "Expense"} />
                  <DetailRow label="Amount" value={`₹${(sale.paid_amount || 0).toFixed(2)}`} />
                </>
              )}

              {/* Payment Details */}
              <View style={{ marginTop: 20, paddingTop: 15, borderTopWidth: 1, borderTopColor: "#eee" }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: "#333", marginBottom: 10 }}>Payment Details</Text>
                <DetailRow label="Payment Method" value={sale.payment_method || "N/A"} />
                {cashAmount > 0 && <DetailRow label="Cash Paid" value={`₹${cashAmount.toFixed(2)}`} />}
                {onlineAmount > 0 && <DetailRow label="Online Paid" value={`₹${onlineAmount.toFixed(2)}`} />}
              </View>

              {/* Shop */}
              {sale.shop_id?.name && (
                <View style={{ marginTop: 15 }}>
                  <DetailRow label="Shop" value={sale.shop_id.name} />
                </View>
              )}
            </View>
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const populateInvoiceTemplate = (templateHtml, sale, transaction) => {
  const formatCurrency = (val) => `₹${Number(val || 0).toFixed(2)}`;
  const formatDate = (val) => {
    try {
      return new Date(val).toLocaleDateString("en-IN");
    } catch (e) {
      return new Date().toLocaleDateString("en-IN");
    }
  };

  const shop = sale.shop_id || {};
  const customer = sale.customer_id || {};
  // logs removed
  const items = Array.isArray(sale.items) ? sale.items : [];

  const { itemsRows, subtotal, taxTotal, grandTotal } = buildInvoiceItems(items, sale);

  const placeholders = {
    "{{invoice_no}}": sale.invoice_no || "N/A",
    "{{invoice_date}}": formatDate(sale.createdAt || sale.created_at || transaction?.date || Date.now()),
    "{{company_name}}": shop.name || "Shop",
    "{{company_address}}": shop.address || shop.street || "",
    "{{company_phone}}": shop.contact_no || shop.phone || "",
    "{{company_gstin}}": shop.gstin || "",
    "{{customer_name}}": customer.name || "Walk-in",
    "{{customer_address}}": customer.address || "",
    "{{customer_phone}}": customer.contact_no || customer.phone || customer.phone_no || "",
    "{{payment_method}}": sale.payment_method || "N/A",
    "{{items_rows}}": itemsRows,
    "{{subtotal}}": formatCurrency(subtotal),
    "{{total_tax}}": formatCurrency(taxTotal),
    "{{invoice_total}}": formatCurrency(grandTotal),
  };

  return Object.entries(placeholders).reduce((html, [token, value]) => {
    const safeValue = value === undefined || value === null ? "" : String(value);
    return html.replace(new RegExp(token, "g"), safeValue);
  }, templateHtml);
};

const buildInvoiceItems = (items, sale) => {
  let subtotal = 0;
  let taxTotal = 0;
  const formatCurrency = (val) => `₹${Number(val || 0).toFixed(2)}`;

  const rows = items.length
    ? items
        .map((it) => {
          const name = it.product_id?.name || it.name || "Item";
          const qty = Number(it.quantity || 0);
          const unitPrice = Number(it.unit_price || 0);
          const cgst = Number(it.cgst ?? it.product_id?.cgst ?? 0);
          const sgst = Number(it.sgst ?? it.product_id?.sgst ?? 0);
          const taxPercent = Number(it.tax_percent ?? it.product_id?.tax_percent ?? sale.tax_percent ?? (cgst + sgst));
          const lineSubtotal = unitPrice * qty;
          const taxAmount = Number(it.tax_amount ?? lineSubtotal * (taxPercent / 100));
          const lineTotal = Number(it.total_price ?? lineSubtotal + taxAmount);

          subtotal += lineSubtotal;
          taxTotal += taxAmount;

          

          return `
            <tr>
              <td>${name}</td>
              <td>${formatCurrency(unitPrice)}</td>
              <td>${qty}</td>
              <td>${taxPercent}%</td>
              <td>${formatCurrency(taxAmount)}</td>
              <td>${formatCurrency(lineTotal)}</td>
            </tr>`;
        })
        .join("")
    : '<tr><td colspan="6" style="text-align:center; padding: 12px;">No items</td></tr>';

  const grandTotal = sale.total_amount != null ? Number(sale.total_amount) : subtotal + taxTotal;
  return { itemsRows: rows, subtotal, taxTotal, grandTotal };
};

// Helper component for detail rows
const DetailRow = ({ label, value }) => (
  <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" }}>
    <Text style={{ fontSize: 14, color: "#666" }}>{label}</Text>
    <Text style={{ fontSize: 14, fontWeight: "600", color: "#333", maxWidth: "60%", textAlign: "right" }}>{value}</Text>
  </View>
);

export default TransactionDetailModal;
