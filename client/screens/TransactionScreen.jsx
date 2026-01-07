import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { global, useThemeColors } from "../styles/global";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { fetchServices, updateService } from "../store/slices/serviceSlice";
import { createSale, fetchSales } from "../store/slices/salesSlice";
import { fetchProducts, updateProduct } from "../store/slices/productSlice";
import { fetchCustomers } from "../store/slices/customerSlice";
import {
  addOrUpdateFromScan,
  clearCart,
  selectLastScanId,
  setLastScanId,
} from "../store/slices/salesItemsSlice";
import { showToast } from "../store/slices/toastSlice";
import ServiceSearch from "../components/ServiceSearch";
import ServicePaymentForm from "../components/ServicePaymentForm";
import ReturnItemSearch from "../components/ReturnItemSearch";
import ReturnItemForm from "../components/ReturnItemForm";
import MoneyExpenseForm from "../components/MoneyExpenseForm";
import SalesForm from "../components/SalesForm";

const TRANSACTION_TYPES = [
  { id: "service", label: "Service" },
  { id: "sales", label: "Sales" },
  { id: "add_money", label: "Add Money" },
  { id: "add_expense", label: "Add Expense" },
  { id: "return_item", label: "Return Item" },
];

export default function TransactionScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { primaryColor } = useThemeColors();
  const dispatch = useDispatch();

  const { services, status: servicesStatus } = useSelector(
    (state) => state.services
  );
  const { sales = [], status: salesStatus } = useSelector(
    (state) => state.sales || {}
  );
  const { shops } = useSelector((state) => state.shops);
  const { user } = useSelector((state) => state.auth);
  const { products = [] } = useSelector((state) => state.products || {});
  const { customers = [] } = useSelector((state) => state.customers || {});
  const lastScanId = useSelector(selectLastScanId);

  const [selectedType, setSelectedType] = useState({"id": "sales", "label": "Sales"});
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedService, setSelectedService] = useState(null);
  const [paidInCash, setPaidInCash] = useState("");
  const [paidInEcash, setPaidInEcash] = useState("");
  const [transactionDate, setTransactionDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txTitle, setTxTitle] = useState("");
  const [txDescription, setTxDescription] = useState("");
  const [selectedShopForTx, setSelectedShopForTx] = useState("");
  const [selectedTransactionType, setSelectedTransactionType] = useState(null);
  const [returnSearchQuery, setReturnSearchQuery] = useState("");
  const [selectedReturnItem, setSelectedReturnItem] = useState(null);
  const [returnQty, setReturnQty] = useState("1");
  const [subtractReturn, setSubtractReturn] = useState(true);
  const [scannedProduct, setScannedProduct] = useState(null);

  // Normalize scanned product data
  const normalizeScannedProduct = (raw) => {
    if (!raw) return null;

    const candidate = raw.product || raw;
    const productId =
      candidate._id || candidate.id || candidate.product_id || candidate.code;

    if (!productId) return null;

    return {
      _id: productId,
      name: candidate.name || candidate.product_name || "Item",
      selling_price:
        candidate.selling_price ?? candidate.price ?? candidate.unit_price ?? 0,
      scannedAt: raw.scannedAt || candidate.scannedAt || null,
    };
  };

  // Preload sales so return search has data even before switching tabs
  useEffect(() => {
    if (!sales || sales.length === 0) {
      dispatch(fetchSales());
    }
  }, [dispatch]);

  // Handle scanned product - add or increment quantity
  useEffect(() => {
    if (!scannedProduct) {
      return;
    }

    const normalized = normalizeScannedProduct(scannedProduct);
    if (!normalized) {
      console.log("❌ Scanned product missing id, ignoring:", scannedProduct);
      return;
    }

    const { _id: productId, name, selling_price, scannedAt } = normalized;
    // Use the scannedAt timestamp from scanner, or current time if missing
    const timestamp = scannedAt || Date.now();
    const scanId = `${productId}-${timestamp}`;

    // Skip if we've already processed this exact scan
    if (lastScanId === scanId) {
      console.log("⏭️ Scan already processed, skipping:", scanId);
      return;
    }
    dispatch(
      addOrUpdateFromScan({
        product_id: productId,
        product_name: name,
        unit_price: selling_price || 0,
        scanId,
      })
    );
    dispatch(setLastScanId(scanId));
  }, [scannedProduct]);

  // Handle back button - navigate to Home screen
  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (e) => {
      // Prevent default behavior
      e.preventDefault();
      // Navigate to Home screen instead
      navigation.navigate("Home");
    });

    return unsubscribe;
  }, [navigation]);

  // Handle scanned product from navigation params
  const params = route?.params || {};

  useFocusEffect(
    React.useCallback(() => {
      const scanned = params?.scannedProduct;
      const openSalesForm = params?.openSalesForm;

      if (scanned && openSalesForm) {
        // Make sure Sales tab is active
        if (selectedType?.id !== "sales") {
          setSelectedType({ id: "sales", label: "Sales" });
        }

        // Pass product to local state
        setScannedProduct(scanned);

        // Ensure data
        if (!products || products.length === 0) {
          dispatch(fetchProducts());
        }
        if (!customers || customers.length === 0) {
          dispatch(fetchCustomers());
        }

        // Clear params so next scan (even same product) works again
        navigation.setParams({
          scannedProduct: undefined,
          openSalesForm: undefined,
        });
      }

      // no cleanup needed
    }, [
      params?.scannedProduct,
      params?.openSalesForm,
      selectedType?.id,
      products.length,
      customers.length,
      dispatch,
      navigation,
    ])
  );

  useEffect(() => {
    if (selectedType?.id === "service" && (!services || services.length === 0)) {
      dispatch(fetchServices());
    }
    if (selectedType?.id === "return_item" && (!sales || sales.length === 0)) {
      dispatch(fetchSales());
    }
    if (selectedType?.id === "sales") {
      if (!products || products.length === 0) {
        dispatch(fetchProducts());
      }
      if (!customers || customers.length === 0) {
        dispatch(fetchCustomers());
      }
    }
    // default shop for non-service transactions
    if (shops && shops.length > 0 && !selectedShopForTx) {
      const defaultShop = shops[0]._id || shops[0];
      setSelectedShopForTx(defaultShop);
    }
  }, [selectedType, dispatch, shops, selectedShopForTx]);

  const activeServices = useMemo(() => {
    if (!services) return [];
    return services.filter(
      (s) => s.status === "pending" || s.status === "in_progress"
    );
  }, [services]);

  const filteredServices = useMemo(() => {
    if (!searchQuery) return activeServices;
    const query = searchQuery.toLowerCase();
    return activeServices.filter(
      (s) =>
        s.name.toLowerCase().includes(query) ||
        s.customer_id?.name.toLowerCase().includes(query)
    );
  }, [searchQuery, activeServices]);

  const returnableItems = useMemo(() => {
    if (!Array.isArray(sales)) return [];
    return sales
      .filter((sale) => sale.type === "sales")
      .flatMap((sale, saleIdx) => {
        const baseItems =
          Array.isArray(sale.items) && sale.items.length > 0
            ? sale.items
            : [
                {
                  product_id: { name: sale.name || "Sale" },
                  quantity: 1,
                  unit_price: sale.total_amount || sale.paid_amount || 0,
                  total_price: sale.total_amount || sale.paid_amount || 0,
                },
              ];

        return baseItems.map((item, idx) => {
          const productName = item.product_id?.name || "Item";
          const unitPrice = item.unit_price || item.total_price || 0;
          return {
            key: `${sale._id || sale.id || saleIdx}-${
              item.product_id?._id || idx
            }`,
            sale,
            item,
            productName,
            customerName: sale.customer_id?.name || "Walk-in",
            shopName: sale.shop_id?.name || "",
            shopId: sale.shop_id?._id || sale.shop_id,
            quantity: item.quantity || 1,
            unitPrice,
            saleName: sale.name || "Sale",
          };
        });
      });
  }, [sales]);

  const filteredReturnItems = useMemo(() => {
    if (!returnSearchQuery) return returnableItems;
    const query = returnSearchQuery.toLowerCase();
    return returnableItems.filter((entry) => {
      return (
        entry.productName.toLowerCase().includes(query) ||
        entry.customerName.toLowerCase().includes(query) ||
        entry.saleName.toLowerCase().includes(query)
      );
    });
  }, [returnSearchQuery, returnableItems]);

  const handleTransactionTypeSelect = (type) => {
    setSelectedType(type);
    setShowDropdown(false);
    setSelectedService(null);
    setSearchQuery("");
    setPaidInCash("");
    setPaidInEcash("");
    setSelectedReturnItem(null);
    setReturnSearchQuery("");
    setReturnQty("1");
    setSubtractReturn(true);

    if (type.id === "sales") {
      // reset cart & scanner state when switching to Sales
      dispatch(clearCart());
      dispatch(setLastScanId(null));
      setScannedProduct(null);
    }
  };

  const handleSubmitSales = async (saleData) => {
    if (!selectedShopForTx) {
      dispatch(showToast({ message: "Please select a shop", type: "error" }));
      return;
    }

    setIsSubmitting(true);
    try {
      const balance = saleData.total_amount - saleData.paid_amount;
      const paymentMethod =
        saleData.cash_paid > 0 && saleData.online_paid > 0
          ? "both"
          : saleData.online_paid > 0
          ? "E-Cash"
          : "Cash";

      // Reduce product quantities for each sold item
      if (Array.isArray(saleData.items)) {
        for (const item of saleData.items) {
          const product = products.find(
            (p) => p._id === item.product_id || p.id === item.product_id
          );
          if (product) {
            const currentQty = product.qty || 0;
            const newQty = Math.max(0, currentQty - (item.quantity || 0));
            // console.log(
            //   `📄 SALE: Reducing "${product.name}" qty: ${currentQty} → ${newQty} (sold: ${item.quantity})`
            // );
            await dispatch(
              updateProduct({
                productId: product._id || product.id,
                productData: { qty: newQty },
              })
            ).unwrap();
          }
        }
      }

      await dispatch(
        createSale({
          shop_id: selectedShopForTx,
          user_id: user?._id,
          customer_id: saleData.customer_id,
          service_id: null,
          name: "Sale",
          type: "sales",
          order_date: new Date().toISOString(),
          total_amount: saleData.total_amount,
          paid_amount: saleData.paid_amount,
          cash_paid: saleData.cash_paid,
          online_paid: saleData.online_paid,
          balance: balance,
          payment_method: paymentMethod,
          status: balance > 0 ? "pending" : "completed",
          notes: "Sales transaction",
          items: saleData.items.map((item) => {
            const product = products.find(
              (p) => p._id === item.product_id || p.id === item.product_id
            );
            const categoryId = typeof product?.category_id === 'object' 
              ? product?.category_id?._id 
              : product?.category_id || product?.category?._id || null;
            return {
              ...item,
              category_id: categoryId,
            };
          }),
        })
      ).unwrap();

      dispatch(fetchProducts());
      dispatch(fetchSales());
      dispatch(
        showToast({ message: "Sale recorded successfully!", type: "success" })
      );

      // reset sales form state
      dispatch(clearCart());
      dispatch(setLastScanId(null));
      setScannedProduct(null);
      setSelectedType(null);

      navigation.navigate("Home");
    } catch (err) {
      console.error("Sales submission error:", err);
      const errorMsg = typeof err === 'string' ? err : err?.payload || err?.message || "Failed to submit sale";
      dispatch(
        showToast({
          message: errorMsg,
          type: "error",
        })
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitOther = async () => {
    // Handles add_money and add_expense
    if (!txTitle.trim()) {
      dispatch(showToast({ message: "Please enter a title", type: "error" }));
      return;
    }

    const cash = parseFloat(paidInCash) || 0;
    const ecash = parseFloat(paidInEcash) || 0;
    const totalPaid = cash + ecash;

    if (totalPaid <= 0) {
      dispatch(
        showToast({ message: "Please enter a positive amount", type: "error" })
      );
      return;
    }

    if (!selectedShopForTx) {
      dispatch(showToast({ message: "Please select a shop", type: "error" }));
      return;
    }

    setIsSubmitting(true);
    try {
      const common = {
        shop_id: selectedShopForTx,
        user_id: user?._id,
        customer_id: null,
        service_id: null,
        name: txTitle,
        type: selectedType?.id,
        order_date: new Date().toISOString(),
        total_amount: totalPaid,
        paid_amount: totalPaid,
        balance: 0,
        status: "completed",
        notes: txDescription || txTitle,
        items: [],
      };

      const isExpense = selectedType?.id === "add_expense";

      if (cash > 0 && ecash > 0) {
        await dispatch(
          createSale({
            ...common,
            cash_paid: cash,
            online_paid: ecash,
            payment_method: "multiple",
          })
        ).unwrap();
      } else if (cash > 0) {
        await dispatch(
          createSale({
            ...common,
            cash_paid: cash,
            online_paid: 0,
            payment_method: "cash",
          })
        ).unwrap();
      } else if (ecash > 0) {
        await dispatch(
          createSale({
            ...common,
            cash_paid: 0,
            online_paid: ecash,
            payment_method: "e",
          })
        ).unwrap();
      }

      dispatch(fetchSales());
      dispatch(fetchServices());

      dispatch(
        showToast({
          message: isExpense ? "Expense recorded" : "Amount added",
          type: "success",
        })
      );

      setTxTitle("");
      setTxDescription("");
      setPaidInCash("");
      setPaidInEcash("");
      setSelectedType(null);

      navigation.navigate("Home");
    } catch (err) {
      console.error("Submit transaction error:", err);
      dispatch(
        showToast({ message: "Failed to submit transaction", type: "error" })
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectService = (service) => {
    setSelectedService(service);
    setSearchQuery("");
  };

  const handleSelectReturnItem = (entry) => {
    setSelectedReturnItem(entry);
    setReturnSearchQuery("");
    const estimated = (entry.unitPrice || 0) * (parseFloat(returnQty) || 1);
    setPaidInCash(estimated ? String(estimated) : "");
    setPaidInEcash("");
  };

  useEffect(() => {
    if (selectedType?.id !== "return_item") return;
    if (!selectedReturnItem) return;
    if (paidInCash || paidInEcash) return;
    const estimated =
      (selectedReturnItem.unitPrice || 0) * (parseFloat(returnQty) || 0);
    if (estimated > 0) {
      setPaidInCash(String(estimated));
    }
  }, [selectedType, selectedReturnItem, returnQty, paidInCash, paidInEcash]);

  const handleCancelReturn = () => {
    setSelectedReturnItem(null);
    setReturnSearchQuery("");
    setReturnQty("1");
    setPaidInCash("");
    setPaidInEcash("");
    setSubtractReturn(true);
  };

  const handleSearchAgain = () => {
    setSelectedService(null);
    setSearchQuery("");
    setPaidInCash("");
    setPaidInEcash("");
  };

  const handleSubmitServicePayment = async () => {
    if (!selectedService) {
      dispatch(
        showToast({ message: "Please select a service", type: "error" })
      );
      return;
    }

    if (!paidInCash.trim() && !paidInEcash.trim()) {
      dispatch(
        showToast({
          message: "Please enter cash or e-cash amount",
          type: "error",
        })
      );
      return;
    }

    if (!transactionDate.trim()) {
      dispatch(
        showToast({ message: "Please enter transaction date", type: "error" })
      );
      return;
    }

    const cash = parseFloat(paidInCash) || 0;
    const ecash = parseFloat(paidInEcash) || 0;
    const totalPaid = cash + ecash;

    if (isNaN(cash) || isNaN(ecash)) {
      dispatch(
        showToast({ message: "Please enter valid amounts", type: "error" })
      );
      return;
    }

    if (totalPaid <= 0) {
      dispatch(
        showToast({
          message: "Total paid amount must be greater than 0",
          type: "error",
        })
      );
      return;
    }

    if (totalPaid > selectedService.balance) {
      dispatch(
        showToast({
          message: `Paid amount cannot exceed balance of ₹${selectedService.balance}`,
          type: "error",
        })
      );
      return;
    }

    if (!selectedService?.shop_id?._id) {
      dispatch(
        showToast({
          message: "This service has no shop assigned",
          type: "error",
        })
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const dateParts = transactionDate.split("-");
      const orderDate = new Date(
        `${dateParts[0]}-${dateParts[1]}-${dateParts[2]}T00:00:00Z`
      );

      if (isNaN(orderDate.getTime())) {
        dispatch(
          showToast({
            message: "Invalid date format. Use YYYY-MM-DD",
            type: "error",
          })
        );
        setIsSubmitting(false);
        return;
      }

      await dispatch(
        createSale({
          shop_id: selectedService?.shop_id?._id,
          user_id: user?._id,
          customer_id: selectedService?.customer_id?._id,
          service_id: selectedService?._id,
          name: selectedService?.name,
          type: "service",
          order_date: orderDate.toISOString(),
          total_amount: selectedService?.total_amount,
          paid_amount: totalPaid,
          cash_paid: cash,
          online_paid: ecash,
          balance: selectedService ? selectedService.balance - totalPaid : 0,
          payment_method:
            cash > 0 && ecash > 0 ? "multiple" : cash > 0 ? "cash" : "ecash",
          status: "completed",
          notes: `Payment for service: ${selectedService?.name}`,
          items: [],
        })
      ).unwrap();

      const newBalance = selectedService
        ? selectedService.balance - totalPaid
        : 0;

      await dispatch(
        updateService({
          serviceId: selectedService?._id,
          serviceData: {
            name: selectedService?.name,
            balance: newBalance,
          },
        })
      ).unwrap();

      dispatch(fetchSales());
      dispatch(fetchServices());

      dispatch(
        showToast({
          message: "Payment submitted successfully!",
          type: "success",
        })
      );

      setSelectedService(null);
      setSearchQuery("");
      setPaidInCash("");
      setPaidInEcash("");
      setTransactionDate(new Date().toISOString().split("T")[0]);
      setSelectedType(null);

      setTimeout(() => {
        navigation.navigate("Home");
      }, 1500);
    } catch (err) {
      console.error("Payment submission error:", err);
      const errorMessage =
        err?.payload?.msg ||
        err?.payload?.message ||
        err?.message ||
        "Failed to submit payment";

      dispatch(
        showToast({
          message: errorMessage,
          type: "error",
        })
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitReturn = async () => {
    if (!selectedReturnItem) {
      dispatch(
        showToast({ message: "Please select an item to return", type: "error" })
      );
      return;
    }

    const qtyNumber = parseFloat(returnQty) || 0;
    if (qtyNumber <= 0) {
      dispatch(
        showToast({ message: "Quantity must be greater than 0", type: "error" })
      );
      return;
    }

    if (qtyNumber > (selectedReturnItem.quantity || 0)) {
      dispatch(
        showToast({
          message: "Return quantity cannot exceed sold quantity",
          type: "error",
        })
      );
      return;
    }

    let cash = parseFloat(paidInCash) || 0;
    let ecash = parseFloat(paidInEcash) || 0;
    const userEnteredTotal = cash + ecash;
    const estimatedTotal = qtyNumber * (selectedReturnItem.unitPrice || 0);
    const finalTotal = userEnteredTotal > 0 ? userEnteredTotal : estimatedTotal;

    if (finalTotal <= 0) {
      dispatch(
        showToast({
          message: "Please enter a valid refund amount",
          type: "error",
        })
      );
      return;
    }

    if (!selectedReturnItem.shopId && !selectedShopForTx) {
      dispatch(
        showToast({
          message: "Please select a shop for this return",
          type: "error",
        })
      );
      return;
    }

    if (cash + ecash <= 0 && estimatedTotal > 0) {
      cash = estimatedTotal;
    }

    const paymentMethod =
      cash > 0 && ecash > 0 ? "multiple" : cash > 0 ? "cash" : "e";

    setIsSubmitting(true);
    try {
      await dispatch(
        createSale({
          shop_id: selectedReturnItem.shopId || selectedShopForTx,
          user_id: user?._id,
          customer_id:
            selectedReturnItem.sale?.customer_id?._id ||
            selectedReturnItem.sale?.customer_id ||
            null,
          service_id: null,
          name: `Return - ${selectedReturnItem.productName}`,
          type: "return_item",
          order_date: new Date().toISOString(),
          total_amount: finalTotal,
          paid_amount: finalTotal,
          cash_paid: cash,
          online_paid: ecash,
          balance: 0,
          payment_method: paymentMethod,
          payment_breakdown: {
            subtract: subtractReturn,
            quantity: qtyNumber,
            original_sale_id:
              selectedReturnItem.sale?._id || selectedReturnItem.sale?.id,
            product_id:
              selectedReturnItem.item?.product_id?._id ||
              selectedReturnItem.item?.product_id,
          },
          status: "completed",
          notes: `Return ${qtyNumber} x ${selectedReturnItem.productName}${
            subtractReturn ? " (subtract)" : ""
          }`,
          items: [
            {
              product_id:
                selectedReturnItem.item?.product_id?._id ||
                selectedReturnItem.item?.product_id,
              quantity: qtyNumber,
              unit_price: selectedReturnItem.unitPrice || 0,
              total_price: qtyNumber * (selectedReturnItem.unitPrice || 0),
              notes: "Returned item",
            },
          ],
        })
      ).unwrap();

      dispatch(fetchSales());

      dispatch(
        showToast({
          message: subtractReturn
            ? "Return recorded & subtracted"
            : "Return recorded",
          type: "success",
        })
      );

      handleCancelReturn();
      setSelectedType(null);

      navigation.navigate("Home");
    } catch (err) {
      console.error("Return submission error:", err);
      dispatch(
        showToast({
          message: err?.payload || err?.message || "Failed to submit return",
          type: "error",
        })
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Live computed values
  const cashAmount = parseFloat(paidInCash) || 0;
  const ecashAmount = parseFloat(paidInEcash) || 0;
  const previewTotalPaid = cashAmount + ecashAmount;
  const previewRemaining = selectedService
    ? Math.max(0, selectedService.balance - previewTotalPaid)
    : 0;
  const returnQtyNumber = parseFloat(returnQty) || 0;
  const estimatedReturnValue = selectedReturnItem
    ? (selectedReturnItem.unitPrice || 0) * returnQtyNumber
    : 0;
  const previewReturnTotal =
    previewTotalPaid > 0 ? previewTotalPaid : estimatedReturnValue;

  const selectedLabel = selectedType?.label || "Select Transaction Type";

  return (
    <SafeAreaView style={global.safeArea}>
      <ScrollView
        style={global.container}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled={true}
      >
        {/* Dropdown Section */}
        <View style={{ marginBottom: 20 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: "#333",
              marginBottom: 10,
            }}
          >
            Transaction Type *
          </Text>

          <TouchableOpacity
            style={{
              backgroundColor: "#f5f5f5",
              borderWidth: 1,
              borderColor: primaryColor,
              borderRadius: 8,
              paddingVertical: 12,
              paddingHorizontal: 14,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              elevation: 2,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
            }}
            onPress={() => setShowDropdown(!showDropdown)}
          >
            <Text
              style={{
                fontSize: 16,
                color: selectedType ? "#333" : "#999",
                fontWeight: "500",
              }}
            >
              {selectedLabel}
            </Text>
            <MaterialIcons
              name={showDropdown ? "expand-less" : "expand-more"}
              size={24}
              color={primaryColor}
            />
          </TouchableOpacity>

          {showDropdown && (
            <View
              style={{
                backgroundColor: "#f5f5f5",
                borderWidth: 1,
                borderColor: primaryColor,
                borderTopWidth: 0,
                borderBottomLeftRadius: 8,
                borderBottomRightRadius: 8,
                marginTop: -1,
                elevation: 5,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.15,
                shadowRadius: 3,
                maxHeight: 300,
              }}
            >
              <ScrollView scrollEnabled={true} nestedScrollEnabled={true}>
                {TRANSACTION_TYPES.map((item, index) => (
                  <TouchableOpacity
                    key={item.id}
                    style={{
                      paddingVertical: 12,
                      paddingHorizontal: 14,
                      borderBottomWidth:
                        index !== TRANSACTION_TYPES.length - 1 ? 1 : 0,
                      borderBottomColor: "#f0f0f0",
                      backgroundColor:
                        selectedType?.id === item.id ? "#f5f5f5" : "#fff",
                    }}
                    onPress={() => handleTransactionTypeSelect(item)}
                  >
                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      {selectedType?.id === item.id && (
                        <MaterialIcons
                          name="check"
                          size={20}
                          color={primaryColor}
                          style={{ marginRight: 10 }}
                        />
                      )}
                      <Text
                        style={{
                          fontSize: 15,
                          color:
                            selectedType?.id === item.id
                              ? primaryColor
                              : "#333",
                          fontWeight:
                            selectedType?.id === item.id ? "600" : "500",
                        }}
                      >
                        {item.label}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {selectedType?.id === "service" && !selectedService && (
          <ServiceSearch
            primaryColor={primaryColor}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            servicesStatus={servicesStatus}
            filteredServices={filteredServices}
            onSelectService={handleSelectService}
          />
        )}

        {selectedType?.id === "return_item" && !selectedReturnItem && (
          <ReturnItemSearch
            primaryColor={primaryColor}
            returnSearchQuery={returnSearchQuery}
            setReturnSearchQuery={setReturnSearchQuery}
            salesStatus={salesStatus}
            filteredReturnItems={filteredReturnItems}
            onSelectReturnItem={handleSelectReturnItem}
          />
        )}

        {selectedType?.id === "sales" && (
          <SalesForm
            primaryColor={primaryColor}
            products={products}
            shops={shops}
            customers={customers}
            selectedShopForTx={selectedShopForTx}
            setSelectedShopForTx={setSelectedShopForTx}
            isSubmitting={isSubmitting}
            onSubmitSales={handleSubmitSales}
            onCancel={() => {
              setSelectedType(null);
              setScannedProduct(null);
              dispatch(clearCart());
              dispatch(setLastScanId(null));
            }}
            scannedProduct={scannedProduct}
          />
        )}

        {selectedType?.id &&
          (selectedType.id === "add_money" ||
            selectedType.id === "add_expense") && (
            <MoneyExpenseForm
              primaryColor={primaryColor}
              selectedType={selectedType}
              txTitle={txTitle}
              setTxTitle={setTxTitle}
              txDescription={txDescription}
              setTxDescription={setTxDescription}
              shops={shops}
              selectedShopForTx={selectedShopForTx}
              setSelectedShopForTx={setSelectedShopForTx}
              paidInCash={paidInCash}
              setPaidInCash={setPaidInCash}
              paidInEcash={paidInEcash}
              setPaidInEcash={setPaidInEcash}
              isSubmitting={isSubmitting}
              onSubmitOther={handleSubmitOther}
              onCancel={() => {
                setSelectedType(null);
                setSelectedTransactionType(null);
                setTxTitle("");
                setTxDescription("");
                setPaidInCash("");
                setPaidInEcash("");
              }}
            />
          )}

        {selectedType?.id === "return_item" && selectedReturnItem && (
          <ReturnItemForm
            primaryColor={primaryColor}
            selectedReturnItem={selectedReturnItem}
            returnQty={returnQty}
            setReturnQty={setReturnQty}
            paidInCash={paidInCash}
            setPaidInCash={setPaidInCash}
            paidInEcash={paidInEcash}
            setPaidInEcash={setPaidInEcash}
            subtractReturn={subtractReturn}
            setSubtractReturn={setSubtractReturn}
            previewReturnTotal={previewReturnTotal}
            isSubmitting={isSubmitting}
            onSubmitReturn={handleSubmitReturn}
            onCancel={handleCancelReturn}
          />
        )}

        {selectedType?.id === "service" && selectedService && (
          <ServicePaymentForm
            primaryColor={primaryColor}
            selectedService={selectedService}
            paidInCash={paidInCash}
            setPaidInCash={setPaidInCash}
            paidInEcash={paidInEcash}
            setPaidInEcash={setPaidInEcash}
            transactionDate={transactionDate}
            setTransactionDate={setTransactionDate}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmitServicePayment}
            onSearchAgain={handleSearchAgain}
            previewRemaining={previewRemaining}
            previewTotalPaid={previewTotalPaid}
          />
        )}
      </ScrollView>

      {/* Floating Scanner Button */}
      {selectedType?.id === "sales" && (
        <TouchableOpacity
          style={{
            position: "absolute",
            bottom: 20,
            right: 20,
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor: primaryColor,
            justifyContent: "center",
            alignItems: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
            zIndex: 10,
          }}
          onPress={() =>
            navigation.navigate("Scanner", { from: "Transaction" })
          }
        >
          <MaterialIcons name="qr-code-scanner" size={28} color="#fff" />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}
