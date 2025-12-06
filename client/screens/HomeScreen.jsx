// HomeScreen.jsx
import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  PanResponder,
  SectionList,
<<<<<<< HEAD
=======
  Animated,
  ScrollView,
  ActivityIndicator,
>>>>>>> eb4702742df7bbf3424b24535bc27aa5e4e9d7fd
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { global, useThemeColors } from "../styles/global";
import { useDispatch, useSelector } from "react-redux";
import moment from "moment";
import { fetchSales } from "../store/slices/salesSlice";
import { BAR_HEIGHT } from "../styles/global";
<<<<<<< HEAD
import Entypo from '@expo/vector-icons/Entypo';
import TransactionRow from "../components/TransactionRow";
=======
import Entypo from "@expo/vector-icons/Entypo";
>>>>>>> eb4702742df7bbf3424b24535bc27aa5e4e9d7fd

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

  const dispatch = useDispatch();
  const { primaryColor } = useThemeColors();
  const insets = useSafeAreaInsets();
<<<<<<< HEAD
  const SWIPE_THRESHOLD = 50;

  const today = useMemo(() => moment(), []);
=======

  const SCREEN_WIDTH = Dimensions.get("window").width;
  const SWIPE_THRESHOLD = 50;

  const today = useMemo(() => moment().startOf("day"), []);
