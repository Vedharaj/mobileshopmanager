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
  
   scannerContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  scannerTopBar: {
    position: 'absolute',
    top: 40,
    left: 16,
    right: 16,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonTransparent: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#00000088',
    borderRadius: 999,
    marginRight: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
  },
  scannerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#00000088',
  },
  scanBox: {
    width: 260,
    height: 260,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#22c55e',
    overflow: 'hidden',
    backgroundColor: '#00000055',
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#22c55e',
  },
  scanHint: {
    color: 'white',
    marginTop: 16,
    fontSize: 14,
  },

  // permission
  permissionContainer: {
    flex: 1,
    backgroundColor: '#020617',
    padding: 24,
    justifyContent: 'center',
  },
  permissionTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
  },
  permissionText: {
    color: '#9ca3af',
    fontSize: 14,
    marginBottom: 24,
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#111827',
    borderRadius: 999,
  },
});