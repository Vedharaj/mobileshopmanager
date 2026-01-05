export const populateInvoiceTemplate = (templateHtml, sale, transaction) => {
  const formatCurrency = (val) => `₹${Number(val || 0).toFixed(2)}`;
  const formatDate = (val) => {
    try {
      return new Date(val).toLocaleDateString("en-IN");
    } catch (e) {
      return new Date().toLocaleDateString("en-IN");
    }
  };

  const shop = sale.shop_id || {};
  const customer = sale.customer_id || {};
  const items = Array.isArray(sale.items) ? sale.items : [];

  const { itemsRows, subtotal, taxTotal, grandTotal } = buildInvoiceItems(items, sale);

  const placeholders = {
    "{{invoice_no}}": sale.invoice_no || "N/A",
    "{{invoice_date}}": formatDate(
      sale.createdAt || sale.created_at || transaction?.date || Date.now()
    ),
    "{{company_name}}": shop.name || "Shop",
    "{{company_address}}": shop.address || shop.street || "",
    "{{company_phone}}": shop.contact_no || shop.phone || "",
    "{{company_gstin}}": shop.gstin || "",
    "{{customer_name}}": customer.name || "Walk-in",
    "{{customer_address}}": customer.address || "",
    "{{customer_phone}}": customer.contact_no || customer.phone || customer.phone_no || "",
    "{{payment_method}}": sale.payment_method || "N/A",
    "{{items_rows}}": itemsRows,
    "{{subtotal}}": formatCurrency(subtotal),
    "{{total_tax}}": formatCurrency(taxTotal),
    "{{invoice_total}}": formatCurrency(grandTotal),
  };

  return Object.entries(placeholders).reduce((html, [token, value]) => {
    const safeValue = value === undefined || value === null ? "" : String(value);
    return html.replace(new RegExp(token, "g"), safeValue);
  }, templateHtml);
};

export const buildInvoiceItems = (items, sale) => {
  let subtotal = 0;
  let taxTotal = 0;
  const formatCurrency = (val) => `₹${Number(val || 0).toFixed(2)}`;

  const rows = items.length
    ? items
        .map((it) => {
          const name = it.product_id?.name || it.name || "Item";
          const qty = Number(it.quantity || 0);
          const unitPrice = Number(it.unit_price || 0);
          const cgst = Number(it.cgst ?? it.product_id?.cgst ?? 0);
          const sgst = Number(it.sgst ?? it.product_id?.sgst ?? 0);
          const taxPercent = Number(
            it.tax_percent ??
              it.product_id?.tax_percent ??
              sale.tax_percent ??
              cgst + sgst
          );
          const lineSubtotal = unitPrice * qty;
          const taxAmount = Number(
            it.tax_amount ?? lineSubtotal * (taxPercent / 100)
          );
          const lineTotal = Number(it.total_price ?? lineSubtotal + taxAmount);

          subtotal += lineSubtotal;
          taxTotal += taxAmount;

          return `
            <tr>
              <td>${name}</td>
              <td>${formatCurrency(unitPrice)}</td>
              <td>${qty}</td>
              <td>${taxPercent}%</td>
              <td>${formatCurrency(taxAmount)}</td>
              <td>${formatCurrency(lineTotal)}</td>
            </tr>`;
        })
        .join("")
    : '<tr><td colspan="6" style="text-align:center; padding: 12px;">No items</td></tr>';

  const grandTotal =
    sale.total_amount != null ? Number(sale.total_amount) : subtotal + taxTotal;
  return { itemsRows: rows, subtotal, taxTotal, grandTotal };
};
