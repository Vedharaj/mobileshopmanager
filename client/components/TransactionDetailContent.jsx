import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useThemeColors } from "../styles/global";

const TransactionDetailContent = ({ item, exporting, onGenerateInvoice }) => {
  const { cardBg, textColor, textSecondary, borderColor } = useThemeColors();

  if (!item) return null;

  const sale = item.sale || {};
  const saleType = sale.type || "sale";
  const customerName = sale.customer_id?.name || "Walk-in";
  const cashAmount = sale.cash_paid || 0;
  const onlineAmount = sale.online_paid || 0;

  return (
    <ScrollView
      style={{ flex: 1 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      nestedScrollEnabled
      contentContainerStyle={{ padding: 20, paddingBottom: 40, backgroundColor: cardBg }}
    >
      {/* Header */}
      <View
        style={{
          marginBottom: 20,
          borderBottomWidth: 1,
          borderBottomColor: borderColor,
          paddingBottom: 15,
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
            <Text style={{ fontSize: 20, fontWeight: "700", color: textColor, marginBottom: 5 }}>
              {item.title}
            </Text>
            {sale.invoice_no && (
              <Text style={{ fontSize: 12, color: textSecondary, marginBottom: 5 }}>
                Invoice #{sale.invoice_no}
              </Text>
            )}
          </View>
          <Text style={{ fontSize: 14, color: textSecondary }}>
            {item.timeLabel} · {item.date}
          </Text>
        </View>

        {saleType === "sales" && (
          <TouchableOpacity
            onPress={onGenerateInvoice}
            disabled={exporting}
            style={{
              backgroundColor: "#f1f5f9",
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 4,
              borderWidth: 1,
              borderColor: "#e5e7eb",
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
            }}
          >
            {exporting && <ActivityIndicator size="small" color="#2563eb" />}
            <Text
              style={{
                color: "#2563eb",
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
        <Text style={{ fontSize: 14, color: textSecondary, marginBottom: 5 }}>Amount</Text>
        <Text
          style={{
            fontSize: 24,
            fontWeight: "700",
            color: item.type === "income" ? "#2ecc71" : "#e74c3c",
          }}
        >
          {item.type === "income" ? "+" : "-"}₹{(item.amount || 0).toFixed(2)}
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
          <DetailRow label="Balance" value={`₹${(sale.balance || 0).toFixed(2)}`} />
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
          <DetailRow label="Balance" value={`₹${(sale.balance || 0).toFixed(2)}`} />
          <DetailRow label="Status" value={sale.status || "N/A"} />

          {sale.items && sale.items.length > 0 && (
            <View style={{ marginTop: 15 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: textColor,
                  marginBottom: 10,
                }}
              >
                Items
              </Text>
              {sale.items.map((saleItem, idx) => (
                <View
                  key={idx}
                  style={{
                    backgroundColor: cardBg,
                    padding: 10,
                    borderRadius: 6,
                    marginBottom: 8,
                    borderWidth: 1,
                    borderColor: borderColor,
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: "600", color: textColor }}>
                    {saleItem.product_id?.name || "Product"}
                  </Text>
                  <Text style={{ fontSize: 12, color: textSecondary, marginTop: 3 }}>
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
          <DetailRow
            label="Return Amount"
            value={`₹${(sale.paid_amount || 0).toFixed(2)}`}
          />
          <DetailRow label="Notes" value={sale.notes || "N/A"} />
        </>
      )}

      {saleType === "add_money" && (
        <>
          <DetailRow label="Description" value={sale.notes || sale.name || "Money Added"} />
          <DetailRow
            label="Amount"
            value={`₹${(sale.paid_amount || 0).toFixed(2)}`}
          />
        </>
      )}

      {saleType === "add_expense" && (
        <>
          <DetailRow label="Description" value={sale.notes || sale.name || "Expense"} />
          <DetailRow
            label="Amount"
            value={`₹${(sale.paid_amount || 0).toFixed(2)}`}
          />
        </>
      )}

      {/* Payment Details */}
      <View
        style={{
          marginTop: 20,
          paddingTop: 15,
          borderTopWidth: 1,
          borderTopColor: borderColor,
        }}
      >
        <Text style={{ fontSize: 14, fontWeight: "600", color: textColor, marginBottom: 10 }}>
          Payment Details
        </Text>
        <DetailRow label="Payment Method" value={sale.payment_method || "N/A"} />
        {cashAmount > 0 && <DetailRow label="Cash Paid" value={`₹${cashAmount.toFixed(2)}`} />}
        {onlineAmount > 0 && (
          <DetailRow label="Online Paid" value={`₹${onlineAmount.toFixed(2)}`} />
        )}
      </View>

      {/* Shop */}
      {sale.shop_id?.name && (
        <View style={{ marginTop: 15 }}>
          <DetailRow label="Shop" value={sale.shop_id.name} />
        </View>
      )}
    </ScrollView>
  );
};

const DetailRow = ({ label, value }) => {
  const { textColor, textSecondary, borderColor } = useThemeColors();
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: borderColor,
      }}
    >
      <Text style={{ fontSize: 14, color: textSecondary }}>{label}</Text>
      <Text
        style={{
          fontSize: 14,
          fontWeight: "600",
          color: textColor,
          maxWidth: "60%",
          textAlign: "right",
        }}
      >
        {value}
      </Text>
    </View>
  );
};

export default TransactionDetailContent;
