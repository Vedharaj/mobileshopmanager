import React, { useRef } from "react";
import {
  View,
  Text,
  Alert,
  PanResponder,
  Dimensions,
  Animated,
} from "react-native";
import { useDispatch } from "react-redux";
import { global } from "../styles/global";
import { deleteSale, fetchSales } from "../store/slices/salesSlice";

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = 50;

const TransactionRow = ({ item }) => {
  const dispatch = useDispatch();
  const translateX = useRef(new Animated.Value(0)).current;

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
                      await dispatch(deleteSale(id)).unwrap();
                    } catch (err) {
                      console.error('Delete sale error:', err);
                    } finally {
                      dispatch(fetchSales());
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

  const bgColor = item.type === 'income' ? '#e9f7ef' : '#fff5f5';
  const accent = item.type === 'income' ? '#2ecc71' : '#e74c3c';

  const cashAmount = item.sale?.cash_paid || 0;
  const onlineAmount = item.sale?.online_paid || 0;

  const isSplitPayment = (cashAmount > 0 && onlineAmount > 0);

  return (
    <View style={{ marginVertical: 6, marginHorizontal: 4, borderRadius: 8, overflow: 'hidden' }}>
      {/* Delete background */}
      <View style={{ position: 'absolute', right: 0, left: 0, top: 0, bottom: 0, borderRadius: 8, backgroundColor: '#ffecec', justifyContent: 'center', alignItems: 'flex-end', paddingRight: 20 }}>
        <Text style={{ color: '#e74c3c', fontWeight: '600' }}>Delete</Text>
      </View>

      <Animated.View
        {...pan.panHandlers}
        style={{ transform: [{ translateX }], width: '100%' }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', backgroundColor: bgColor, borderRadius: 8, padding: 10 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 11, color: '#999', marginBottom: 4 }}>{item.timeLabel}</Text>
            <Text style={[global.txnTitle, { marginBottom: 4 }]}>{item.description}</Text>
            <Text style={[global.txnSubtitle, { color: '#666' }]}>
              {item.category} · {item.type === 'income' ? 'Income' : 'Expense'}
            </Text>
          </View>

          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ color: accent, fontWeight: '700', fontSize: 14 }}>
              {item.type === 'income' ? '+' : '-'}₹{(item.amount || 0).toFixed(2)}
            </Text>

            {isSplitPayment && item.type === 'income' && (
              <View style={{ flexDirection: "row", alignItems: 'flex-end', marginTop: 2 }}>
                {item.paymentMethod === 'multiple' && (
                  <>
                    <Text style={{ fontSize: 11, color: '#666' }}>
                      Cash: ₹{cashAmount.toFixed(2)}
                    </Text>
                    <Text style={{ fontSize: 11, color: '#666', marginLeft: 8 }}>
                      E-Cash: ₹{onlineAmount.toFixed(2)}
                    </Text>
                  </>
                )}
                {item.paymentMethod !== 'multiple' && (
                  <>
                    {cashAmount > 0 && (
                      <Text style={{ fontSize: 11, color: '#666' }}>
                        Cash: ₹{cashAmount.toFixed(2)}
                      </Text>
                    )}
                    {onlineAmount > 0 && (
                      <Text style={{ fontSize: 11, color: '#666', marginLeft: cashAmount > 0 ? 8 : 0 }}>
                        Online: ₹{onlineAmount.toFixed(2)}
                      </Text>
                    )}
                  </>
                )}
              </View>
            )}
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

export default TransactionRow;
