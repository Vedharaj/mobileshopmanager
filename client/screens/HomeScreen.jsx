// HomeScreen.jsx
import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  Alert,
  PanResponder,
  Dimensions,
  SectionList,
  Animated,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { global, useThemeColors } from "../styles/global";
import { useDispatch, useSelector } from "react-redux";
import moment from "moment";
import { fetchSales, deleteSale } from "../store/slices/salesSlice";
import { updateService, fetchServices } from "../store/slices/serviceSlice";
import { BAR_HEIGHT } from "../styles/global";
import Entypo from '@expo/vector-icons/Entypo';

const getWeekDates = (weekOffset = 0) => {
  const startOfWeek = moment().startOf('week').add(weekOffset, 'weeks');
  return Array(7)
    .fill(0)
    .map((_, i) => startOfWeek.clone().add(i, 'days'));
};

export default function HomeScreen({ navigation }) {
  const { role, username, user } = useSelector((state) => state.auth);
  const { shops } = useSelector((state) => state.shops);
  const { sales, status: salesStatus } = useSelector((state) => state.sales);
  const dispatch = useDispatch();
  const { primaryColor } = useThemeColors();
  const insets = useSafeAreaInsets();

  const SCREEN_WIDTH = Dimensions.get('window').width;
  const SWIPE_THRESHOLD = 50;

  const today = useMemo(() => moment().startOf('day'), []);
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
      const saleMoment = moment(sale.order_date || sale.created_at);
      const customerName = sale.customer_id?.name || 'Walk-in';
      const paymentMethod = sale.payment_method || 'cash';
      const saleShopId = sale.shop_id?._id || sale.shop_id;
      const isECash = paymentMethod === 'upi' || paymentMethod === 'multiple';
      const type = paymentMethod === 'expense' ? 'expense' : 'income';

      return {
        id: sale._id || sale.id,
        date: saleMoment.format('YYYY-MM-DD'),
        datetime: saleMoment.toISOString(),
        timestamp: saleMoment.valueOf(),
        timeLabel: saleMoment.format('h:mm A'),
        type: type,
        amount: sale.paid_amount || sale.total_amount || 0,
        description: `Sale - ${customerName}`,
        category: paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1),
        shopId: saleShopId,
        paymentMethod: paymentMethod,
        isECash: isECash,
        sale: sale, // Keep reference to original sale data
      };
    });
  }, [sales]);

  // PanResponder for swipe gestures
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 10;
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (Math.abs(gestureState.dx) > SWIPE_THRESHOLD) {
          if (gestureState.dx > 0) {
            // Swipe right - previous week
            setWeekOffset(prev => prev - 1);
          } else {
            // Swipe left - next week
            setWeekOffset(prev => prev + 1);
          }
        }
      },
    })
  ).current;

  // Formatted date for navbar
  const formattedDate = useMemo(() => {
    return selectedDate.format('DD MMM YYYY');
  }, [selectedDate]);

  const currentMonthLabel = useMemo(() => {
    const mid = weekDates[3] || today;
    return mid.format('MMMM YYYY');
  }, [weekDates, today]);

  // calculate income / expense summary for selected date
  const { totalIncome, totalExpense } = useMemo(() => {
    const selDateStr = selectedDate.format('YYYY-MM-DD');
    let inc = 0;
    let exp = 0;

    transactions.forEach((t) => {
      // Filter by shop if filterShopId is set
      if (filterShopId && t.shopId !== filterShopId) return;

      if (t.date === selDateStr) {
        if (t.type === 'income') inc += t.amount;
        if (t.type === 'expense') exp += t.amount;
      }
    });

    return { totalIncome: inc, totalExpense: exp };
  }, [selectedDate, transactions, filterShopId]);

  // Group transactions for selected date + shop filter into 1-hour buckets (recent-first)
  // Returns sections suitable for SectionList: { title, data: [...] }
  const sections = useMemo(() => {
    const selDateStr = selectedDate.format('YYYY-MM-DD');

    // filter for selected date and shop
    const list = transactions
      .filter((t) => t.date === selDateStr)
      .filter((t) => (filterShopId ? t.shopId === filterShopId : true))
      .sort((a, b) => b.timestamp - a.timestamp); // recent first

    if (list.length === 0) return [];

    const groups = [];
    let currentGroup = { label: list[0].timeLabel, items: [list[0]] };

    for (let i = 1; i < list.length; i++) {
      const prev = list[i - 1];
      const cur = list[i];
      const diffMs = Math.abs(prev.timestamp - cur.timestamp);
      const diffHours = diffMs / (1000 * 60 * 60);

      // If gap <= 1 hour, put in same group, else create new group using current item's time
      if (diffHours <= 1) {
        currentGroup.items.push(cur);
      } else {
        groups.push(currentGroup);
        currentGroup = { label: cur.timeLabel, items: [cur] };
      }
    }
    groups.push(currentGroup);

    // Build SectionList sections: "10:30 AM · N txns"
    return groups.map((g) => ({
      title: `${g.label} · ${g.items.length} txns`,
      data: g.items,
    }));
  }, [selectedDate, filterShopId, transactions]);

  const cashOnHand = useMemo(() => {
    let balance = 0;
    transactions.forEach((t) => {
      // Filter by shop if filterShopId is set
      if (filterShopId && t.shopId !== filterShopId) return;

      const tDate = moment(t.date, 'YYYY-MM-DD');
      if (tDate.isSameOrBefore(selectedDate, 'day')) {
        // Only add CASH income (not e-cash/upi)
        if (t.type === 'income' && !t.isECash) balance += t.amount;
        if (t.type === 'expense') balance -= t.amount;
      }
    });
    return balance;
  }, [selectedDate, transactions, filterShopId]);

  // Calculate e-cash (electronic cash from non-cash payment methods)
  const eCash = useMemo(() => {
    let eCashBalance = 0;
    transactions.forEach((t) => {
      // Filter by shop if filterShopId is set
      if (filterShopId && t.shopId !== filterShopId) return;

      // Only count income from non-cash payment methods
      if (t.type === 'income' && t.isECash) {
        const tDate = moment(t.date, 'YYYY-MM-DD');
        if (tDate.isSameOrBefore(selectedDate, 'day')) {
          eCashBalance += t.amount;
        }
      }
    });
    return eCashBalance;
  }, [selectedDate, transactions, filterShopId]);


  const renderTransactionItem = ({ item }) => {
    const bgColor = item.type === 'income' ? '#e9f7ef' : '#fff5f5';
    const accent = item.type === 'income' ? '#2ecc71' : '#e74c3c';
    
    // Check if this is a split payment (multiple payment methods)
    const cashAmount = item.sale?.amount_in_cash || 0;
    const ecashAmount = item.sale?.amount_in_ecash || 0;
    const isSplitPayment = 
      (cashAmount > 0 && ecashAmount > 0) || 
      item.sale?.payment_breakdown ||
      (item.paymentMethod === 'multiple');

    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: bgColor, borderRadius: 8, padding: 10 }}>
        <View style={{ flex: 1 }}>
          <Text style={[global.txnTitle, { marginBottom: 4 }]}>{item.description}</Text>
          <Text style={[global.txnSubtitle, { color: '#666' }]}>
            {item.category} · {item.type === 'income' ? 'Income' : 'Expense'}
          </Text>
        </View>

        <View style={{ alignItems: 'flex-end' }}>
          {isSplitPayment ? (
            // Show split amounts for mixed payments
            <View style={{ backgroundColor: 'transparent' }}>
              {cashAmount > 0 && (
                <Text style={{ color: accent, fontWeight: '700', fontSize: 13, marginBottom: 2 }}>
                  {item.type === 'income' ? '+' : '-'}₹{cashAmount.toFixed(2)} 💵
                </Text>
              )}
              {ecashAmount > 0 && (
                <Text style={{ color: accent, fontWeight: '700', fontSize: 13 }}>
                  {item.type === 'income' ? '+' : '-'}₹{ecashAmount.toFixed(2)} 💳
                </Text>
              )}
              {cashAmount === 0 && ecashAmount === 0 && (
                <Text style={{ color: accent, fontWeight: '700', fontSize: 14 }}>
                  {item.type === 'income' ? '+' : '-'}₹{item.amount.toFixed(2)}
                </Text>
              )}
            </View>
          ) : (
            // Show combined amount
            <View style={{ backgroundColor: 'transparent', paddingHorizontal: 6 }}>
              <Text
                style={{ color: accent, fontWeight: '700', fontSize: 14 }}
              >
                {item.type === 'income' ? '+' : '-'}₹{item.amount.toFixed(2)}
              </Text>
            </View>
          )}
          <View style={{ marginTop: 6 }}>
            <Text style={{ fontSize: 11, color: '#999' }}>{item.timeLabel}</Text>
          </View>
        </View>
      </View>
    );
  };

  // TransactionRow: Animated swipe-left to delete
  const TransactionRow = ({ item }) => {
    const dispatchLocal = useDispatch();
    const translateX = useRef(new Animated.Value(0)).current;
    const swipedRef = useRef(false);

    const pan = useRef(
      PanResponder.create({
        onMoveShouldSetPanResponder: (evt, gestureState) => {
          return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 5;
        },
        onPanResponderMove: (evt, gestureState) => {
          // only allow left swipe (negative dx)
          if (gestureState.dx < 0) {
            translateX.setValue(gestureState.dx);
          }
        },
        onPanResponderRelease: (evt, gestureState) => {
          const dx = gestureState.dx;
          if (dx < -SWIPE_THRESHOLD) {
            // Ask for confirmation before deleting
            Alert.alert(
              'Delete Transaction',
              'Do you want delete?',
              [
                {
                  text: 'Cancel', style: 'cancel', onPress: () => {
                    // snap back
                    Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
                  }
                },
                {
                  text: 'Delete', style: 'destructive', onPress: () => {
                    // animate item offscreen to left then delete
                    Animated.timing(translateX, {
                      toValue: -SCREEN_WIDTH,
                      duration: 200,
                      useNativeDriver: true,
                    }).start(async () => {
                      try {
                        const id = item.id || item._id;
                        const serviceId = item.sale?.service_id?._id || item.sale?.service_id;
                        
                        // Delete the sale transaction
                        await dispatchLocal(deleteSale(id)).unwrap();
                        
                        // If this transaction was linked to a service, update the service balance
                        if (serviceId) {
                          try {
                            // Fetch all sales to recalculate which ones are still linked to this service
                            await dispatchLocal(fetchSales()).unwrap();
                            
                            // Fetch services to get the current service details
                            const serviceState = await dispatchLocal(fetchServices()).unwrap();
                            
                            // Find the service and recalculate its balance
                            const updatedService = serviceState.find(s => s._id === serviceId);
                            if (updatedService) {
                              const totalAmount = updatedService.total_amount || 0;
                              const cashPaid = updatedService.amount_in_cash || 0;
                              const ecashPaid = updatedService.amount_in_ecash || 0;
                              const totalPaid = cashPaid + ecashPaid;
                              const newBalance = totalAmount - totalPaid;
                              
                              // Update service with new balance
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
                            console.error('Error updating service balance:', serviceErr);
                          }
                        } else {
                          // No service linked, just refresh sales
                          dispatchLocal(fetchSales());
                        }
                      } catch (err) {
                        console.error('Delete sale error:', err);
                      }
                    });
                  }
                }
              ],
              { cancelable: true }
            );
          } else {
            // snap back
            Animated.spring(translateX, {
              toValue: 0,
              useNativeDriver: true,
            }).start();
          }
        },
      })
    ).current;

    return (
      <View style={{ marginVertical: 6, marginHorizontal: 4, borderRadius: 8, overflow: 'hidden' }}>
        {/* Delete background */}
        <View style={{ position: 'absolute', right: 0, left: 0, top: 0, bottom: 0,  borderRadius: 8, backgroundColor: '#ffecec', justifyContent: 'center', alignItems: 'flex-end', paddingRight: 20 }}>
          <Text style={{ color: '', fontWeight: '600' }}>Delete</Text>
        </View>

        <Animated.View
          {...pan.panHandlers}
          style={{ transform: [{ translateX }], width: '100%' }}
        >
          {renderTransactionItem({ item })}
        </Animated.View>
      </View>
    );
  };

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
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
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
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
          <View style={[global.summaryBox, global.summaryCash, { flex: 1 }]}>
            <Text style={global.summaryLabel}>Cash on Hand</Text>
            <Text style={global.summaryValue}>₹{cashOnHand}</Text>
          </View>
          <View style={[global.summaryBox, { borderLeftWidth: 4, borderLeftColor: '#3498db', flex: 1 }]}>
            <Text style={global.summaryLabel}>E-Cash</Text>
            <Text style={global.summaryValue}>₹{eCash}</Text>
          </View>
        </View>

        {/* Week date row (swipeable) */}
        <View style={global.swipeArea} {...panResponder.panHandlers}>
          {weekDates.map((day) => {
            const isFuture = day.isAfter(today, 'day');
            const isSelected = selectedDate.isSame(day, 'day');

            return (
              <TouchableOpacity
                key={day.format('YYYY-MM-DD')}
                style={[
                  global.dateItem,
                  isSelected && !isFuture && global.selectedDateItem,
                  isFuture && global.disabledDateItem,
                ]}
                disabled={isFuture}
                onPress={() => !isFuture && setSelectedDate(day)}
              >
                <Text style={global.dayLabel}>{day.format('ddd')}</Text>
                <Text style={global.dateLabel}>{day.format('DD')}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Shop filter chips */}
        {role !== "staff" && shops.length > 0 && (
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 8,
              marginTop: 8,
              marginBottom: 10,
            }}
          >
            <TouchableOpacity
              onPress={() => setFilterShopId("")}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: filterShopId === "" ? primaryColor : "#ccc",
                backgroundColor: filterShopId === "" ? primaryColor : "#fff",
              }}
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
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: isActive ? primaryColor : "#ccc",
                    backgroundColor: isActive ? primaryColor : "#fff",
                  }}
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
          </View>
        )}

        {/* Transaction history */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <Text style={global.sectionTitle}>Transaction History</Text>
          <TouchableOpacity
            onPress={() => {
              navigation.navigate('Transaction');
            }}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 8,
              backgroundColor: primaryColor,
            }}
          >
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>
              <Entypo name="plus" size={16} color="white" />
              Add
            </Text>
          </TouchableOpacity>
        </View>

        {salesStatus === 'loading' ? (
          <Text style={global.emptyText}>Loading sales...</Text>
        ) : (() => {
          const totalItems = sections.reduce((acc, s) => acc + (s.data?.length || 0), 0);
          if (totalItems === 0) return <Text style={global.emptyText}>No transactions for this date.</Text>;

          return (
            <SectionList
              sections={sections}
              keyExtractor={(item, index) => {
                // Ensure uniqueness even if backend returns duplicate ids
                const base = (item.id || item._id || item.datetime || index).toString();
                return `${base}-${index}`;
              }}
              renderSectionHeader={({ section }) => (
                <View style={{ alignItems: 'center', marginVertical: 6 }}>
                  <Text style={{ color: primaryColor, fontWeight: '600' }}>{section.title}</Text>
                </View>
              )}
              renderItem={({ item }) => (
                <TransactionRow item={item} />
              )}
              contentContainerStyle={{ paddingBottom: Math.round(BAR_HEIGHT + (insets.bottom || 0) + 16) }}
            />
          );
        })()}

      </View>
    </SafeAreaView>
  );
}
