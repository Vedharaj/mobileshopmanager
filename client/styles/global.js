import { StyleSheet, StatusBar, Platform } from 'react-native';

const STATUSBAR_HEIGHT = Platform.OS === "android" ? StatusBar.currentHeight || 0 : 0;

export const global = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 16,
    backgroundColor: '#ffffff'
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 6,
    marginBottom: 12,
    fontSize: 12
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    marginHorizontal: 2,
  },
  message: {
    fontSize: 18,
    marginBottom: 12,
    fontWeight: '500'
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
    fontSize: 24,
    fontWeight: "400",
    flex: 1,
  },
  navbarRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  navbarDate: {
    color: "#111",
    fontSize: 14,
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
});