import React, { useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ScrollView,
} from "react-native";
import { CARD_BG, BG_COLOR } from "../styles/global";
import { useDispatch, useSelector } from "react-redux";
import { setTheme, saveThemeToStorage } from "../store/slices/themeSlice";
import { useThemeColors, useThemedStyles } from "../styles/global";

const colorData = [
  {
    name: "Modern Blue",
    primary: { hex: "#1E88E5", name: "Dodger Blue" },
    secondary: { hex: "#90CAF9", name: "Light Sky Blue" },
  },
  {
    name: "Danger Red",
    primary: { hex: "#C62828", name: "Fire Brick" },
    secondary: { hex: "#FFCDD2", name: "Rosy Pink" },
  },
  {
    name: "Eco Green",
    primary: { hex: "#2E7D32", name: "Forest Green" },
    secondary: { hex: "#A5D6A7", name: "Mint Green" },
  },
  {
    name: "Royal Purple",
    primary: { hex: "#6A1B9A", name: "Purple Heart" },
    secondary: { hex: "#CE93D8", name: "Lavender Pink" },
  },
  {
    name: "Energy Orange",
    primary: { hex: "#FF8F00", name: "Orange Peel" },
    secondary: { hex: "#FFE082", name: "Peach Cream" },
  },
  {
    name: "Aqua Teal",
    primary: { hex: "#00897B", name: "Deep Teal" },
    secondary: { hex: "#80CBC4", name: "Soft Aqua" },
  },
  {
    name: "Cozy Brown",
    primary: { hex: "#5D4037", name: "Café Brown" },
    secondary: { hex: "#BCAAA4", name: "Sand Beige" },
  },
  {
    name: "Tech Gray",
    primary: { hex: "#37474F", name: "Charcoal Gray" },
    secondary: { hex: "#B0BEC5", name: "Steel Gray" },
  },
  {
    name: "Warm Sunset",
    primary: { hex: "#F4511E", name: "Burnt Orange" },
    secondary: { hex: "#FFCCBC", name: "Soft Coral" },
  },
  {
    name: "Corporate Blue",
    primary: { hex: "#1976D2", name: "Royal Blue" },
    secondary: { hex: "#BBDEFB", name: "Powder Blue" },
  },
  {
    name: "Calm Sky",
    primary: { hex: "#4FC3F7", name: "Sky Blue" },
    secondary: { hex: "#E1F5FE", name: "Light Ice Blue" },
  },
  {
    name: "Golden Sand",
    primary: { hex: "#D68910", name: "Amber Gold" },
    secondary: { hex: "#FAD7A0", name: "Soft Sand" },
  },
  {
    name: "Forest Mist",
    primary: { hex: "#1B5E20", name: "Deep Forest Green" },
    secondary: { hex: "#A9DFBF", name: "Light Mint" },
  },
  {
    name: "Royal Sunset",
    primary: { hex: "#8E24AA", name: "Rich Purple" },
    secondary: { hex: "#F3E5F5", name: "Soft Lavender" },
  },
  {
    name: "Slate Blue",
    primary: { hex: "#3949AB", name: "Indigo" },
    secondary: { hex: "#C5CAE9", name: "Fog Blue" },
  },
  {
    name: "Rose Charm",
    primary: { hex: "#E91E63", name: "Rose Pink" },
    secondary: { hex: "#F8BBD0", name: "Baby Pink" },
  },
  {
    name: "Cyber Yellow",
    primary: { hex: "#FBC02D", name: "Bright Yellow" },
    secondary: { hex: "#FFF9C4", name: "Cream" },
  },
  {
    name: "Azure Glow",
    primary: { hex: "#039BE5", name: "Blue Glow" },
    secondary: { hex: "#B3E5FC", name: "Clear Sky Blue" },
  },
];

const ThemeSettings = () => {
  const dispatch = useDispatch();
  const currentTheme = useSelector((state) => state.theme);
  const themedStyles = useThemedStyles();
  const { bgColor, textColor, cardBg } = useThemeColors();

  const handleThemeChange = (theme) => {
    const newTheme = {
      primaryColor: theme.primary.hex,
      secondaryColor: theme.secondary.hex,
      themeName: theme.name,
      isDarkMode: currentTheme.isDarkMode,
    };
    dispatch(setTheme(newTheme));
    dispatch(saveThemeToStorage(newTheme));
  };

  const renderThemeItem = ({ item }) => (
    <TouchableOpacity
      style={{
        ...styles.themeItem,
        backgroundColor:
          currentTheme.primaryColor === item.primary.hex ? "#7be4a5" : cardBg,
        borderWidth: currentTheme.primaryColor === item.primary.hex ? 2 : 1,
        borderColor:
          currentTheme.primaryColor === item.primary.hex ? "#38ff87ff" : "#ccc",
      }}
      onPress={() => handleThemeChange(item)}
    >
      <View style={{...styles.colorBoxRow}}>
        <View
          style={{
            ...styles.colorBox,
            backgroundColor: item.primary.hex,
          }}
        />
        <View
          style={{ ...styles.colorBox, backgroundColor: item.secondary.hex }}
        />
      </View>
      <Text style={{...styles.themeName, color: textColor}}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={[global.mainContainer, { backgroundColor: bgColor, padding: 6 }]}
      contentContainerStyle={{ flexGrow: 1 }}
    >
      <FlatList
        data={colorData}
        renderItem={renderThemeItem}
        keyExtractor={(item) => item.name}
        numColumns={3} // Display in 3 columns
        columnWrapperStyle={styles.columnWrapper}
        scrollEnabled={false}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  columnWrapper: {
    justifyContent: "space-between",
    marginBottom: 15,
  },
  themeItem: {
    alignItems: "center",
    marginBottom: 10,
    padding: 10,
    backgroundColor: CARD_BG,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    flex: 1,
    marginHorizontal: 5,
  },
  colorBoxRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  colorBox: {
    width: 40,
    height: 40,
    borderRadius: 999,
  },
  themeName: {
    fontSize: 14,
    fontWeight: "500",
    marginTop: 4,
    textAlign: "center",
  },
});

export default ThemeSettings;
