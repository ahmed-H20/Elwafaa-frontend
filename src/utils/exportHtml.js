/**
 * Utility to generate and open an invoice in a new blank HTML page
 * with full invoice design and print / download controls.
 */

function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function buildClientInvoiceHTML(invoice, options = {}) {
  const { autoPrint = false } = options;

  const rawItems = Array.isArray(invoice.items)
    ? invoice.items
    : (Array.isArray(invoice.products) ? invoice.products : []);

  const items = rawItems.map((item) => ({
    name: item.name || "",
    quantity: item.quantity !== undefined ? item.quantity : (item.qty !== undefined ? item.qty : 1),
    price: Number(item.price || 0),
  }));

  const subtotal = items.reduce(
    (acc, it) => acc + Number(it.quantity || 0) * Number(it.price || 0),
    0
  );
  const taxRate = Number(invoice.tax || 0);
  const calculatedTotal =
    invoice.total !== undefined && invoice.total !== null
      ? Number(invoice.total)
      : subtotal + (subtotal * taxRate) / 100;

  const invoiceNumber =
    invoice.invoiceNumber || invoice.id || invoice._id || "1";
  const customerName =
    invoice.customerName || invoice.clientName || invoice.name || "";
  const invoiceDate =
    invoice.invoiceDate || invoice.date || new Date().toISOString().split("T")[0];
  const invoiceId =
    invoice._id && !String(invoice._id).startsWith("inv-") ? invoice._id : "";

  const itemsHTML = items
    .map(
      (item, index) => `
    <tr>
      <td class="col-num">${index + 1}</td>
      <td class="col-desc">${escapeHTML(item.name)}</td>
      <td class="col-qty">${item.quantity ?? ""}</td>
      <td class="col-price">${Number(item.price || 0).toFixed(2)}</td>
      <td class="col-total">${(Number(item.quantity || 0) * Number(item.price || 0)).toFixed(2)}</td>
    </tr>
  `
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=3.0">
  <title>فاتورة مبيعات #${escapeHTML(invoiceNumber)} - شركة الوفاء للمستلزمات</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=Tajawal:wght@400;500;700;800&display=swap" rel="stylesheet">
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    @page {
      size: A4;
      margin: 0;
    }

    html, body {
      margin: 0;
      padding: 0;
      background: #f1f5f9;
      font-family: 'Cairo', 'Tajawal', Tahoma, Arial, sans-serif;
      color: #111827;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* Action Bar (Top Screen controls) */
    .action-bar {
      position: sticky;
      top: 0;
      left: 0;
      right: 0;
      z-index: 9999;
      background: linear-gradient(135deg, #0d3b41 0%, #135d66 100%);
      color: #ffffff;
      padding: 10px 16px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.18);
      border-bottom: 2px solid #d6b374;
    }

    .action-bar-inner {
      max-width: 1000px;
      margin: 0 auto;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .action-info {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .action-title {
      font-size: 15px;
      font-weight: 800;
      color: #ffffff;
    }

    .action-client {
      font-size: 13px;
      font-weight: 600;
      color: #e0f2fe;
      background: rgba(255, 255, 255, 0.12);
      padding: 3px 10px;
      border-radius: 999px;
    }

    .action-buttons {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .act-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 8px 14px;
      border-radius: 8px;
      font-family: inherit;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.2s ease;
      border: none;
      white-space: nowrap;
    }

    .btn-print {
      background-color: #d6b374;
      color: #111827;
      box-shadow: 0 2px 6px rgba(214, 179, 116, 0.4);
    }
    .btn-print:hover {
      background-color: #c49f5c;
      transform: translateY(-1px);
    }

    .btn-download {
      background-color: #ffffff;
      color: #135d66;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
    }
    .btn-download:hover {
      background-color: #f8fafc;
      transform: translateY(-1px);
    }

    .btn-whatsapp {
      background-color: #25d366;
      color: #ffffff;
      box-shadow: 0 2px 6px rgba(37, 211, 102, 0.35);
    }
    .btn-whatsapp:hover {
      background-color: #20bd5a;
      transform: translateY(-1px);
    }

    .btn-close {
      background-color: rgba(255, 255, 255, 0.15);
      color: #ffffff;
    }
    .btn-close:hover {
      background-color: rgba(255, 255, 255, 0.25);
    }

    /* Page Viewport & Invoice Sheet */
    .page-viewport {
      display: flex;
      justify-content: center;
      align-items: flex-start;
      padding: 24px 12px 60px;
      min-height: 100vh;
      overflow-x: auto;
    }

    .invoice-container {
      width: 210mm;
      min-height: 297mm;
      position: relative;
      padding: 0 16mm 16mm 16mm;
      background: #ffffff;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
      border-radius: 4px;
    }

    /* Top & Bottom Bars */
    .top-bar {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 9mm;
      background-color: #135d66;
    }

    .bottom-bar {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 9mm;
      background-color: #135d66;
    }

    /* Header */
    .header {
      padding-top: 14mm;
      width: 100%;
    }

    .logo-wrapper {
      display: flex;
      justify-content: center;
      align-items: center;
      margin-bottom: 2mm;
    }

    .logo-img {
      max-width: 38mm;
      max-height: 28mm;
      object-fit: contain;
    }

    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-top: 2mm;
      direction: ltr;
    }

    .invoice-title {
      direction: rtl;
      color: #135d66;
      font-size: 34pt;
      font-weight: 800;
      line-height: 1.1;
      letter-spacing: -0.5px;
      margin-top: 2mm;
    }

    .invoice-meta {
      direction: rtl;
      text-align: right;
      font-size: 13pt;
      font-weight: 600;
      line-height: 1.85;
      color: #1a1a1a;
    }

    .meta-item {
      display: flex;
      align-items: baseline;
      gap: 6px;
      white-space: nowrap;
    }

    .meta-label {
      font-weight: 700;
      color: #222;
    }

    .meta-value {
      font-weight: 600;
      color: #333;
    }

    /* Table */
    .table-container {
      margin-top: 6mm;
      width: 100%;
    }

    .items-table {
      width: 100%;
      border-collapse: collapse;
      direction: rtl;
      font-size: 12pt;
    }

    .items-table thead {
      background-color: #d6b374;
    }

    .items-table th {
      height: 11mm;
      padding: 2mm 3mm;
      font-size: 13pt;
      font-weight: 800;
      color: #111;
      text-align: center;
      border: none;
    }

    .items-table td {
      height: 10.5mm;
      padding: 1.5mm 3mm;
      text-align: center;
      border-bottom: 1.2px solid #2b2b2b;
      font-size: 12pt;
      font-weight: 600;
      color: #222;
    }

    .col-num { width: 8%; }
    .col-desc { width: 44%; text-align: center; }
    .col-qty { width: 16%; }
    .col-price { width: 16%; }
    .col-total { width: 16%; }

    /* Middle Section */
    .middle-section {
      margin-top: 6mm;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      direction: ltr;
    }

    .summary-box {
      width: 65mm;
      direction: rtl;
      display: flex;
      flex-direction: column;
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 2.5mm 3mm;
      font-size: 12.5pt;
      font-weight: 700;
      color: #1a1a1a;
    }

    .summary-label-stacked {
      text-align: center;
      line-height: 1.15;
      font-size: 11.5pt;
      font-weight: 700;
    }

    .summary-row-total {
      background-color: #d6b374;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 3mm 4mm;
      font-size: 13.5pt;
      font-weight: 800;
      color: #111;
      margin-top: 1mm;
    }

    .thanks-message {
      direction: rtl;
      color: #135d66;
      font-size: 26pt;
      font-weight: 700;
      margin-top: 14mm;
      margin-right: 22mm;
      letter-spacing: -0.5px;
    }

    /* Notes */
    .notes-section {
      margin-top: 8mm;
      direction: rtl;
      text-align: right;
      padding-right: 2mm;
    }

    .notes-heading {
      color: #135d66;
      font-size: 14pt;
      font-weight: 800;
      margin-bottom: 2mm;
    }

    .notes-list {
      list-style-type: none;
      padding: 0;
      margin: 0;
      font-size: 10.5pt;
      font-weight: 600;
      color: #222;
    }

    .notes-list li {
      position: relative;
      padding-right: 14px;
    }

    .notes-list li::before {
      content: "•";
      position: absolute;
      right: 0;
      color: #222;
      font-size: 14pt;
      line-height: 1;
      top: -1px;
    }

    /* Footer */
    .footer-section {
      position: absolute;
      bottom: 14mm;
      right: 16mm;
      direction: rtl;
      display: flex;
      flex-direction: column;
      gap: 2mm;
      align-items: flex-start;
    }

    .footer-contact-row {
      display: flex;
      align-items: center;
      gap: 2.5mm;
      direction: rtl;
    }

    .footer-icon-box {
      width: 5.5mm;
      height: 5.5mm;
      background-color: #135d66;
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 1px;
      flex-shrink: 0;
    }

    .footer-icon-box svg {
      width: 3.5mm;
      height: 3.5mm;
      fill: #ffffff;
    }

    .footer-text {
      font-size: 10pt;
      font-weight: 700;
      color: #222222;
      font-family: 'Cairo', Tahoma, sans-serif;
      direction: ltr;
      text-align: right;
    }

/* =========================================
   MOBILE SCREEN
   ========================================= */

@media screen and (max-width: 820px) {

  html,
  body {
    width: 100%;
    overflow-x: hidden;
  }

  .page-viewport {
    width: 100%;
    padding: 10px;
    overflow-x: hidden;
  }

  .invoice-container {
    width: 100%;
    min-height: auto;
    padding: 0 15px 30px;
    box-sizing: border-box;
  }

  /* =========================
     HEADER
     ========================= */

  .header {
    padding-top: 20px;
  }

  .header-row {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 15px;
  }

  .invoice-title {
    text-align: center;
    font-size: 28px;
    order: 1;
  }

  .invoice-meta {
    width: 100%;
    order: 2;
  }

  .meta-item {
    display: flex;
    justify-content: space-between;
    width: 100%;
    padding: 7px 0;
  }


  /* =========================
     ITEMS
     ========================= */

  .table-container {
    width: 100%;
    overflow-x: hidden;
  }

  .items-table {
    width: 100%;
    table-layout: fixed;
  }

  .items-table th,
  .items-table td {
    padding: 8px 4px;
    word-break: break-word;
    overflow-wrap: anywhere;
  }


  /* =========================
     SUMMARY + THANK YOU
     ========================= */

  .middle-section {
    display: flex;
    flex-direction: column;
    width: 100%;
    gap: 20px;
  }

  .summary-box {
    width: 100%;
  }

  .thanks-message {
    width: 100%;
    text-align: center;
    margin: 0;
  }


  /* =========================
     NOTES
     ========================= */

  .notes-section {
    width: 100%;
    padding: 0;
  }


  /* =========================
     FOOTER
     ========================= */

  .footer-section {
    position: static;
    width: 100%;
    margin-top: 25px;
  }
}


/* =========================================
   VERY SMALL MOBILE
   ========================================= */

@media screen and (max-width: 480px) {

  .page-viewport {
    padding: 5px;
  }

  .invoice-container {
    padding-left: 10px;
    padding-right: 10px;
  }

  .invoice-title {
    font-size: 24px;
  }

  .items-table {
    font-size: 11px;
  }

  .items-table th,
  .items-table td {
    padding: 6px 3px;
  }
}
 /* =========================================
   VERY SMALL MOBILE
   ========================================= */

@media screen and (max-width: 480px) {

  .page-viewport {
    padding: 5px;
  }

  .invoice-container {
    padding-left: 10px;
    padding-right: 10px;
  }

  .invoice-title {
    font-size: 24px;
  }

  .items-table {
    font-size: 11px;
  }

  .items-table th,
  .items-table td {
    padding: 6px 3px;
  }
}


/* ================================
   PRINT IN A4 (EXACT SINGLE-PAGE A4)
================================ */
@media print {
  @page {
    size: A4 portrait;
    margin: 0;
  }

  /* Completely hide all screen/navigation elements */
  .no-print,
  .action-bar,
  header.action-bar {
    display: none !important;
  }

  html,
  body {
    width: 210mm !important;
    height: 297mm !important;
    min-height: 297mm !important;
    max-height: 297mm !important;
    margin: 0 !important;
    padding: 0 !important;
    background: #ffffff !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    overflow: hidden !important;
  }

  .page-viewport {
    padding: 0 !important;
    margin: 0 !important;
    display: block !important;
    width: 210mm !important;
    height: 297mm !important;
    min-height: 297mm !important;
    max-height: 297mm !important;
    overflow: hidden !important;
    background: #ffffff !important;
  }

  .invoice-container {
    width: 210mm !important;
    height: 297mm !important;
    min-height: 297mm !important;
    max-height: 297mm !important;
    padding: 0 16mm 16mm 16mm !important;
    box-shadow: none !important;
    border-radius: 0 !important;
    position: relative !important;
    box-sizing: border-box !important;
    display: flex !important;
    flex-direction: column !important;
    background: #ffffff !important;
    page-break-after: avoid !important;
    page-break-inside: avoid !important;
    break-inside: avoid !important;
    overflow: hidden !important;
  }

  /* Top & bottom teal bars */
  .top-bar {
    position: absolute !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    height: 9mm !important;
    background-color: #135d66 !important;
  }

  .bottom-bar {
    position: absolute !important;
    bottom: 0 !important;
    left: 0 !important;
    right: 0 !important;
    height: 9mm !important;
    background-color: #135d66 !important;
  }

  /* Header Section */
  .header {
    padding-top: 14mm !important;
    width: 100% !important;
  }

  .logo-wrapper {
    display: flex !important;
    justify-content: center !important;
    align-items: center !important;
    margin-bottom: 2mm !important;
  }

  .logo-img {
    max-width: 38mm !important;
    max-height: 28mm !important;
    object-fit: contain !important;
  }

  .header-row {
    display: flex !important;
    flex-direction: row !important;
    justify-content: space-between !important;
    align-items: flex-start !important;
    margin-top: 2mm !important;
    direction: ltr !important;
    width: 100% !important;
    gap: 0 !important;
  }

  .invoice-title {
    direction: rtl !important;
    color: #135d66 !important;
    font-size: 34pt !important;
    font-weight: 800 !important;
    line-height: 1.1 !important;
    letter-spacing: -0.5px !important;
    margin-top: 2mm !important;
    text-align: right !important;
    width: auto !important;
  }

  .invoice-meta {
    direction: rtl !important;
    text-align: right !important;
    font-size: 13pt !important;
    font-weight: 600 !important;
    line-height: 1.85 !important;
    color: #1a1a1a !important;
    width: auto !important;
  }

  .meta-item {
    display: flex !important;
    align-items: baseline !important;
    gap: 6px !important;
    white-space: nowrap !important;
    border-bottom: none !important;
    padding: 0 !important;
    width: auto !important;
  }

  .meta-label {
    font-weight: 700 !important;
    color: #222 !important;
  }

  .meta-value {
    font-weight: 600 !important;
    color: #333 !important;
    text-align: right !important;
  }

  /* Items Table */
  .table-container {
    margin-top: 6mm !important;
    width: 100% !important;
    overflow: visible !important;
  }

  .items-table {
    width: 100% !important;
    border-collapse: collapse !important;
    direction: rtl !important;
    font-size: 12pt !important;
    table-layout: auto !important;
  }

  .items-table thead {
    background-color: #d6b374 !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  .items-table th {
    height: 11mm !important;
    padding: 2mm 3mm !important;
    font-size: 13pt !important;
    font-weight: 800 !important;
    color: #111 !important;
    text-align: center !important;
    border: none !important;
    background-color: #d6b374 !important;
    line-height: normal !important;
  }

  .items-table td {
    height: 10.5mm !important;
    padding: 1.5mm 3mm !important;
    text-align: center !important;
    border-bottom: 1.2px solid #2b2b2b !important;
    font-size: 12pt !important;
    font-weight: 600 !important;
    color: #222 !important;
    line-height: normal !important;
    word-break: normal !important;
    overflow-wrap: normal !important;
  }

  .col-num { width: 8% !important; }
  .col-desc { width: 44% !important; text-align: center !important; }
  .col-qty { width: 16% !important; }
  .col-price { width: 16% !important; }
  .col-total { width: 16% !important; }

  /* Summary Section */
  .middle-section {
    margin-top: 6mm !important;
    display: flex !important;
    flex-direction: row !important;
    justify-content: space-between !important;
    align-items: flex-start !important;
    direction: ltr !important;
    width: 100% !important;
    gap: 0 !important;
  }

  .summary-box {
    width: 65mm !important;
    direction: rtl !important;
    display: flex !important;
    flex-direction: column !important;
  }

  .summary-row {
    display: flex !important;
    justify-content: space-between !important;
    align-items: center !important;
    padding: 2.5mm 3mm !important;
    font-size: 12.5pt !important;
    font-weight: 700 !important;
    color: #1a1a1a !important;
  }

  .summary-label-stacked {
    text-align: center !important;
    line-height: 1.15 !important;
    font-size: 11.5pt !important;
    font-weight: 700 !important;
  }

  .summary-row-total {
    background-color: #d6b374 !important;
    display: flex !important;
    justify-content: space-between !important;
    align-items: center !important;
    padding: 3mm 4mm !important;
    font-size: 13.5pt !important;
    font-weight: 800 !important;
    color: #111 !important;
    margin-top: 1mm !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  .thanks-message {
    direction: rtl !important;
    color: #135d66 !important;
    font-size: 26pt !important;
    font-weight: 700 !important;
    margin-top: 14mm !important;
    margin-right: 22mm !important;
    margin-left: 0 !important;
    letter-spacing: -0.5px !important;
    text-align: right !important;
    width: auto !important;
  }

  /* Notes */
  .notes-section {
    margin-top: 8mm !important;
    direction: rtl !important;
    text-align: right !important;
    padding-right: 2mm !important;
    width: 100% !important;
  }

  .notes-heading {
    color: #135d66 !important;
    font-size: 14pt !important;
    font-weight: 800 !important;
    margin-bottom: 2mm !important;
  }

  .notes-list {
    list-style-type: none !important;
    padding: 0 !important;
    margin: 0 !important;
    font-size: 10.5pt !important;
    font-weight: 600 !important;
    color: #222 !important;
  }

  .notes-list li {
    position: relative !important;
    padding-right: 14px !important;
  }

  .notes-list li::before {
    content: "•" !important;
    position: absolute !important;
    right: 0 !important;
    color: #222 !important;
    font-size: 14pt !important;
    line-height: 1 !important;
    top: -1px !important;
  }

  /* Footer */
  .footer-section {
    position: absolute !important;
    bottom: 14mm !important;
    right: 16mm !important;
    margin-top: 0 !important;
    padding-bottom: 0 !important;
    direction: rtl !important;
    display: flex !important;
    flex-direction: column !important;
    gap: 2mm !important;
    align-items: flex-start !important;
    width: auto !important;
  }

  .footer-contact-row {
    display: flex !important;
    align-items: center !important;
    gap: 2.5mm !important;
    direction: rtl !important;
  }

  .footer-icon-box {
    width: 5.5mm !important;
    height: 5.5mm !important;
    background-color: #135d66 !important;
    color: #ffffff !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    border-radius: 1px !important;
    flex-shrink: 0 !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  .footer-icon-box svg {
    width: 3.5mm !important;
    height: 3.5mm !important;
    fill: #ffffff !important;
  }

  .footer-text {
    font-size: 10pt !important;
    font-weight: 700 !important;
    color: #222222 !important;
    font-family: 'Cairo', Tahoma, sans-serif !important;
    direction: ltr !important;
    text-align: right !important;
  }
}
  </style>
</head>

<body>
  <header class="action-bar no-print">
    <div class="action-bar-inner">
      <div class="action-info">
        <span class="action-title">📄 فاتورة مبيعات #${escapeHTML(invoiceNumber)}</span>
        ${customerName ? `<span class="action-client">العميل: ${escapeHTML(customerName)}</span>` : ""}
      </div>

      <div class="action-buttons">
        <button type="button" class="act-btn btn-print" onclick="window.print()" title="طباعة الفاتورة أو حفظ كملف PDF">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/>
            <rect x="6" y="14" width="12" height="8"/>
          </svg>
          <span>طباعة / حفظ PDF</span>
        </button>

        ${invoiceId ? `
        <a href="/api/v1/invoices/${invoiceId}/pdf" download="فاتورة_مبيعات_${escapeHTML(invoiceNumber)}.pdf" class="act-btn btn-download" title="تنزيل ملف PDF">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
          </svg>
          <span>تحميل PDF</span>
        </a>
        ` : ""}

        <button type="button" class="act-btn btn-whatsapp" onclick="handleWhatsAppShare()" title="مشاركة الفاتورة عبر واتساب">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.698.053-2.128-.538-1.748-.724-2.885-2.502-2.973-2.617-.087-.116-.708-.94-0.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.275.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.099.824zm-3.392-12.416c-5.523 0-10 4.477-10 10 0 1.767.459 3.428 1.261 4.872l-1.341 4.897 5.01-1.314c1.4 0.748 2.99 1.175 4.68 1.175 5.523 0 10-4.477 10-10s-4.477-10-10-10z" />
          </svg>
          <span>واتساب</span>
        </button>

        <button type="button" class="act-btn btn-close" onclick="window.close()" title="إغلاق">
          <span>إغلاق ✕</span>
        </button>
      </div>
    </div>
  </header>

  <div class="page-viewport">
    <div class="invoice-container" id="invoice-sheet">
      <div class="top-bar"></div>

      <!-- HEADER -->
      <div class="header">
        <div class="logo-wrapper">
          <img class="logo-img" src="/logo.png" alt="Logo" onerror="this.style.display='none'" />
        </div>

        <div class="header-row">
          // <div class="invoice-title">
          //   فاتورة مبيعات
          // </div>

          <div class="invoice-meta">
            <div class="meta-item">
              <span class="meta-label">رقم الفاتورة :</span>
              <span class="meta-value">${escapeHTML(invoiceNumber)}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">اسم العميل :</span>
              <span class="meta-value">${escapeHTML(customerName)}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">التاريخ:</span>
              <span class="meta-value">${escapeHTML(invoiceDate)}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ITEMS TABLE -->
      <div class="table-container">
        <table class="items-table">
          <thead>
            <tr>
              <th class="col-num">م</th>
              <th class="col-desc">البيــــــــان</th>
              <th class="col-qty">الكمية</th>
              <th class="col-price">السعر</th>
              <th class="col-total">الاجمالي</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHTML}
          </tbody>
        </table>
      </div>

      <!-- MIDDLE AREA -->
      <div class="middle-section">
        <div class="summary-box">
          <div class="summary-row">
            <div class="summary-label-stacked">
              <div>الـاجمالي</div>
              <div>السعر</div>
            </div>
            <div class="summary-val">${subtotal.toFixed(2)}</div>
          </div>

          <div class="summary-row">
            <div class="summary-label">الضريبة</div>
            <div class="summary-val">${taxRate ? `% ${taxRate}` : "% 0"}</div>
          </div>

          <div class="summary-row-total">
            <div class="summary-label-stacked">
              <div>الإجمالي</div>
              <div>العام</div>
            </div>
            <div class="summary-val">${calculatedTotal.toFixed(2)}</div>
          </div>
        </div>

        <div class="thanks-message">
          شكرا لكم...
        </div>
      </div>

      <!-- NOTES -->
      <div class="notes-section">
        <div class="notes-heading">ملاحظات</div>
        <ul class="notes-list">
          <li>التأكد من استلام جميع بنود الفاتورة</li>
        </ul>
      </div>

      <!-- FOOTER -->
      <div class="footer-section">
        <div class="footer-contact-row">
          <div class="footer-icon-box">
            <svg viewBox="0 0 24 24">
              <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
            </svg>
          </div>
          <div class="footer-text">0582076406</div>
        </div>

        <div class="footer-contact-row">
          <div class="footer-icon-box">
            <svg viewBox="0 0 24 24">
              <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
            </svg>
          </div>
          <div class="footer-text">elwafaa.company1@gmail.com</div>
        </div>
      </div>

      <div class="bottom-bar"></div>
    </div>
  </div>

  <script>
    function handleWhatsAppShare() {
      var num = ${JSON.stringify(invoiceNumber)};
      var cl = ${JSON.stringify(customerName)};
      var tot = ${JSON.stringify(calculatedTotal.toFixed(2))};
      var text = "*فاتورة مبيعات - شركة الوفاء للمستلزمات*\\n\\n" +
                 "📄 رقم الفاتورة: #" + num + "\\n" +
                 "👤 العميل: " + (cl || "—") + "\\n" +
                 "💰 الإجمالي: " + tot + " ريال";
      if (navigator.share) {
        navigator.share({ title: "فاتورة مبيعات", text: text }).catch(function(){});
      } else {
        window.open("https://wa.me/?text=" + encodeURIComponent(text), "_blank");
      }
    }

    ${autoPrint ? `
    window.addEventListener("load", function() {
      setTimeout(function() {
        window.print();
      }, 400);
    });
    ` : ""}
  </script>
</body>
</html>`;
}

/**
 * Opens the invoice in a new blank tab/window with complete HTML styling,
 * allowing print or download from it.
 *
 * @param {Object} invoiceData
 * @param {boolean} [autoPrint=false]
 */
export function openInvoiceInBlankHtmlPage(invoiceData, autoPrint = false) {
  const targetId =
    invoiceData?._id && !String(invoiceData._id).startsWith("inv-")
      ? invoiceData._id
      : null;

  if (targetId) {
    // If saved on server, open the server-rendered HTML page
    const url = `/api/v1/invoices/${targetId}/view${autoPrint ? "?print=true" : ""}`;
    const win = window.open(url, "_blank");
    if (!win || win.closed || typeof win.closed === "undefined") {
      // If popup blocker intervened, fallback to anchor tag
      const a = document.createElement("a");
      a.href = url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        if (document.body.contains(a)) document.body.removeChild(a);
      }, 500);
    }
    return;
  }

  // Client-side fallback if not yet on server
  const html = buildClientInvoiceHTML(invoiceData, { autoPrint });
  const newWin = window.open("", "_blank");
  if (newWin) {
    newWin.document.open();
    newWin.document.write(html);
    newWin.document.close();
  }
}
