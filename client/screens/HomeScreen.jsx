// HomeScreen.jsx
import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  PanResponder,
  Dimensions,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { global, useThemeColors } from "../styles/global";
import { useDispatch, useSelector } from "react-redux";
import moment from "moment";
import { fetchSales } from "../store/slices/salesSlice";

const getWeekDates = (weekOffset = 0) => {
  const startOfWeek = moment().startOf('week').add(weekOffset, 'weeks');
  return Array(7)
    .fill(0)
    .map((_, i) => startOfWeek.clone().add(i, 'days'));
};

export default function HomeScreen() {
  const { role, username, user } = useSelector((state) => state.auth);
  const { shops } = useSelector((state) => state.shops);
  const { sales, status: salesStatus } = useSelector((state) => state.sales);
  const dispatch = useDispatch();
  const { primaryColor } = useThemeColors();

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

  // Transform sales data into transaction format
  const transactions = useMemo(() => {
    if (!sales || sales.length === 0) return [];
    
    return sales.map((sale) => {
      const saleDate = moment(sale.order_date || sale.created_at);
      const customerName = sale.customer_id?.name || 'Walk-in';
      const paymentMethod = sale.payment_method || 'cash';
      const saleShopId = sale.shop_id?._id || sale.shop_id;
      const isECash = paymentMethod !== 'cash'; // e-cash is non-cash payments
      
      return {
        id: sale._id || sale.id,
        date: saleDate.format('YYYY-MM-DD'),
        type: 'income', // Sales are income
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

  // filtered transactions list for selected date + shop filter
  const filteredTransactions = useMemo(() => {
    const selDateStr = selectedDate.format('YYYY-MM-DD');

    return transactions.filter((t) => {
      if (t.date !== selDateStr) return false;
      
      // Filter by shop if filterShopId is set
      if (filterShopId && t.shopId !== filterShopId) return false;

      return true;
    });
  }, [selectedDate, filterShopId, transactions]);

  const cashOnHand = useMemo(() => {
    let balance = 0;
    transactions.forEach((t) => {
      // Filter by shop if filterShopId is set
      if (filterShopId && t.shopId !== filterShopId) return;
      
      const tDate = moment(t.date, 'YYYY-MM-DD');
      if (tDate.isSameOrBefore(selectedDate, 'day')) {
        if (t.type === 'income') balance += t.amount;
        if (t.type === 'expense') balance -= t.amount;
        if (t.paymentMethod === 'upi') balance -= t.amount;
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


  const renderTransactionItem = ({ item }) => (
    <View style={global.txnItem}>
      <View style={{ flex: 1 }}>
        <Text style={global.txnTitle}>{item.description}</Text>
        <Text style={global.txnSubtitle}>
          {item.category} · {item.type === 'income' ? 'Income' : 'Expense'}
        </Text>
      </View>
      <Text
        style={[
          global.txnAmount,
          item.type === 'income' ? global.txnIncome : global.txnExpense,
        ]}
      >
        {item.type === 'income' ? '+' : '-'}₹{item.amount}
      </Text>
    </View>
  );

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
          {username}
          <Text style={{ ...global.navbarRole, color: primaryColor }}>
            {role || "User"}
          </Text>
        </Text>

        <View style={global.navbarRight}>
          <Text style={global.navbarDate}>{formattedDate}</Text>
        </View>
      </View>
      <View style={global.container}>

      {/* Income / Expense / Cash / E-Cash summary row */}
      <View style={global.summaryRow}>
        <View style={[global.summaryBox, global.summaryIncome]}>
          <Text style={global.summaryLabel}>Income</Text>
          <Text style={global.summaryValue}>₹{totalIncome}</Text>
        </View>
        <View style={[global.summaryBox, global.summaryExpense]}>
          <Text style={global.summaryLabel}>Expense</Text>
          <Text style={global.summaryValue}>₹{totalExpense}</Text>
        </View>
        <View style={[global.summaryBox, global.summaryCash]}>
          <Text style={global.summaryLabel}>Cash on Hand</Text>
          <Text style={global.summaryValue}>₹{cashOnHand}</Text>
        </View>
        <View style={[global.summaryBox, { borderLeftWidth: 4, borderLeftColor: '#3498db' }]}>
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
            console.log('Transaction history button clicked');
            // TODO: Add action for button
          }}
          style={{
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 8,
            backgroundColor: primaryColor,
          }}
        >
          <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>
           Add
          </Text>
        </TouchableOpacity>
      </View>

      {salesStatus === 'loading' ? (
        <Text style={global.emptyText}>Loading sales...</Text>
      ) : filteredTransactions.length === 0 ? (
        <Text style={global.emptyText}>No transactions for this date.</Text>
      ) : (
        <FlatList
          data={filteredTransactions}
          keyExtractor={(item) => item.id}
          renderItem={renderTransactionItem}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}

    </View>
    </SafeAreaView>
  );
}
