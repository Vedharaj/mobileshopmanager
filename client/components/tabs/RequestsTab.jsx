import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, TouchableWithoutFeedback, Keyboard, ActivityIndicator, Alert, Animated, PanResponder } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useDispatch, useSelector } from 'react-redux';
import { AntDesign } from '@expo/vector-icons';
import { global, useThemeColors } from '../../styles/global';
import { showToast } from '../../store/slices/toastSlice';
import { createRequestItem, fetchRequestItems, updateRequestItem, deleteRequestItem } from '../../store/slices/requestItemsSlice';
import { updateProduct } from '../../store/slices/productSlice';

export default function RequestsTab() {
  const dispatch = useDispatch();
  const { primaryColor } = useThemeColors();

  const { products } = useSelector((state) => state.products);
  const { shops } = useSelector((state) => state.shops);
  const { role, user } = useSelector((state) => state.auth);
  const { items: requestItems, status: requestStatus } = useSelector((state) => state.requestItems);

  const staffShops = user?.shops || [];

  const [name, setName] = useState('');
  const [qty, setQty] = useState('');
  const [note, setNote] = useState('');
  const [selectedExistingProduct, setSelectedExistingProduct] = useState(null);
  const [selectedShopId, setSelectedShopId] = useState('');
  const [nameSuggestions, setNameSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isNameFocused, setIsNameFocused] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    dispatch(fetchRequestItems());
    if (role === 'staff' && staffShops.length > 0) {
      const staffShopId = staffShops[0]?._id || staffShops[0];
      setSelectedShopId(staffShopId);
    } else if (shops.length > 0) {
      setSelectedShopId(shops[0]._id);
    }
  }, [dispatch, role, shops, staffShops]);

  const updateNameAndSuggestions = (text) => {
    setName(text);
    if (!text || text.trim().length < 3) {
      setSelectedExistingProduct(null);
      setNameSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const search = text.toLowerCase();
    let base = products;
    if (selectedShopId) {
      base = base.filter((p) => {
        const psid = p.shop_id?._id || p.shop_id;
        return psid === selectedShopId;
      });
    }
    const seen = new Set();
    const matches = [];
    for (const p of base) {
      if (!p.name) continue;
      const n = p.name.toLowerCase();
      if (n.includes(search) && !seen.has(n)) {
        seen.add(n);
        matches.push(p);
      }
      if (matches.length >= 5) break;
    }
    setNameSuggestions(matches);
    setShowSuggestions(matches.length > 0);
    setSelectedExistingProduct(null);
  };

  const handlePickSuggestion = (product) => {
    setSelectedExistingProduct(product);
    setName(product.name || '');
    const prodShopId = product.shop_id?._id || product.shop_id;
    if (role !== 'staff' && prodShopId) setSelectedShopId(prodShopId);
    setShowSuggestions(false);
    setIsNameFocused(false);
  };

  const handleSubmit = () => {
    if (!selectedExistingProduct || !qty) {
      dispatch(showToast({ message: 'Please select a product and enter quantity', type: 'error' }));
      return;
    }
    const payload = {
      product_id: selectedExistingProduct._id,
      shop_id:
        role === 'staff'
          ? selectedShopId
          : selectedShopId || selectedExistingProduct.shop_id?._id || selectedExistingProduct.shop_id,
      qty: parseInt(qty, 10) || 0,
      note: note || '',
    };
    dispatch(createRequestItem(payload))
      .unwrap()
      .then(() => {
        dispatch(showToast({ message: 'Request submitted!', type: 'success' }));
        setName('');
        setQty('');
        setNote('');
        setSelectedExistingProduct(null);
        setShowForm(false);
      })
      .catch((err) => {
        dispatch(showToast({ message: err || 'Failed to submit request', type: 'error' }));
      });
  };

  const handleDeleteRequest = (requestId) => {
    Alert.alert('Delete Request', 'Are you sure you want to delete this request?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await dispatch(deleteRequestItem(requestId)).unwrap();
            dispatch(showToast({ message: 'Request deleted!', type: 'success' }));
          } catch (err) {
            dispatch(showToast({ message: err || 'Failed to delete request', type: 'error' }));
          }
        },
      },
    ]);
  };

  const RequestItemRow = ({ requestItem, index, data }) => {
    const [showDetails, setShowDetails] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [editQty, setEditQty] = useState(requestItem.qty?.toString() || '0');
    const [editNote, setEditNote] = useState(requestItem.note || '');
    const [editStatus, setEditStatus] = useState(requestItem.status || 'pending');

    // keep local state in sync when list refreshes
    React.useEffect(() => {
      setEditQty(requestItem.qty?.toString() || '0');
      setEditNote(requestItem.note || '');
      setEditStatus(requestItem.status || 'pending');
    }, [requestItem.qty, requestItem.note, requestItem.status]);

    const translateX = React.useRef(new Animated.Value(0)).current;
    const SWIPE_THRESHOLD = 60;

    const product = requestItem.product_id;
    const productName = product?.name || 'Unknown Product';
    const shopName = requestItem.shop_id?.name || 'N/A';

    // find full product from store to get current qty
    const fullProduct = React.useMemo(() => {
      const pid = product?._id || product?.id;
      if (!pid) return null;
      return products.find((p) => p._id === pid || p.id === pid) || null;
    }, [products, product]);

    const statusColors = {
      pending: { bg: '#f5f5f5', accent: '#f39c12', text: 'Pending' },
      fulfilled: { bg: '#f5f5f5', accent: '#2ecc71', text: 'Fulfilled' },
    };

    const colors = statusColors[editStatus] || statusColors.pending;

    // Format timestamp
    const formatDate = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      const now = new Date();
      const diff = now - date;
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);

      if (minutes < 1) return 'Just now';
      if (minutes < 60) return `${minutes}m ago`;
      if (hours < 24) return `${hours}h ago`;
      if (days < 7) return `${days}d ago`;
      
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const timeLabel = formatDate(requestItem.createdAt);

    const handleUpdate = async (statusOverride) => {
      if (!editQty || editQty.trim() === '') {
        dispatch(showToast({ message: 'Please enter quantity', type: 'error' }));
        return;
      }
      
      const requestId = requestItem._id || requestItem.id;
      if (!requestId) {
        dispatch(showToast({ message: 'Invalid request item ID', type: 'error' }));
        return;
      }
      
      const statusToSave = statusOverride || editStatus;
      const wasNotFulfilled = requestItem.status !== 'fulfilled';
      const nowFulfilled = statusToSave === 'fulfilled';
      
      setIsUpdating(true);
      try {
        // Update the request item
        await dispatch(
          updateRequestItem({
            id: requestId,
            data: {
              qty: parseInt(editQty, 10) || 0,
              note: editNote || '',
              status: statusToSave,
            },
          })
        ).unwrap();

        // If status changed to fulfilled, add qty to product
        if (wasNotFulfilled && nowFulfilled && product) {
          const productId = product._id || product.id;
          if (productId) {
            const currentQty = fullProduct?.qty || 0;
            const addQty = parseInt(editQty, 10) || 0;
            const newQty = currentQty + addQty;

            await dispatch(
              updateProduct({
                productId: productId,
                productData: { qty: newQty },
              })
            ).unwrap();

            dispatch(showToast({ message: `Request fulfilled! Added ${addQty} to "${product.name}"`, type: 'success' }));
          } else {
            dispatch(showToast({ message: 'Request updated!', type: 'success' }));
          }
        } else {
          dispatch(showToast({ message: 'Request updated!', type: 'success' }));
        }
        
        setShowDetails(false);
      } catch (err) {
        dispatch(showToast({ message: err || 'Failed to update request', type: 'error' }));
      } finally {
        setIsUpdating(false);
      }
    };

    const handleSwipeFulfill = () => {
      if (editStatus === 'fulfilled') return;
      setEditStatus('fulfilled');
      setShowDetails(false);
      handleUpdate('fulfilled');
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    };

    const pan = React.useRef(
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
            handleSwipeFulfill();
          } else {
            Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
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
          overflow: 'hidden',
        }}
      >
        {/* Swipe background */}
        <View
          style={{
            position: 'absolute',
            right: 0,
            left: 0,
            top: 0,
            bottom: 0,
            borderRadius: 8,
            backgroundColor: '#e9f7ef',
            justifyContent: 'center',
            alignItems: 'flex-end',
            paddingRight: 20,
          }}
        >
          <Text style={{ color: '#2ecc71', fontWeight: '700' }}>Fulfill</Text>
        </View>

        <Animated.View
          {...pan.panHandlers}
          style={{ transform: [{ translateX }], width: '100%' }}
        >
          <TouchableOpacity
            onPress={() => setShowDetails(!showDetails)}
            activeOpacity={0.7}
          >
            <View
              style={{
                flexDirection: 'column',
                alignItems: 'flex-start',
                backgroundColor: colors.bg,
                borderRadius: 8,
                padding: 10,
              }}
            >
              <Text style={{ fontSize: 11, color: '#999', marginBottom: 4 }}>
                {timeLabel}
              </Text>

              <View
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  width: '100%',
                }}
              >
                <Text style={[global.txnTitle, { marginBottom: 4 }]}>
                  {productName}
                </Text>
                <Text style={{ color: colors.accent, fontWeight: '700', fontSize: 14 }}>
                  Qty: {editQty || '0'}
                </Text>
              </View>

              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  width: '100%',
                }}
              >
                <Text style={[global.txnSubtitle, { color: '#666' }]}>
                  {shopName} · {colors.text}
                </Text>
                {editNote && (
                  <Text style={{ fontSize: 11, color: '#888', fontStyle: 'italic', maxWidth: '50%' }} numberOfLines={1}>
                    {editNote}
                  </Text>
                )}
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {showDetails && (
          <View style={{ backgroundColor: colors.bg, paddingHorizontal: 10, paddingBottom: 10 }}>
            <TextInput
              style={global.input}
              placeholder="Quantity *"
              value={editQty}
              onChangeText={setEditQty}
              keyboardType="numeric"
              editable={!isUpdating}
            />
            <TextInput
              style={global.input}
              placeholder="Note"
              value={editNote}
              onChangeText={setEditNote}
              multiline
              editable={!isUpdating}
            />
            <View style={{ ...global.input, padding: 0, opacity: isUpdating ? 0.6 : 1 }}>
              <Picker
                selectedValue={editStatus}
                onValueChange={(val) => setEditStatus(val)}
                enabled={!isUpdating}
                style={{ fontSize: 12 }}
                itemStyle={{ fontSize: 12 }}
              >
                <Picker.Item label="Pending" value="pending" />
                <Picker.Item label="Fulfilled" value="fulfilled" />
              </Picker>
            </View>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  borderRadius: 6,
                  borderWidth: 1,
                  borderColor: '#ba181b',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onPress={() => handleDeleteRequest(requestItem._id || requestItem.id)}
              >
                <Text style={{ fontSize: 13, color: '#ba181b', fontWeight: '600' }}>Delete</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ 
                  ...global.button1, 
                  flex: 2, 
                  opacity: isUpdating ? 0.6 : 1,
                  paddingVertical: 10,
                }}
                onPress={() => handleUpdate()}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={global.btnText}>Update</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  // Sort by creation date - most recent first
  const sortedRequests = [...(requestItems || [])].sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return dateB - dateA;
  });

  // Hide fulfilled items from the list
  const pendingRequests = sortedRequests.filter((item) => item.status !== 'fulfilled');

  return (
    <TouchableWithoutFeedback onPress={() => { Keyboard.dismiss(); setIsNameFocused(false); setShowSuggestions(false); }}>
      <View style={{ marginTop: 10 }}>
        {/* Add Request Button */}
        <TouchableOpacity
          style={{
            ...global.button1,
            marginBottom: 15,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
          onPress={() => setShowForm(!showForm)}
        >
          <AntDesign name={showForm ? 'close' : 'plus'} size={16} color="#fff" />
          <Text style={global.btnText}>{showForm ? 'Close Form' : 'Create New Request'}</Text>
        </TouchableOpacity>

        {showForm && (
          <View style={{ marginBottom: 20 }}>
            <Text style={{ marginBottom: 10 }}>Create Request</Text>

        <TextInput
          style={global.input}
          placeholder="Search product name *"
          value={name}
          onChangeText={updateNameAndSuggestions}
          onFocus={() => {
            setIsNameFocused(true);
            if (name && name.length >= 3 && nameSuggestions.length > 0) setShowSuggestions(true);
          }}
        />

        {isNameFocused && showSuggestions && nameSuggestions.length > 0 && (
          <View
            style={{
              borderWidth: 1,
              borderColor: '#ddd',
              borderRadius: 8,
              paddingVertical: 6,
              paddingHorizontal: 8,
              marginTop: 4,
              marginBottom: 8,
              backgroundColor: '#fafafa',
            }}
          >
            <Text style={{ fontSize: 12, color: '#666', marginBottom: 4, fontWeight: '500' }}>Matching products:</Text>
            {nameSuggestions.map((p) => (
              <TouchableOpacity key={p._id} onPress={() => handlePickSuggestion(p)} style={{ paddingVertical: 4, borderRadius: 4 }}>
                <Text style={{ fontSize: 13, color: primaryColor }} numberOfLines={1}>{p.name}</Text>
                <Text style={{ fontSize: 11, color: '#666' }} numberOfLines={1}>
                  {p.shop_id?.name ? `Shop: ${p.shop_id.name}` : p.shop_id ? `Shop: ${p.shop_id}` : 'Shop: -'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <TextInput style={global.input} placeholder="Quantity *" value={qty} onChangeText={setQty} keyboardType="numeric" />

        {role !== 'staff' && shops.length > 0 && (
          <View style={{ ...global.input, padding: 0 }}>
            <Picker selectedValue={selectedShopId} onValueChange={(val) => setSelectedShopId(val)} style={{ fontSize: 12 }} itemStyle={{ fontSize: 12 }}>
              {shops.map((shop) => (
                <Picker.Item key={shop._id} label={shop.name} value={shop._id} />
              ))}
            </Picker>
          </View>
        )}

        <TextInput style={global.input} placeholder="Note" value={note} onChangeText={setNote} multiline />

            <View>
              <TouchableOpacity style={{ marginTop: 10, ...global.button1 }} onPress={handleSubmit}>
                <Text style={global.btnText1}>Submit Request</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Request Items List */}
        <Text style={{ marginBottom: 10, marginTop: 10 }}>Request Items</Text>

        {requestStatus === 'loading' && (
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 30 }}>
            <ActivityIndicator size="large" color={primaryColor} />
            <Text style={{ marginTop: 10, color: '#666' }}>Loading requests...</Text>
          </View>
        )}

        {requestStatus !== 'loading' && pendingRequests.length === 0 && (
          <Text style={{ textAlign: 'center', color: '#999', marginTop: 20 }}>
            No pending request items
          </Text>
        )}

        {requestStatus !== 'loading' && pendingRequests.length > 0 && (
          <View style={{ marginTop: 5 }}>
            {pendingRequests.map((item, index) => (
              <RequestItemRow key={item._id} requestItem={item} index={index} data={pendingRequests} />
            ))}
          </View>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
}
