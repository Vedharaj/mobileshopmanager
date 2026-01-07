import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  PanResponder,
  SectionList,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { global, useThemeColors } from "../styles/global";
import { useDispatch, useSelector } from "react-redux";
import moment from "moment";
import { fetchSales } from "../store/slices/salesSlice";
import { clearCart } from "../store/slices/salesItemsSlice";
import { BAR_HEIGHT } from "../styles/global";
import { fetchProducts } from "../store/slices/productSlice";

import Entypo from "@expo/vector-icons/Entypo";
import { MaterialIcons } from "@expo/vector-icons";
import TransactionRow from "../components/TransactionRow";

const getWeekDates = (weekOffset = 0) => {
  const startOfWeek = moment().startOf("week").add(weekOffset, "weeks");
  return Array(7)
    .fill(0)
    .map((_, i) => startOfWeek.clone().add(i, "days"));
};

export default function HomeScreen({ navigation }) {
  const { role, username, user } = useSelector((state) => state.auth);
  const { shops } = useSelector((state) => state.shops);
  const { sales, status: salesStatus } = useSelector((state) => state.sales);
  const { products = [] } = useSelector((state) => state.products || {});

  const dispatch = useDispatch();
  const { primaryColor } = useThemeColors();
  const insets = useSafeAreaInsets();
  const SWIPE_THRESHOLD = 50;

  const today = moment();
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState(today);

  // Shop filter
  const [filterShopId, setFilterShopId] = useState("");

  // Summary visibility
  const [showSummary, setShowSummary] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const RECENT_DAYS = 14; // Limit fetch to recent days for faster loads

  const staffShops = user?.shops || [];
  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await dispatch(fetchSales({ days: RECENT_DAYS })).unwrap();
      await dispatch(fetchProducts()).unwrap();
    } catch (e) {
      // ignore; toasts handled in thunks if needed
    } finally {
      setIsRefreshing(false);
    }
  };

  // Clear cart items when HomeScreen is focused
  useFocusEffect(
    React.useCallback(() => {
      dispatch(clearCart());
    }, [dispatch])
  );

  // Fetch sales on component mount
  useEffect(() => {
    dispatch(fetchSales({ days: RECENT_DAYS }));
    dispatch(fetchProducts());
  }, [dispatch]);

  // Fetch transactions when date changes
  useEffect(() => {
    dispatch(fetchSales({ days: RECENT_DAYS }));
  }, [selectedDate, dispatch]);

  // Fetch transactions when shop filter changes
  useEffect(() => {
    dispatch(fetchSales({ days: RECENT_DAYS }));
  }, [filterShopId, dispatch]);

  const notificationCount = useMemo(() => {
    return products.filter((p) => {
      const qty = parseInt(p.qty, 10) || 0;
      const min = parseInt(p.minimum_stock, 10) || 0;
      return min > 0 && qty <= min;
    }).length;
  }, [products]);


  // Initialize shop filter based on role
  // useEffect(() => {
  //   if (role === "staff" && staffShops.length > 0) {
  //     const staffShopId = staffShops[0]?._id || staffShops[0];
  //     setFilterShopId(staffShopId);
  //   } else if (shops.length > 0) {
  //     setFilterShopId(""); // owner default: all shops
  //   }
  // }, [role, shops, staffShops]);

  // Transform sales data into transaction format (include timestamp for grouping)
  const transactions = useMemo(() => {
    if (!sales || sales.length === 0) return [];

    return sales.map((sale) => {
      const createdAtRaw = sale?.createdAt || sale?.created_at;
      const orderDateRaw = sale?.order_date;

      const createdAt = createdAtRaw ? moment(createdAtRaw) : null;
      const orderDate = orderDateRaw ? moment(orderDateRaw) : null;

      const dateForGrouping =
        orderDate && orderDate.isValid()
          ? orderDate
          : createdAt && createdAt.isValid()
          ? createdAt
          : moment();

      const timeForDisplay =
        createdAt && createdAt.isValid() ? createdAt : dateForGrouping;

      const name = sale?.name || "";
      const customerName = sale.customer_id?.name || "Walk-in";
      const paymentMethod = sale.payment_method || "cash";
      const saleShopId = sale.shop_id?._id || sale.shop_id;
      const saleType = sale.type || "service";
      const paymentBreakdown = sale.payment_breakdown || {};
      const subtractReturn = Boolean(paymentBreakdown?.subtract);
      const isECash =
        paymentMethod === "upi" ||
        paymentMethod === "ecash" ||
        paymentMethod === "e";
      let type = saleType === "add_expense" ? "expense" : "income";
      let amount = Number(sale.paid_amount || sale.total_amount || 0);

      // Determine title & subtitle for better row labeling
      let title = "Sale";
      let subtitle = customerName;

      // Determine title based on sale type
      if (saleType === "service") {
        title = "Service";
        subtitle = sale.name || customerName;
      } else if (saleType === "sales") {
        title = "Sale";
        const firstSaleItem = sale.items?.[0];
        if (firstSaleItem) {
          title = firstSaleItem?.category_name || "Sale";
          if (firstSaleItem.product_id && firstSaleItem.product_id.name) {
            title = firstSaleItem?.category_name + " - " + firstSaleItem?.product_id?.name;
        }
        }
      } else if (saleType === "add_money") {
        title = "Add Money";
        subtitle = sale.notes || sale.name || "Money Added";
      } else if (saleType === "add_expense") {
        title = "Expense";
        subtitle = sale.notes || sale.name || "Expense";
      } else if (saleType === "return_item") {
        title = "Return";
        subtitle = sale.notes || sale.name || "Item Returned";
        if (subtractReturn) {
          type = "expense";
          amount = -Math.abs(amount);
        }
      }

      // If sale has explicit notes, prefer them as subtitle
      if (sale?.notes && saleType !== "service") {
        subtitle = sale.notes;
      }

      // Compose final description (used in UI)
      const description = `${title} - ${subtitle}`;

      return {
        id: sale._id || sale.id,
        date: dateForGrouping.format("YYYY-MM-DD"),
        datetime: timeForDisplay.toISOString(),
        timestamp: timeForDisplay.valueOf(),
        timeLabel: timeForDisplay.format("h:mm A"),
        name,
        type,
        amount,
        title,
        subtitle,
        description,
        category:
          paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1),
        shopId: saleShopId,
        paymentMethod,
        isECash,
        sale,
      };
    });
  }, [sales]);

  const computeSplitAmounts = (sale) => {
    let cash = 0;
    let ecash = 0;

    const breakdown = sale?.payment_breakdown;
    if (Array.isArray(breakdown) && breakdown.length > 0) {
      breakdown.forEach((entry) => {
        const amt = Number(entry?.amount) || 0;
        const method = String(entry?.method || "").toLowerCase();
        if (method === "cash") cash += amt;
        else ecash += amt;
      });
    } else if (
      sale?.cash_paid !== undefined || sale?.online_paid !== undefined
    ) {
      cash = Number(sale?.cash_paid) || 0;
      ecash = Number(sale?.online_paid) || 0;
    } else {
      if (
        sale?.amount_in_cash !== undefined ||
        sale?.amount_in_ecash !== undefined
      ) {
        cash = Number(sale?.amount_in_cash) || 0;
        ecash = Number(sale?.amount_in_ecash) || 0;
      } else {
        const amt = Number(sale?.paid_amount || sale?.total_amount || 0);
        if (sale?.payment_method === "cash") cash = amt;
        else ecash = amt;
      }
    }

    return { cash, ecash };
  };

  // PanResponder for swipe gestures
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return (
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy) &&
          Math.abs(gestureState.dx) > 10
        );
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (Math.abs(gestureState.dx) > SWIPE_THRESHOLD) {
          if (gestureState.dx > 0) {
            // Swipe right - go to PAST week
            setWeekOffset((prev) => prev - 1);
          } else {
            // Swipe left - go to NEXT week
            setWeekOffset((prev) => prev + 1);
          }
        }
      },
    })
  ).current;

  const formattedDate = useMemo(() => {
    return selectedDate.format("DD MMM YYYY");
  }, [selectedDate]);

  const currentMonthLabel = useMemo(() => {
    const mid = weekDates[3] || today;
    return mid.format("MMMM YYYY");
  }, [weekDates, today]);

  const { totalIncome, totalExpense } = useMemo(() => {
    const selDateStr = selectedDate.format("YYYY-MM-DD");
    let inc = 0;
    let exp = 0;

    transactions.forEach((t) => {
      if (filterShopId && t.shopId !== filterShopId) return;

      if (t.date === selDateStr) {
        if (t.type === "income") inc += t.amount;
        if (t.type === "expense") exp += t.amount;
      }
    });

    return { totalIncome: inc, totalExpense: exp };
  }, [selectedDate, transactions, filterShopId]);

  const sections = useMemo(() => {
    const selDateStr = selectedDate.format("YYYY-MM-DD");

    const list = transactions
      .filter((t) => t.date === selDateStr)
      .filter((t) => (filterShopId ? t.shopId === filterShopId : true))
      .sort((a, b) => b.timestamp - a.timestamp);

    if (list.length === 0) return [];

    const hourGroups = {};
    list.forEach((txn) => {
      const hourLabel = moment(txn.datetime).format("h A");
      if (!hourGroups[hourLabel]) hourGroups[hourLabel] = [];
      hourGroups[hourLabel].push(txn);
    });

    return Object.entries(hourGroups).map(([hour, items]) => {
      let totalCash = 0;
      let totalECash = 0;
      items.forEach((txn) => {
        const { cash, ecash } = computeSplitAmounts(txn.sale);
        totalCash += cash;
        totalECash += ecash;
      });
      return {
        title: `${hour} · ${items.length} txns`,
        data: items,
        totalCash,
        totalECash,
      };
    });
  }, [selectedDate, filterShopId, transactions]);

  const cashOnHand = useMemo(() => {
    let balance = 0;
    transactions.forEach((t) => {
      if (filterShopId && t.shopId !== filterShopId) return;
      const tDate = moment(t.date, "YYYY-MM-DD");
      if (tDate.isSame(selectedDate, "day")) {
        const { cash } = computeSplitAmounts(t.sale);

        if (t.type === "income") {
          if (cash > 0) {
            balance += cash;
          } else if (t.paymentMethod === "cash" && cash === 0) {
            balance += t.amount;
          }
        }

        if (t.type === "expense") {
          if (cash > 0) {
            balance -= cash;
          } else if (t.paymentMethod === "cash" && cash === 0) {
            balance -= t.amount;
          }
        }
      }
    });
    return balance;
  }, [selectedDate, transactions, filterShopId]);

  const eCash = useMemo(() => {
    let eCashBalance = 0;
    transactions.forEach((t) => {
      if (filterShopId && t.shopId !== filterShopId) return;
      const tDate = moment(t.date, "YYYY-MM-DD");
      if (tDate.isSame(selectedDate, "day")) {
        const { ecash } = computeSplitAmounts(t.sale);

        if (t.type === "income") {
          if (ecash > 0) {
            eCashBalance += ecash;
          } else if (
            (t.paymentMethod === "upi" ||
              t.paymentMethod === "e" ||
              t.paymentMethod === "ecash" ||
              t.isECash) &&
            ecash === 0
          ) {
            eCashBalance += t.amount;
          }
        }

        if (t.type === "expense") {
          if (ecash > 0) {
            eCashBalance -= ecash;
          } else if (
            (t.paymentMethod === "upi" ||
              t.paymentMethod === "e" ||
              t.paymentMethod === "ecash" ||
              t.isECash) &&
            ecash === 0
          ) {
            eCashBalance -= t.amount;
          }
        }
      }
    });
    return eCashBalance;
  }, [selectedDate, transactions, filterShopId]);

  const isLoading = salesStatus === "loading";
  const totalItems = sections.length;
  return (
    <SafeAreaView style={global.safeArea}>
      <StatusBar
        className="statusBarStyleHomeScreen"
        barStyle="dark-content"
        backgroundColor="#fff"
      />
      {/* Navbar */}
      <View
        style={{
          ...global.navbarContainer,
          paddingTop: 2,
          elevation: 0,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        }}
      >

        <View style={{ flex: 1 }}>
          <Text numberOfLines={2} style={global.navbarName}>
            {username}{" "}
            <Text style={{ ...global.navbarRole, color: primaryColor }}>
              {role || "User"}
            </Text>
          </Text>
        </View>

        <View style={global.navbarRight}>
          <Text style={global.navbarDate}>{formattedDate}</Text>
        </View>
        {/* Notifications icon with low-stock badge */}
        <TouchableOpacity
          style={{
            padding: 6,
            borderRadius: 10,
            backgroundColor: "#f5f5f5",
            position: "relative",
          }}
          onPress={() => navigation.navigate("Notification")}
        >
          <MaterialIcons name="notifications-none" size={22} color={primaryColor} />
          {notificationCount > 0 && (
            <View
              style={{
                position: "absolute",
                top: -4,
                right: -4,
                minWidth: 18,
                height: 18,
                borderRadius: 9,
                backgroundColor: "#ba181b",
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: 4,
                zIndex: 2,
              }}
            >
              <Text style={{ color: "#fff", fontSize: 10, fontWeight: "700" }}>
                {notificationCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
      <View style={global.container}>
        {/* Toggle Summary Button */}
        <TouchableOpacity
          onPress={() => setShowSummary(!showSummary)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: 8,
            marginBottom: 10,
            backgroundColor: "#f0f0f0",
            borderRadius: 8,
          }}
        >
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: "#666",
              marginRight: 6,
            }}
          >
            {showSummary ? "Hide" : "Show"} Summary
          </Text>
          <Entypo
            name={showSummary ? "chevron-up" : "chevron-down"}
            size={18}
            color="#666"
          />
        </TouchableOpacity>

        {showSummary && (
          <>
            {/* Income / Expense summary - Row 1 */}
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}>
              <View
                style={[global.summaryBox, global.summaryIncome, { flex: 1 }]}
              >
                <Text style={global.summaryLabel}>Income</Text>
                <Text style={global.summaryValue}>₹{totalIncome}</Text>
              </View>
              <View
                style={[global.summaryBox, global.summaryExpense, { flex: 1 }]}
              >
                <Text style={global.summaryLabel}>Expense</Text>
                <Text style={global.summaryValue}>₹{totalExpense}</Text>
              </View>
            </View>

            {/* Cash on Hand / E-Cash summary - Row 2 */}
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}>
              <View
                style={[global.summaryBox, global.summaryCash, { flex: 1 }]}
              >
                <Text style={global.summaryLabel}>Cash on Hand</Text>
                <Text style={global.summaryValue}>
                  ₹{cashOnHand.toFixed(2)}
                </Text>
              </View>
              <View style={[global.summaryBox, { flex: 1 }]}>
                <Text style={global.summaryLabel}>E-Cash</Text>
                <Text style={global.summaryValue}>₹{eCash.toFixed(2)}</Text>
              </View>
            </View>
          </>
        )}

        {/* Week date row (swipeable) */}
        <View
          style={[
            global.swipeArea,
            {
              padding: 8,
              justifyContent: "center",
              flexDirection: "row-reverse",
            },
          ]}
          {...panResponder.panHandlers}
        >
          {weekDates
            .slice()
            .reverse()
            .map((day) => {
              const isFuture = day.isAfter(today, "day");
              const isSelected = selectedDate.isSame(day, "day");

              return (
                <TouchableOpacity
                  key={day.format("YYYY-MM-DD")}
                  style={[
                    global.dateItem,
                    isSelected && global.selectedDateItem,
                    isFuture && global.disabledDateItem,
                  ]}
                  disabled={isFuture}
                  onPress={() => setSelectedDate(day)}
                >
                  <Text style={global.dayLabel}>{day.format("ddd")}</Text>
                  <Text style={global.dateLabel}>{day.format("DD")}</Text>
                </TouchableOpacity>
              );
            })}
        </View>

        {/* Shop filter chips */}
        {!isLoading && role !== "staff" && shops.length > 0 && (
          <View
            style={{
              width: "100%",
              paddingHorizontal: 8,
              paddingVertical: 0,
              marginVertical: 0,
            }}
          >
            <ScrollView
              horizontal={true}
              showsHorizontalScrollIndicator={false}
            >
              <TouchableOpacity
                onPress={() => setFilterShopId("")}
                style={[
                  global.chipBaseStyle,
                  {
                    borderColor: filterShopId === "" ? primaryColor : "#ccc",
                    backgroundColor:
                      filterShopId === "" ? primaryColor : "#fff",
                  },
                ]}
              >
                <Text
                  style={{
                    fontSize: 12,
                    color: filterShopId === "" ? "#fff" : "#333",
                  }}
                >
                  All Shops
                </Text>
              </TouchableOpacity>

              {shops.map((shop) => {
                const id = shop._id;
                const isActive = filterShopId === id;
                return (
                  <TouchableOpacity
                    key={id}
                    onPress={() => setFilterShopId(id)}
                    style={[
                      global.chipBaseStyle,
                      {
                        borderColor: isActive ? primaryColor : "#ccc",
                        backgroundColor: isActive ? primaryColor : "#fff",
                      },
                    ]}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        color: isActive ? "#fff" : "#333",
                      }}
                    >
                      {shop.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Transaction history header */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 0,
            paddingTop: 6,
            paddingBottom: 0,
          }}
        >
          <Text
            style={[global.sectionTitle, { marginTop: 0, marginBottom: 0 }]}
          >
            Transaction History
          </Text>
          <TouchableOpacity
            onPress={() => {
              navigation.navigate("Transaction");
            }}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 8,
              backgroundColor: primaryColor,
            }}
          >
            <Text style={{ color: "#fff", fontSize: 14, fontWeight: "600" }}>
              <Entypo name="plus" size={16} color="white" /> Add
            </Text>
          </TouchableOpacity>
        </View>

        {/* Transactions list / loading / empty */}
        {isLoading ? (
          <View style={{ alignItems: "center", paddingVertical: 20 }}>
            <ActivityIndicator size="small" color={primaryColor} />
            <Text style={[global.emptyText]}>Loading transactions...</Text>
          </View>
        ) : totalItems === 0 ? (
          <Text style={global.emptyText}>No transactions for this date.</Text>
        ) : (
          <SectionList
            sections={sections}
            keyExtractor={(item, index) => {
              const base = (
                item.id ||
                item._id ||
                item.datetime ||
                index
              ).toString();
              return `${base}-${index}`;
            }}
            showsVerticalScrollIndicator={false}
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            renderSectionHeader={({ section }) => (
              <View style={{ alignItems: "center", marginVertical: 6 }}>
                <Text style={{ color: primaryColor, fontWeight: "600" }}>
                  {section.title}
                </Text>
              </View>
            )}
            // renderSectionFooter={({ section }) => (
            //   <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9f9f9', padding: 8, marginHorizontal: 4, marginBottom: 10, borderRadius: 8 }}>
            //     <Text style={{ fontSize: 12, color: '#666', fontWeight: '600' }}>Total</Text>
            //     <View style={{ flexDirection: 'row', gap: 10 }}>
            //       {section.totalCash > 0 && (
            //         <View style={{ alignItems: 'center' }}>
            //           <Text style={{ color: '#2ecc71', fontWeight: '700', fontSize: 13 }}>
            //             ₹{section.totalCash.toFixed(2)}
            //           </Text>
            //           <Text style={{ color: '#888', fontSize: 11 }}>Cash</Text>
            //         </View>
            //       )}
            //       {section.totalECash > 0 && (
            //         <View style={{ alignItems: 'center' }}>
            //           <Text style={{ color: '#2ecc71', fontWeight: '700', fontSize: 13 }}>
            //             ₹{section.totalECash.toFixed(2)}
            //           </Text>
            //           <Text style={{ color: '#888', fontSize: 11 }}>E-Cash</Text>
            //         </View>
            //       )}
            //     </View>
            //   </View>
            // )}
            renderItem={({ item }) => <TransactionRow item={item} />}
            contentContainerStyle={{
              paddingBottom: Math.round(BAR_HEIGHT + (insets.bottom || 0) + 16),
            }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
