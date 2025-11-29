import { StyleSheet, StatusBar, Platform } from "react-native";
import { useSelector } from "react-redux";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const STATUSBAR_HEIGHT =
  Platform.OS === "android" ? StatusBar.currentHeight || 0 : 0;

// BottomNavbar constants (moved here to avoid circular dependency)
export const BAR_HEIGHT = 64;
export const CENTER_DIAMETER = 72;

// Default static colors (fallback)
export const PRIMARY_COLOR_DEFAULT = "#2a81d3ff";
export const SECONDARY_COLOR_DEFAULT = "#90CAF9";

// Custom hook to access theme colors
export const useThemeColors = () => {
  const { primaryColor, secondaryColor } = useSelector((state) => state.theme);
  return { primaryColor, secondaryColor };
};

export const global = StyleSheet.create({
  authlink: {
    marginTop: 15,
    textAlign: "center",
    color: "blue",
  },
  button: {
    backgroundColor: PRIMARY_COLOR_DEFAULT,
    padding: 8,
    borderRadius: 8,
    marginTop: 10,
  },
  btnText: { color: "#fff", textAlign: "center", fontSize: 14 },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
  },
  error: { color: "red", marginBottom: 10 },
  authcontainer: {
    flex: 1,
    paddingBottom: 16,
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  mainContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    paddingBottom: 16,
    backgroundColor: "#fff",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 6,
    marginBottom: 12,
    fontSize: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 8,
    marginHorizontal: 2,
  },
  message: {
    fontSize: 18,
    marginBottom: 12,
    fontWeight: "500",
  },
  navbarContainer: {
    width: "100%",
    alignSelf: "stretch",
    paddingTop: STATUSBAR_HEIGHT > 0 ? STATUSBAR_HEIGHT : 12,
    paddingVertical: 12,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  navbarName: {
    color: "#111",
    fontSize: 18,
    fontWeight: "400",
    flex: 1,
  },
  navbarRole: {
    color: PRIMARY_COLOR_DEFAULT, // Use default static color here
    fontSize: 12,
  },
  navbarRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  navbarDate: {
    color: "#111",
    fontSize: 12,
    fontWeight: "500",
    marginRight: 8,
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  logoutBtn: {
    padding: 8,
    borderRadius: 6,
  },

  scannerContainer: {
    flex: 1,
    backgroundColor: "black",
  },
  scannerTopBar: {
    position: "absolute",
    top: 40,
    left: 16,
    right: 16,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  backButtonTransparent: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#00000088",
    borderRadius: 999,
    marginRight: 8,
  },
  backButtonText: {
    color: "white",
    fontSize: 14,
  },
  scannerTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#00000088",
  },
  scanBox: {
    width: 260,
    height: 260,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#22c55e",
    overflow: "hidden",
    backgroundColor: "#00000055",
  },
  scanLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: "#22c55e",
  },
  scanHint: {
    color: "white",
    marginTop: 16,
    fontSize: 12,
  },

  // permission
  permissionContainer: {
    flex: 1,
    backgroundColor: "#020617",
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  permissionTitle: {
    color: "white",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 12,
  },
  permissionText: {
    color: "#9ca3af",
    fontSize: 12,
    marginBottom: 24,
  },
  backButton: {
    position: "absolute",
    top: 40,
    left: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#111827",
    borderRadius: 999,
  },

  //buttons
  button1: {
    backgroundColor: "#000",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 28,
    marginTop: 10,
  },
  btnText1: { color: "#fff", textAlign: "center", fontSize: 12 },

  //profile screen
  profileHeader: {
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
    paddingTop: STATUSBAR_HEIGHT > 0 ? STATUSBAR_HEIGHT : 12,
  },
  profileIcon: {
    backgroundColor: PRIMARY_COLOR_DEFAULT, // Use default static color here
    padding: 16,
    borderRadius: 999,
  },
  profileContainer: {
    flexDirection: "column",
    gap: 8,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    borderRadius: 24,
    marginBottom: 10,
    backgroundColor: "#f3f3f3ff",
  },
  profileRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#dcdbdbff",
  },
  profileRowLast: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  fab: {
    position: "absolute",
    height: BAR_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    right: 20,
    bottom: 10 + BAR_HEIGHT / 2 + 12,
    borderRadius: 28,
    padding: 12,
  },
  fabText: {
    color: "white",
    marginLeft: 8,
    fontSize: 12,
    fontWeight: "bold",
  },
  productLabel: {
    backgroundColor: "#ccc",
    fontSize: 12,
    padding: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
  },
});