>>>>>>> eb4702742df7bbf3424b24535bc27aa5e4e9d7fd
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState(today);

  // Shop filter
  const [filterShopId, setFilterShopId] = useState("");

  const staffShops = user?.shops || [];
  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);

  // Fetch sales on component mount
  useEffect(() => {
    dispatch(fetchSales());
  }, [dispatch]);

  // Initialize shop filter based on role
  useEffect(() => {
    if (role === "staff" && staffShops.length > 0) {
      const staffShopId = staffShops[0]?._id || staffShops[0];
      setFilterShopId(staffShopId);
    } else if (shops.length > 0) {
      setFilterShopId(""); // owner default: all shops
    }
  }, [role, shops, staffShops]);

  // Transform sales data into transaction format (include timestamp for grouping)
  const transactions = useMemo(() => {
    if (!sales || sales.length === 0) return [];

    return sales.map((sale) => {
      const createdAtRaw = sale?.created_at;
      const orderDateRaw = sale?.order_date;

      const createdAt = createdAtRaw ? moment(createdAtRaw) : null;
      const orderDate = orderDateRaw ? moment(orderDateRaw) : null;

      const dateForGrouping = (orderDate && orderDate.isValid())
        ? orderDate
        : (createdAt && createdAt.isValid() ? createdAt : moment());

      const timeForDisplay = (createdAt && createdAt.isValid())
        ? createdAt
        : dateForGrouping;

      const customerName = sale.customer_id?.name || 'Walk-in';
      const paymentMethod = sale.payment_method || 'cash';
      const saleShopId = sale.shop_id?._id || sale.shop_id;
      const isECash = paymentMethod === 'upi';
      const type = paymentMethod === 'expense' ? 'expense' : 'income';
      const amount = Number(sale.paid_amount || sale.total_amount || 0);

      // Determine title & subtitle for better row labeling
      let title = 'Sale';
      let subtitle = customerName;

      // If sale is linked to a service, show service title
      if (sale?.service_name) {
        title = 'Service';
        subtitle = sale.service_name;
      }

      // If it's an explicit expense, prefer showing notes or description
      if (paymentMethod === 'expense') {
        title = 'Expense';
        subtitle = sale.notes || sale.service_name || sale.customer_id?.name || 'Expense';
      }

      // If sale has explicit notes and no service_name, use them as subtitle
      if (!sale?.service_name && sale?.notes) {
        subtitle = sale.notes;
      }

      // Compose final description (used in UI)
      const description = `${title} - ${subtitle}`;

      return {
        id: sale._id || sale.id,
        date: dateForGrouping.format('YYYY-MM-DD'),
        datetime: timeForDisplay.toISOString(),
        timestamp: timeForDisplay.valueOf(),
        timeLabel: timeForDisplay.format('h:mm A'),
        type,
        amount,
        title,
        subtitle,
        description,
        category: paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1),
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
<<<<<<< HEAD
            // Swipe right - next week
            setWeekOffset(prev => prev + 1);
          } else {
            // Swipe left - previous week
            setWeekOffset(prev => prev - 1);
=======
            setWeekOffset((prev) => prev - 1);
          } else {
            setWeekOffset((prev) => prev + 1);
>>>>>>> eb4702742df7bbf3424b24535bc27aa5e4e9d7fd
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

<<<<<<< HEAD
      const tDate = moment(t.date, 'YYYY-MM-DD');
      if (tDate.isSameOrBefore(selectedDate, 'day')) {
        if (t.type === 'income') {
          // Use the dedicated cash_paid and online_paid fields
          const cashAmount = t.sale?.cash_paid || 0;
          const onlineAmount = t.sale?.online_paid || 0;
          
          if (cashAmount > 0) {
            // Add cash portion
            balance += cashAmount;
          } else if (t.paymentMethod === 'cash' && cashAmount === 0) {
            // Legacy: Pure cash payment without split fields
            balance += t.amount;
          }
          // For UPI/other non-cash methods, don't add to cash balance
        }
        if (t.type === 'expense') balance -= t.amount;
=======
      const tDate = moment(t.date, "YYYY-MM-DD");
      if (tDate.isSameOrBefore(selectedDate, "day")) {
        if (t.type === "income" && !t.isECash) balance += t.amount;
        if (t.type === "expense") balance -= t.amount;
>>>>>>> eb4702742df7bbf3424b24535bc27aa5e4e9d7fd
      }
    });
    return balance;
  }, [selectedDate, transactions, filterShopId]);

  const eCash = useMemo(() => {
    let eCashBalance = 0;
    transactions.forEach((t) => {
      if (filterShopId && t.shopId !== filterShopId) return;

<<<<<<< HEAD
      // Only count income from non-cash payment methods
      if (t.type === 'income') {
        const tDate = moment(t.date, 'YYYY-MM-DD');
        if (tDate.isSameOrBefore(selectedDate, 'day')) {
          // Use the dedicated online_paid field
          const onlineAmount = t.sale?.online_paid || 0;
          
          if (onlineAmount > 0) {
            // Add online portion
            eCashBalance += onlineAmount;
          } else if ((t.paymentMethod === 'upi' || t.isECash) && onlineAmount === 0) {
            // Legacy: Pure online payment without split fields
            eCashBalance += t.amount;
          }
          // For cash-only payments, don't add to e-cash balance
=======
      if (t.type === "income" && t.isECash) {
        const tDate = moment(t.date, "YYYY-MM-DD");
        if (tDate.isSameOrBefore(selectedDate, "day")) {
          eCashBalance += t.amount;
>>>>>>> eb4702742df7bbf3424b24535bc27aa5e4e9d7fd
        }
      }
    });
    return eCashBalance;
  }, [selectedDate, transactions, filterShopId]);

<<<<<<< HEAD
=======
  const isLoading = salesStatus === "loading";
  const totalItems = sections.length;

  const renderTransactionItem = ({ item }) => {
    const bgColor = item.type === "income" ? "#e9f7ef" : "#fff5f5";
    const accent = item.type === "income" ? "#2ecc71" : "#e74c3c";
    const { cash: cashAmount, ecash: ecashAmount } = computeSplitAmounts(
      item.sale
    );
    const isSplitPayment =
      (cashAmount > 0 && ecashAmount > 0) ||
      (Array.isArray(item.sale?.payment_breakdown) &&
        item.sale?.payment_breakdown.length > 1);
    const sign = item.type === "income" ? "+" : "-";

    return (
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: bgColor,
          borderRadius: 8,
          padding: 10,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 11, color: "#999", marginBottom: 2 }}>
            {item.timeLabel}
          </Text>
          <Text style={[global.txnTitle, { marginBottom: 4 }]}>
            {item.description}
          </Text>
          <Text style={[global.txnSubtitle, { color: "#666" }]}>
            {item.category} · {item.type === "income" ? "Income" : "Expense"}
          </Text>
        </View>

        <View style={{ alignItems: "center", minWidth: 90 }}>
          {isSplitPayment ? (
            <View
              style={{
                backgroundColor: "transparent",
                flexDirection: "row",
                gap: 10,
              }}
            >
              {cashAmount > 0 && (
                <View style={{ alignItems: "center", marginBottom: 6 }}>
                  <Text
                    style={{ color: accent, fontWeight: "700", fontSize: 13 }}
                  >
                    {sign}₹{cashAmount.toFixed(2)}
                  </Text>
                  <Text style={{ color: "#888", fontSize: 11, marginTop: 2 }}>
                    Cash
                  </Text>
                </View>
              )}
              {ecashAmount > 0 && (
                <View style={{ alignItems: "center", marginBottom: 6 }}>
                  <Text
                    style={{ color: accent, fontWeight: "700", fontSize: 13 }}
                  >
                    {sign}₹{ecashAmount.toFixed(2)}
                  </Text>
                  <Text style={{ color: "#888", fontSize: 11, marginTop: 2 }}>
                    E-Cash
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <View
              style={{
                alignItems: "center",
                backgroundColor: "transparent",
                paddingHorizontal: 6,
              }}
            >
              <Text style={{ color: accent, fontWeight: "700", fontSize: 14 }}>
                {sign}₹{item.amount.toFixed(2)}
              </Text>
              <Text style={{ color: "#888", fontSize: 11, marginTop: 2 }}>
                {item.paymentMethod === "cash"
                  ? "Cash"
                  : item.paymentMethod === "upi"
                  ? "E-Cash"
                  : item.paymentMethod}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const TransactionRow = ({ item }) => {
    const dispatchLocal = useDispatch();
    const translateX = useRef(new Animated.Value(0)).current;

    const pan = useRef(
      PanResponder.create({
        onMoveShouldSetPanResponder: (evt, gestureState) => {
          return (
            Math.abs(gestureState.dx) > Math.abs(gestureState.dy) &&
            Math.abs(gestureState.dx) > 5
          );
        },
        onPanResponderMove: (evt, gestureState) => {
          if (gestureState.dx < 0) {
            translateX.setValue(gestureState.dx);
          }
        },
        onPanResponderRelease: (evt, gestureState) => {
          const dx = gestureState.dx;
          if (dx < -SWIPE_THRESHOLD) {
            Alert.alert(
              "Delete Transaction",
              "Do you want delete?",
              [
                {
                  text: "Cancel",
                  style: "cancel",
                  onPress: () => {
                    Animated.spring(translateX, {
                      toValue: 0,
                      useNativeDriver: true,
                    }).start();
                  },
                },
                {
                  text: "Delete",
                  style: "destructive",
                  onPress: () => {
                    Animated.timing(translateX, {
                      toValue: -SCREEN_WIDTH,
                      duration: 200,
                      useNativeDriver: true,
                    }).start(async () => {
                      try {
                        const id = item.id || item._id;
                        const serviceId =
                          item.sale?.service_id?._id || item.sale?.service_id;

                        await dispatchLocal(deleteSale(id)).unwrap();

                        if (serviceId) {
                          try {
                            await dispatchLocal(fetchSales()).unwrap();
                            const serviceState = await dispatchLocal(
                              fetchServices()
                            ).unwrap();
                            const updatedService = serviceState.find(
                              (s) => s._id === serviceId
                            );
                            if (updatedService) {
                              const totalAmount =
                                updatedService.total_amount || 0;
                              const cashPaid =
                                updatedService.amount_in_cash || 0;
                              const ecashPaid =
                                updatedService.amount_in_ecash || 0;
                              const totalPaid = cashPaid + ecashPaid;
                              const newBalance = totalAmount - totalPaid;
                              await dispatchLocal(
                                updateService({
                                  serviceId: serviceId,
                                  serviceData: {
                                    ...updatedService,
                                    balance: newBalance,
                                  },
                                })
                              ).unwrap();
                            }
                          } catch (serviceErr) {
                            console.error(
                              "Error updating service balance:",
                              serviceErr
                            );
                          }
                        } else {
                          dispatchLocal(fetchSales());
                        }
                      } catch (err) {
                        console.error("Delete sale error:", err);
                      }
                    });
                  },
                },
              ],
              { cancelable: true }
            );
          } else {
            Animated.spring(translateX, {
              toValue: 0,
              useNativeDriver: true,
            }).start();
          }
        },
      })
    ).current;

    return (
      <View
        style={{
          marginVertical: 6,
          marginHorizontal: 4,
          borderRadius: 8,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            position: "absolute",
            right: 0,
            left: 0,
            top: 0,
            bottom: 0,
            borderRadius: 8,
            backgroundColor: "#ffecec",
            justifyContent: "center",
            alignItems: "flex-end",
            paddingRight: 20,
          }}
        >
          <Text style={{ color: "", fontWeight: "600" }}>Delete</Text>
        </View>

        <Animated.View
          {...pan.panHandlers}
          style={{ transform: [{ translateX }], width: "100%" }}
        >
          {renderTransactionItem({ item })}
        </Animated.View>
      </View>
    );
  };

  const chipBaseStyle = {
    marginRight: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 99,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  };

>>>>>>> eb4702742df7bbf3424b24535bc27aa5e4e9d7fd
  return (
    <SafeAreaView style={global.safeArea}>
      <StatusBar
        className="statusBarStyleHomeScreen"
        barStyle="dark-content"
        backgroundColor="#fff"
      />
      {/* Navbar */}
      <View style={{ ...global.navbarContainer, paddingTop: 2, elevation: 0 }}>
        <Text numberOfLines={2} style={global.navbarName}>
          {username}{" "}
          <Text style={{ ...global.navbarRole, color: primaryColor }}>
            {role || "User"}
          </Text>
        </Text>

        <View style={global.navbarRight}>
          <Text style={global.navbarDate}>{formattedDate}</Text>
        </View>
      </View>
      <View style={global.container}>
        {/* Income / Expense summary - Row 1 */}
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}>
          <View style={[global.summaryBox, global.summaryIncome, { flex: 1 }]}>
            <Text style={global.summaryLabel}>Income</Text>
            <Text style={global.summaryValue}>₹{totalIncome}</Text>
          </View>
          <View style={[global.summaryBox, global.summaryExpense, { flex: 1 }]}>
            <Text style={global.summaryLabel}>Expense</Text>
            <Text style={global.summaryValue}>₹{totalExpense}</Text>
          </View>
        </View>

        {/* Cash on Hand / E-Cash summary - Row 2 */}
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}>
          <View style={[global.summaryBox, global.summaryCash, { flex: 1 }]}>
            <Text style={global.summaryLabel}>Cash on Hand</Text>
            <Text style={global.summaryValue}>₹{cashOnHand.toFixed(2)}</Text>
          </View>
<<<<<<< HEAD
          <View style={[global.summaryBox, { flex: 1 }]}>
=======
          <View
            style={[
              global.summaryBox,
              { borderLeftWidth: 4, borderLeftColor: "#3498db", flex: 1 },
            ]}
          >
>>>>>>> eb4702742df7bbf3424b24535bc27aa5e4e9d7fd
            <Text style={global.summaryLabel}>E-Cash</Text>
            <Text style={global.summaryValue}>₹{eCash.toFixed(2)}</Text>
          </View>
        </View>

        {/* Week date row (swipeable) */}
        <View style={[global.swipeArea, { padding: 8, justifyContent: 'center' }]} {...panResponder.panHandlers}>
          {weekDates.map((day) => {
            const isFuture = day.isAfter(today, "day");
            const isSelected = selectedDate.isSame(day, "day");

            return (
              <TouchableOpacity
                key={day.format("YYYY-MM-DD")}
                style={[
                  global.dateItem,
                  isSelected && !isFuture && global.selectedDateItem,
                  isFuture && global.disabledDateItem,
                ]}
                disabled={isFuture}
                onPress={() => !isFuture && setSelectedDate(day)}
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
                  chipBaseStyle,
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
                      chipBaseStyle,
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
