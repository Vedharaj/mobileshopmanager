import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, Platform, Dimensions, ScrollView } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { global } from '../styles/global';
import { LineChart, PieChart, BarChart } from 'react-native-chart-kit';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSales } from '../store/slices/salesSlice';

const StatsScreen = () => {
  const toDateInit = new Date();
  const fromDateInit = new Date(toDateInit.getFullYear(), toDateInit.getMonth() - 1, toDateInit.getDate());
  
  const [fromDate, setFromDate] = useState(fromDateInit);
  const [toDate, setToDate] = useState(toDateInit);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const dispatch = useDispatch();
  const { sales = [] } = useSelector((state) => state.sales || {});

  const fmt = (d) => {
    try {
      return d.toLocaleDateString('en-IN');
    } catch {
      return new Date().toLocaleDateString('en-IN');
    }
  };

  const onChangeFrom = (event, selectedDate) => {
    setShowFromPicker(Platform.OS === 'ios');
    if (selectedDate) {
      const nextFrom = selectedDate;
      let nextTo = toDate;
      if (nextFrom > nextTo) nextTo = nextFrom;
      setFromDate(nextFrom);
      setToDate(nextTo);
    }
  };

  const onChangeTo = (event, selectedDate) => {
    setShowToPicker(Platform.OS === 'ios');
    if (selectedDate) {
      const nextTo = selectedDate;
      let nextFrom = fromDate;
      if (nextTo < nextFrom) nextFrom = nextTo;
      setToDate(nextTo);
      setFromDate(nextFrom);
    }
  };

  useEffect(() => {
    if (!sales || sales.length === 0) {
      dispatch(fetchSales());
    }
  }, [dispatch]);

  const daysInRange = useMemo(() => {
    const start = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
    const end = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate());
    const out = [];
    let d = new Date(start);
    while (d <= end) {
      out.push(new Date(d));
      d.setDate(d.getDate() + 1);
    }
    return out;
  }, [fromDate, toDate]);

  const dailyTotals = useMemo(() => {
    const salesTotals = Array(daysInRange.length).fill(0);
    const expenseTotals = Array(daysInRange.length).fill(0);

    if (!Array.isArray(sales) || sales.length === 0) {
      return { salesTotals, expenseTotals };
    }

    const indexByDate = new Map(
      daysInRange.map((d, idx) => [new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(), idx])
    );

    for (const s of sales) {
      const when = s.order_date || s.createdAt || s.created_at;
      if (!when) continue;
      const d = new Date(when);
      const dayKey = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      const idx = indexByDate.get(dayKey);
      if (idx === undefined) continue;

      const amount = Number(s.total_amount || s.paid_amount || 0) || 0;
      if (s.type === 'sales') {
        salesTotals[idx] += amount;
      } else if (s.type === 'add_expense') {
        expenseTotals[idx] += amount;
      }
    }

    return { salesTotals, expenseTotals };
  }, [sales, daysInRange]);

  const labels = useMemo(() => {
    if (daysInRange.length === 0) return [];
    return daysInRange.map((_, i) => (i === 0 ? fmt(daysInRange[0]) : i === daysInRange.length - 1 ? fmt(daysInRange[daysInRange.length - 1]) : ''));
  }, [daysInRange]);

  const productSoldCounts = useMemo(() => {
    const counts = new Map();

    if (!Array.isArray(sales) || sales.length === 0) {
      return [];
    }

    const indexByDate = new Map(
      daysInRange.map((d, idx) => [new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(), idx])
    );

    for (const s of sales) {
      if (s.type !== 'sales') continue;
      const when = s.order_date || s.createdAt || s.created_at;
      if (!when) continue;
      const d = new Date(when);
      const dayKey = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      if (!indexByDate.has(dayKey)) continue;

      if (Array.isArray(s.items)) {
        for (const item of s.items) {
          const productName = item.product_id?.name || item.name || 'Unknown';
          const qty = Number(item.quantity || 0) || 0;
          counts.set(productName, (counts.get(productName) || 0) + qty);
        }
      }
    }

    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [sales, daysInRange]);

  const pieChartData = useMemo(() => {
    const colors = [
      '#2563eb', // blue
      '#dc2626', // red
      '#16a34a', // green
      '#ea580c', // orange
      '#7c3aed', // purple
      '#db2777', // pink
      '#0891b2', // cyan
      '#4f46e5', // indigo
      '#84cc16', // lime
      '#2d6707ff', // rose
      '#0ea5e9', // sky
      '#f59e0b', // amber
    ];
    return productSoldCounts.map((item, idx) => ({
      name: `${item.name} (${item.count})`,
      population: item.count,
      color: colors[idx % colors.length],
      legendFontColor: '#333',
      legendFontSize: 10,
    }));
  }, [productSoldCounts]);

  const chartWidth = Math.min(Dimensions.get('window').width - 32, 900);
  const chartHeight = 220;

  const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weekdaySalesCounts = useMemo(() => {
    const counts = Array(7).fill(0);

    if (!Array.isArray(sales) || sales.length === 0) return counts;

    const start = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate()).getTime();
    const end = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate()).getTime();

    for (const s of sales) {
      if (s.type !== 'sales') continue;
      const when = s.order_date || s.createdAt || s.created_at;
      if (!when) continue;
      const d = new Date(when);
      const dayTime = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      if (dayTime < start || dayTime > end) continue;
      counts[d.getDay()] += 1;
    }

    return counts;
  }, [sales, fromDate, toDate]);

  return (
    <View style={[global.container, { flex: 1 }]}>
      <View style={{ paddingHorizontal: 16, paddingTop: 16, flexDirection: 'row', gap: 10, marginBottom: 12 }}>
        <TouchableOpacity
          style={{ flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, backgroundColor: '#fff' }}
          onPress={() => setShowFromPicker(true)}
        >
          <Text style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>From</Text>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#333' }}>{fmt(fromDate)}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, backgroundColor: '#fff' }}
          onPress={() => setShowToPicker(true)}
        >
          <Text style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>To</Text>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#333' }}>{fmt(toDate)}</Text>
        </TouchableOpacity>
      </View>

      {showFromPicker && (
        <DateTimePicker
          value={fromDate}
          mode="date"
          display="default"
          onChange={onChangeFrom}
          maximumDate={toDate}
        />
      )}
      {showToPicker && (
        <DateTimePicker
          value={toDate}
          mode="date"
          display="default"
          onChange={onChangeTo}
          minimumDate={fromDate}
        />
      )}

      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80 }}>
        {daysInRange.length > 0 && (
          <View style={{ marginTop: 12 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 10 }}>Sales by Day</Text>
            <LineChart
              data={{
                labels,
                datasets: [
                  {
                    data: dailyTotals.salesTotals,
                    color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`, // green
                    strokeWidth: 2,
                  },
                ],
              }}
              width={chartWidth}
              height={chartHeight}
              yAxisSuffix=""
              yAxisInterval={1}
              chartConfig={{
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#ffffff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(51, 65, 85, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
                propsForDots: { r: '3' },
                propsForBackgroundLines: { strokeDasharray: '4 6' },
              }}
              bezier
              style={{ borderRadius: 8 }}
            />
          </View>
        )}

        <View style={{ marginTop: 20 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 10 }}>Expenses by Day</Text>
          <LineChart
            data={{
              labels,
              datasets: [
                {
                  data: dailyTotals.expenseTotals,
                  color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`, // red
                  strokeWidth: 2,
                },
              ],
            }}
            width={chartWidth}
            height={chartHeight}
            yAxisSuffix=""
            yAxisInterval={1}
            chartConfig={{
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(51, 65, 85, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
              propsForDots: { r: '3' },
              propsForBackgroundLines: { strokeDasharray: '4 6' },
            }}
            bezier
            style={{ borderRadius: 8 }}
          />
        </View>

        <View style={{ marginTop: 20 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 10 }}>Sales Count by Weekday</Text>
          <BarChart
            data={{
              labels: weekdayLabels,
              datasets: [{ data: weekdaySalesCounts }],
            }}
            width={chartWidth}
            height={chartHeight}
            yAxisLabel=""
            yAxisSuffix=""
            fromZero
            showValuesOnTopOfBars
            chartConfig={{
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(51, 65, 85, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
              propsForBackgroundLines: { strokeDasharray: '4 6' },
              fillShadowGradientOpacity: 0.9,
              fillShadowGradient: '#3b82f6',
            }}
            style={{ borderRadius: 8 }}
          />
        </View>

        {productSoldCounts.length > 0 && (
          <View style={{ marginTop: 20 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 10 }}>Products Sold by Count</Text>
            <View style={{ alignItems: 'center' }}>
              <PieChart
                data={pieChartData}
                width={chartWidth}
                height={220}
                chartConfig={{
                  color: (opacity = 1) => `rgba(51, 65, 85, ${opacity})`,
                }}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute
              />
            </View>
            <View style={{ marginTop: 10, paddingHorizontal: 4, marginBottom: 20 }}>
              {productSoldCounts.map((item, idx) => (
                <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                  <Text style={{ fontSize: 12, color: '#666' }}>{item.name}</Text>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: '#333' }}>{item.count} units</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default StatsScreen;