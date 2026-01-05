import React from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { useDispatch } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import { global, useThemeColors, useThemedStyles } from "../styles/global";
import { deleteService, fetchServices } from "../store/slices/serviceSlice";
import { showToast } from "../store/slices/toastSlice";

const ServiceRow = ({ service, dateType = "received" }) => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const themedStyles = useThemedStyles();
  const { textSecondary, isDarkMode, cardBg, primaryColor } = useThemeColors();

  const isPending = service.status === "pending" || (service.balance && service.balance > 0);
  const bgColor = isDarkMode ? cardBg : isPending ? "#eee" : "#e9f7ef";

  const statusLabelMap = {
    pending: "Pending",
    in_progress: "In Progress",
    completed: "Completed",
    cancelled: "Cancelled",
  };
  const statusColorMap = {
    pending: "#f39c12",
    in_progress: "#f39c12",
    completed: "#2ecc71",
    cancelled: "#ba181b",
  };

  const statusLabel = statusLabelMap[service.status] || (service.status || "");
  const statusColor = statusColorMap[service.status] || textSecondary;
  const accent = statusColorMap[service.status] || (isPending ? "#f39c12" : "#2ecc71");

  const customerName = service.customer_id?.name || "Walk-in";
  const customerPhone = service.customer_id?.phone_no || "N/A";
  const shortCustomerName = customerName.length > 12 ? `${customerName.slice(0,12)}..` : customerName;
  const subtitle = `${shortCustomerName} · ${service.shop_id?.name || 'N/A'} · Service`;
  const totalAmount = service.total_amount || 0;
  const productNames = service.product_name || "No products";
  const userName = service.user_id?.username || "Unknown";

  const balance = service.balance != null ? service.balance : (service.total_amount || 0) - ((service.amount_in_cash || 0) + (service.amount_in_ecash || 0));


  const handleDelete = () => {
    Alert.alert("Delete Service", `Delete \"${service.name}\"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await dispatch(deleteService(service._id)).unwrap();
          try {
            dispatch(showToast({ message: "Service deleted", type: "success" }));
            dispatch(fetchServices());
          } catch (err) {
            dispatch(showToast({ message: err?.message || "Failed to delete service", type: "error" }));
          }
        },
      },
    ]);
  };

  return (
    <View style={{ marginVertical: 6, marginHorizontal: 4, borderRadius: 8, overflow: "hidden" }}>
      <TouchableOpacity
        onPress={() => navigation.navigate("ServiceDetail", { serviceId: service._id })}
        onLongPress={handleDelete}
        activeOpacity={0.8}
      >
        <View
          style={{
            flexDirection: "column",
            alignItems: "flex-start",
            ...themedStyles.cardBg2,
            borderColor: statusColor,
            borderLeftWidth: 6,
          }}
        >

          <View style={{ flex: 1, flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
            <Text style={[themedStyles.txnTitle, { marginBottom: 4, color: accent }]}>{service.name} · {productNames}  · {statusLabel} </Text>
            <Text style={{ color: accent, fontWeight: "700", fontSize: 14 }}>₹{(balance || 0).toFixed(2)}</Text>
          </View>
          <View style={{ marginTop: 4 }}>
            {/* <Text style={[themedStyles.txnSubtitle, { color: textSecondary }]}>Date {dateType === "received" ? "Received" : "Delivered"}: {dateType === "received" ? (new Date(service.received_date)).toLocaleDateString() : (new Date(service.return_date)).toLocaleDateString()}</Text> */}
            <Text style={[themedStyles.txnSubtitle, { color: textSecondary }]}>Customer Name: {customerName}</Text>
            <Text style={[themedStyles.txnSubtitle, { color: textSecondary }]}>Shop Name: {service.shop_id?.name || 'N/A'}</Text>
            <Text style={[themedStyles.txnSubtitle, { color: textSecondary }]}>Received By: {userName}</Text>
            <Text style={[themedStyles.txnSubtitle, { color: textSecondary }]}>Total Amount: ₹{totalAmount.toFixed(2)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

export default ServiceRow;
