import React, { useState, useEffect } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import {
  global,
  useThemeColors,
  useThemedStyles,
  BAR_HEIGHT,
} from "../styles/global";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchServices,
  createService,
  deleteService,
  updateService,
} from "../store/slices/serviceSlice";
import { fetchCustomers, createCustomer } from "../store/slices/customerSlice";
import { createSale, updateSale, fetchSales } from "../store/slices/salesSlice";
import { AntDesign, MaterialIcons } from "@expo/vector-icons";
import ServiceRow from "../components/ServiceRow";
import { showToast } from "../store/slices/toastSlice";
import { useNavigation } from "@react-navigation/native";
import Entypo from "@expo/vector-icons/Entypo";

const ServicesScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const { services } = useSelector((state) => state.services);
  const { customers } = useSelector((state) => state.customers);
  const { shops } = useSelector((state) => state.shops);
  const { sales } = useSelector((state) => state.sales);
  const { userid, role, user } = useSelector((state) => state.auth);
  const { primaryColor, textColor, cardBg, textSecondary } = useThemeColors();
  const themedStyles = useThemedStyles();

  const staffShops = user?.shops || [];
  const isStaff = role === "staff"; // whether the current user is staff

  const formatDate = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const day = String(d.getDate()).padStart(2, "0");
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const month = monthNames[d.getMonth()];
    return `${day} ${month} ${year}`; // e.g. 10 Nov 2025
  };

  const getCurrentDate = () => formatDate(new Date());

  const isValidDate = (dateString) => {
    if (!dateString) return false;
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
  };

  const [serviceName, setServiceName] = useState("");
  const [isServiceNameFocused, setIsServiceNameFocused] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [filterShopId, setFilterShopId] = useState(""); // shop filter
  const [displayLimitServices, setDisplayLimitServices] = useState(10);
  const [isLoadingMoreServices, setIsLoadingMoreServices] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!services || services.length === 0) {
        dispatch(fetchServices());
      }
      if (!customers || customers.length === 0) {
        dispatch(fetchCustomers());
      }
    };
    loadData();

    if (role === "staff" && staffShops.length > 0) {
      const staffShopId = staffShops[0]?._id || staffShops[0];
      setFilterShopId(staffShopId); // staff only sees their shop
    } else if (shops.length > 0) {
      setFilterShopId(""); // owner default: all shops
    }
  }, [dispatch, shops, role, staffShops]);

  const handleDeleteService = async (serviceId) => {
    try {
      Alert.alert("Delete Service", "Do you want to delete this service?", [
        { text: "Cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await dispatch(deleteService(serviceId)).unwrap();
            dispatch(
              showToast({
                message: "Service deleted!",
                type: "success",
              })
            );
          },
        },
      ]);
    } catch (error) {
      dispatch(
        showToast({
          message: error || "Failed to delete service",
          type: "error",
        })
      );
      console.error("Service deletion error:", error);
    }
  };

  const handleScrollServices = (event) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isAtBottom =
      layoutMeasurement.height + contentOffset.y >= contentSize.height - 50;

    if (isAtBottom && !isLoadingMoreServices) {
      setIsLoadingMoreServices(true);
      setDisplayLimitServices((prev) => prev + 10);
    }
  };

  const handleLoadMoreServices = () => {
    if (isLoadingMoreServices) return;
    setIsLoadingMoreServices(true);
    setDisplayLimitServices((prev) => prev + 10);
  };

  useEffect(() => {
    if (isLoadingMoreServices) {
      setIsLoadingMoreServices(false);
    }
  }, [displayLimitServices, isLoadingMoreServices]);

  return (
    <TouchableWithoutFeedback
      onPress={() => {
        Keyboard.dismiss();
        setIsServiceNameFocused(false);
      }}
    >
      <ScrollView
        style={themedStyles.mainContainer}
        contentContainerStyle={{ paddingBottom: BAR_HEIGHT + 60 }}
        keyboardShouldPersistTaps="handled"
        onScroll={handleScrollServices}
        scrollEventThrottle={400}
      >
        <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
        {/* Shop filter dropdown */}
        {role !== "staff" && shops.length > 0 && (
          <View style={{ flex: 1, overflow: "visible" }}>
            <View style={[themedStyles.input, { padding: 0, height: 44, overflow: 'visible' }]}> 
              <Picker
                mode="dropdown"
                selectedValue={filterShopId}
                onValueChange={(itemValue) => setFilterShopId(itemValue)}
                style={{ color: textColor}}
                itemStyle={{ color: textColor }}
                dropdownIconColor={textColor}
              >
                <Picker.Item label="All Shops" value="" />
                {shops.map((shop) => (
                  <Picker.Item
                    key={shop._id}
                    label={shop.name}
                    value={shop._id}
                  />
                ))}
              </Picker>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={{
            ...themedStyles.button1,
            height: 44,
            borderColor: primaryColor,
            backgroundColor: primaryColor + "33",
            borderWidth: 1,
            borderRadius: 6,
            flex: isStaff ? 1 : undefined,
            minWidth: isStaff ? undefined : 140,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 12,
            marginTop: 0,
            marginBottom: 10
          }}
          onPress={() => navigation.navigate("CreateServiceScreen")}
        >
          <Text style={{ ...global.btnText1, fontSize: 14, color: textColor }}>
            <Entypo name="plus" size={16} color={textColor} /> Add Service
          </Text>
        </TouchableOpacity>
        </View>

        <View>
          <View
            style={{ flexDirection: "row", marginTop: 10, marginBottom: 10 }}
          >
            <TouchableOpacity
              style={{
                flex: 1,
                borderBottomWidth: activeTab === 0 ? 3 : 0,
                borderBottomColor:
                  activeTab === 0 ? primaryColor : "transparent",
                alignItems: "center",
              }}
              onPress={() => setActiveTab(0)}
            >
              <Text
                style={{
                  color: activeTab === 0 ? primaryColor : textColor,
                  paddingBottom: 5,
                  opacity: activeTab === 0 ? 1 : 0.6,
                }}
              >
                Active
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                flex: 1,
                borderBottomWidth: activeTab === 1 ? 3 : 0,
                borderBottomColor:
                  activeTab === 1 ? primaryColor : "transparent",
                alignItems: "center",
              }}
              onPress={() => setActiveTab(1)}
            >
              <Text
                style={{
                  color: activeTab === 1 ? primaryColor : textColor,
                  paddingBottom: 5,
                  opacity: activeTab === 1 ? 1 : 0.6,
                }}
              >
                Completed/Cancelled
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {(() => {
          const baseServices =
            activeTab === 0
              ? services.filter(
                  (service) =>
                    service.status === "pending" ||
                    service.status === "in_progress"
                )
              : services.filter(
                  (service) =>
                    service.status === "completed" ||
                    service.status === "cancelled"
                );

          const filteredServices = baseServices.filter((service) => {
            if (!filterShopId) return true;
            const serviceShopId = service.shop_id?._id || service.shop_id;
            return serviceShopId === filterShopId;
          });

          if (filteredServices.length === 0) {
            return (
              <Text
                style={[
                  themedStyles.textSecondary,
                  { textAlign: "center", marginTop: 20 },
                ]}
              >
                {activeTab === 0
                  ? "No active services (pending/in progress)"
                  : "No completed or cancelled services"}
              </Text>
            );
          }

          const sortedServices = [...filteredServices].sort((a, b) => {
            const dateA =
              activeTab === 0
                ? a.received_date
                  ? new Date(a.received_date).getTime()
                  : 0
                : a.return_date
                ? new Date(a.return_date).getTime()
                : 0;
            const dateB =
              activeTab === 0
                ? b.received_date
                  ? new Date(b.received_date).getTime()
                  : 0
                : b.return_date
                ? new Date(b.return_date).getTime()
                : 0;
            return dateB - dateA;
          });

          const paginatedServices = sortedServices.slice(
            0,
            displayLimitServices
          );
          const hasMoreServices =
            sortedServices.length > paginatedServices.length;

          const groupedServices = paginatedServices.reduce((acc, service) => {
            const serviceDate =
              activeTab === 0
                ? service.received_date
                  ? formatDate(new Date(service.received_date))
                  : getCurrentDate()
                : service.return_date
                ? formatDate(new Date(service.return_date))
                : getCurrentDate();
            if (!acc[serviceDate]) {
              acc[serviceDate] = [];
            }
            acc[serviceDate].push(service);
            return acc;
          }, {});

          const sortedDates = Object.keys(groupedServices).sort(
            (a, b) => new Date(b) - new Date(a)
          );

          return (
            <>
              {sortedDates.map((date) => (
                <View
                  key={date}
                  style={{
                    fontSize: 16,
                    marginTop: 15,
                  }}
                >
                  <Text
                    style={{
                      fontWeight: "bold",
                      color: primaryColor,
                      marginBottom: 10,
                      paddingBottom: 5,
                      textAlign: "center",
                    }}
                  >
                    {activeTab === 0
                      ? `${date} (${groupedServices[date].length})`
                      : `${date} (${groupedServices[date].length})`}
                  </Text>
                  {groupedServices[date].map((service, index) => (
                    <View key={service._id}>
                      <ServiceRow
                        service={service}
                        dateType={activeTab === 0 ? "received" : "return"}
                      />
                    </View>
                  ))}
                </View>
              ))}

              {hasMoreServices && isLoadingMoreServices && (
                <View
                  style={{
                    alignItems: "center",
                    paddingVertical: 20,
                  }}
                >
                  <ActivityIndicator size="small" color={primaryColor} />
                  <Text
                    style={[
                      themedStyles.textSecondary,
                      { marginTop: 8, fontSize: 12 },
                    ]}
                  >
                    Loading more services...
                  </Text>
                </View>
              )}

              {hasMoreServices && !isLoadingMoreServices && (
                <View
                  style={{
                    alignItems: "center",
                    paddingVertical: 15,
                    gap: 8,
                  }}
                >
                  <Text
                    style={{
                      textAlign: "center",
                      color: textSecondary,
                      fontSize: 12,
                    }}
                  >
                    Showing {paginatedServices.length} of{" "}
                    {sortedServices.length} services • Scroll for more
                  </Text>
                  <TouchableOpacity
                    onPress={handleLoadMoreServices}
                    style={{
                      ...themedStyles.button1,
                      paddingVertical: 8,
                      minWidth: 140,
                      alignItems: "center",
                    }}
                  >
                    <Text style={global.btnText}>Load more</Text>
                  </TouchableOpacity>
                </View>
              )}

              {!hasMoreServices && sortedServices.length > 10 && (
                <Text
                  style={{
                    textAlign: "center",
                    color: textSecondary,
                    fontSize: 12,
                    paddingVertical: 15,
                  }}
                >
                  All {sortedServices.length} services loaded
                </Text>
              )}
            </>
          );
        })()}
      </ScrollView>
    </TouchableWithoutFeedback>
  );
};

export default ServicesScreen;
