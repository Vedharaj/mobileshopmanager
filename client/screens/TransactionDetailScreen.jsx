import React, { useState } from "react";
import { View, Text, Alert } from "react-native";
import { useRoute } from "@react-navigation/native";
import TransactionDetailContent from "../components/TransactionDetailContent";
import { useThemeColors } from "../styles/global";
import * as Print from "expo-print";
import { readAsStringAsync } from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Asset } from "expo-asset";
import { populateInvoiceTemplate } from "../utils/invoice";

const TransactionDetailScreen = () => {
  const route = useRoute();
  const item = route.params?.item;
  const { cardBg, textColor, textSecondary } = useThemeColors();
  const [exporting, setExporting] = useState(false);

  const sale = item?.sale || {};

  const handleGenerateInvoice = async () => {
    if (!sale || sale.type !== "sales") {
      Alert.alert("Invoice", "Invoice is available for sales only.");
      return;
    }
    try {
      setExporting(true);

      const asset = Asset.fromModule(require("../assets/templates/invoice1.html"));
      await asset.downloadAsync();

      let templateHtml = "";
      if (asset.uri && asset.uri.startsWith("http")) {
        const res = await fetch(asset.uri);
        templateHtml = await res.text();
      } else {
        templateHtml = await readAsStringAsync(asset.localUri || asset.uri, {
          encoding: "utf8",
        });
      }

      const filledHtml = populateInvoiceTemplate(templateHtml, sale, item);
      const pdfFileName = sale.invoice_no
        ? `invoice-${sale.invoice_no}`
        : `invoice-${Date.now()}`;
      const { uri } = await Print.printToFileAsync({
        html: filledHtml,
        fileName: pdfFileName,
      });

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

  if (!item) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: cardBg }}>
        <Text style={{ color: textColor, fontSize: 16, fontWeight: "600" }}>
          Transaction not found
        </Text>
        <Text style={{ color: textSecondary, marginTop: 6 }}>Go back and try again.</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: cardBg }}>
      <TransactionDetailContent
        item={item}
        exporting={exporting}
        onGenerateInvoice={handleGenerateInvoice}
      />
    </View>
  );
};

export default TransactionDetailScreen;
