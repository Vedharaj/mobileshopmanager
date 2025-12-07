import React from "react";
import { View, Text, Modal, ScrollView, TouchableOpacity, TouchableWithoutFeedback } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

const TransactionDetailModal = ({ visible, onClose, item }) => {
  if (!item) return null;

  const sale = item.sale || {};
  const saleType = sale.type || "sale";
  const customerName = sale.customer_id?.name || "Walk-in";
  const cashAmount = sale.cash_paid || 0;
  const onlineAmount = sale.online_paid || 0;

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
            <View style={{ backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "90%" }}>
          {/* Modal Header */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, borderBottomWidth: 1, borderBottomColor: "#eee" }}>
            <Text style={{ fontSize: 18, fontWeight: "700", color: "#333" }}>Transaction Details</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={28} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Modal Content */}
          <ScrollView style={{ maxHeight: "80%" }}>
            <View style={{ padding: 20 }}>
              {/* Header */}
              <View style={{ marginBottom: 20, borderBottomWidth: 1, borderBottomColor: "#eee", paddingBottom: 15 }}>
                <Text style={{ fontSize: 20, fontWeight: "700", color: "#333", marginBottom: 5 }}>
                  {item.title}
                </Text>
                <Text style={{ fontSize: 14, color: "#666" }}>
                  {item.timeLabel} · {item.date}
                </Text>
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

// Helper component for detail rows
const DetailRow = ({ label, value }) => (
  <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" }}>
    <Text style={{ fontSize: 14, color: "#666" }}>{label}</Text>
    <Text style={{ fontSize: 14, fontWeight: "600", color: "#333", maxWidth: "60%", textAlign: "right" }}>{value}</Text>
  </View>
);

export default TransactionDetailModal;
