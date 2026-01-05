import React, { useEffect } from "react";
import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { global, useThemeColors, useThemedStyles, BAR_HEIGHT } from "../styles/global";
import { fetchProducts } from "../store/slices/productSlice";

const NotificationScreen = () => {
  const dispatch = useDispatch();
  const { primaryColor, cardBg, textColor, textSecondary, isDarkMode } = useThemeColors();
  const themedStyles = useThemedStyles();
  const insets = useSafeAreaInsets();

  const { products, status } = useSelector((state) => state.products);
  const { shops } = useSelector((state) => state.shops);

  useEffect(() => {
    if (!products || products.length === 0) {
      dispatch(fetchProducts());
    }
  }, [dispatch]);

  const lowStockProducts = products
    .filter((p) => {
      const qty = parseInt(p.qty, 10) || 0;
      const min = parseInt(p.minimum_stock, 10) || 0;
      return min > 0 && qty <= min;
    })
    .sort((a, b) => {
      const aDiff = (parseInt(a.qty, 10) || 0) - (parseInt(a.minimum_stock, 10) || 0);
      const bDiff = (parseInt(b.qty, 10) || 0) - (parseInt(b.minimum_stock, 10) || 0);
      return aDiff - bDiff;
    });

  const resolveShopName = (product) => {
    const sid = product.shop_id?._id || product.shop_id;
    const shop = shops.find((s) => s._id === sid);
    return shop?.name || product.shop_id?.name || "Shop";
  };

  return (
    <View style={themedStyles.safeArea}>
      <ScrollView
        style={themedStyles.mainContainer}
        contentContainerStyle={{ paddingBottom: BAR_HEIGHT + (insets.bottom || 0) + 20 }}
      >
        <Text style={[themedStyles.text, { marginTop: 10, textAlign: "center", fontSize: 18, fontWeight: "700" }]}>Low Stock Alerts</Text>

        {status === "loading" && (
          <View style={{ alignItems: "center", paddingVertical: 30 }}>
            <ActivityIndicator size="small" color={primaryColor} />
            <Text style={{ marginTop: 8, color: textSecondary }}>Checking products...</Text>
          </View>
        )}

        {status !== "loading" && lowStockProducts.length === 0 && (
          <Text style={{ textAlign: "center", color: textSecondary, marginTop: 30 }}>
            No products are below minimum stock.
          </Text>
        )}

        {status !== "loading" && lowStockProducts.length > 0 && (
          <View style={{ marginTop: 12 }}>
            {lowStockProducts.map((product, index) => {
              const qty = parseInt(product.qty, 10) || 0;
              const min = parseInt(product.minimum_stock, 10) || 0;
              const shopName = resolveShopName(product);
              const shortage = min - qty;
              const bgColor = isDarkMode ? cardBg : shortage >= 3 ? "#ffe5e5" : "#fff9e6";
              const accent = shortage >= 3 ? "#ba181b" : "#f39c12";

              return (
                <View
                  key={product._id || index}
                  style={{
                    marginVertical: 6,
                    marginHorizontal: 4,
                    borderRadius: 10,
                    backgroundColor: bgColor,
                    padding: 12,
                    shadowColor: "#000",
                    shadowOpacity: 0.08,
                    shadowRadius: 6,
                    shadowOffset: { width: 0, height: 2 },
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        color: primaryColor,
                        fontSize: 16,
                        fontWeight: "700",
                        maxWidth: "70%",
                      }}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {product.name || "Unnamed Product"}
                    </Text>
                    <View
                      style={{
                        backgroundColor: accent,
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 12,
                      }}
                    >
                      <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>
                        Short -{Math.max(shortage, 0)}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginTop: 6,
                    }}
                  >
                    <Text style={{ color: textSecondary, fontSize: 12 }}>{shopName}</Text>
                    <Text style={{ color: accent, fontWeight: "700" }}>
                      Qty {qty} / Min {min}
                    </Text>
                  </View>

                  {product.note ? (
                    <Text
                      style={{
                        color: textSecondary,
                        fontSize: 12,
                        marginTop: 6,
                        lineHeight: 16,
                      }}
                      numberOfLines={2}
                    >
                      {product.note}
                    </Text>
                  ) : null}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default NotificationScreen;
