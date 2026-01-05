import React, { useState } from "react";
import { View, Text, Modal, TouchableOpacity, TouchableWithoutFeedback, Alert } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useThemeColors } from "../../styles/global";
import TransactionDetailContent from "../TransactionDetailContent";
import * as Print from "expo-print";
import { readAsStringAsync } from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Asset } from "expo-asset";
import { populateInvoiceTemplate } from "../../utils/invoice";

const TransactionDetailModal = ({ visible, onClose, item }) => {
  const [exporting, setExporting] = useState(false);
  const { cardBg, textColor, textSecondary, borderColor } = useThemeColors();

  if (!item) return null;

  const sale = item.sale || {};

  const handleGenerateInvoice = async () => {
    if (!sale) return;
    if (sale.type !== 'sales') {
      Alert.alert('Invoice', 'Invoice is available for sales only.');
      return;
    }
    try {
      setExporting(true);

      const asset = Asset.fromModule(require("../../assets/templates/invoice1.html"));
      await asset.downloadAsync();


      let templateHtml = "";
      if (asset.uri && asset.uri.startsWith("http")) {
        const res = await fetch(asset.uri);
        templateHtml = await res.text();
      } else {
        templateHtml = await readAsStringAsync(asset.localUri || asset.uri, { encoding: 'utf8' });
      }

      const filledHtml = populateInvoiceTemplate(templateHtml, sale, item);
      const pdfFileName = sale.invoice_no ? `invoice-${sale.invoice_no}` : `invoice-${Date.now()}`;
      const { uri } = await Print.printToFileAsync({ html: filledHtml, fileName: pdfFileName });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, { UTI: "com.adobe.pdf", mimeType: "application/pdf" });
      } else {
        Alert.alert("Invoice generated", `PDF saved to: ${uri}`);
      }
    } catch (err) {
      Alert.alert("Invoice error", err?.message || "Could not generate invoice.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" }}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={{ backgroundColor: cardBg, borderTopLeftRadius: 20, borderTopRightRadius: 20, height: "90%" }}>
              {/* Modal Header */}
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, borderBottomWidth: 1, borderBottomColor: borderColor }}>
                <Text style={{ fontSize: 18, fontWeight: "700", color: textColor }}>Transaction Details</Text>
                <TouchableOpacity onPress={onClose}>
                  <MaterialIcons name="close" size={28} color={textSecondary} />
                </TouchableOpacity>
              </View>

              <TransactionDetailContent
                item={item}
                exporting={exporting}
                onGenerateInvoice={handleGenerateInvoice}
              />
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default TransactionDetailModal;
