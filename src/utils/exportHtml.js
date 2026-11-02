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
  const calculatedTotal =
    invoice.total !== undefined && invoice.total !== null
      ? Number(invoice.total)
      : subtotal;

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
      size: A4 portrait;
      margin: 8mm 12mm 10mm 12mm;
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

    .btn-thermal {
      background-color: #0f766e;
      color: #ffffff;
      box-shadow: 0 2px 6px rgba(15, 118, 110, 0.4);
    }
    .btn-thermal:hover {
      background-color: #0d6560;
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
      overflow: hidden;
    }

    /* Top & Bottom Bars */
    .top-bar {
      margin: 0 -16mm 0 -16mm;
      height: 9mm;
      background-color: #135d66;
      flex-shrink: 0;
    }

    .bottom-bar {
      margin: 10mm -16mm -16mm -16mm;
      height: 9mm;
      background-color: #135d66;
      flex-shrink: 0;
    }

    /* Header */
    .header {
      padding-top: 5mm;
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
      margin-top: auto;
      padding-top: 10mm;
      padding-bottom: 2mm;
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
   PRINT IN A4 (MULTI-PAGE CAPABLE)
================================ */
@media print {
  @page {
    size: A4 portrait;
    margin: 8mm 12mm 10mm 12mm;
  }

  /* Completely hide all screen/navigation elements */
  .no-print,
  .action-bar,
  header.action-bar {
    display: none !important;
  }

  html,
  body {
    width: 100% !important;
    height: auto !important;
    min-height: auto !important;
    max-height: none !important;
    margin: 0 !important;
    padding: 0 !important;
    background: #ffffff !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    overflow: visible !important;
  }

  .page-viewport {
    padding: 0 !important;
    margin: 0 !important;
    display: block !important;
    width: 100% !important;
    height: auto !important;
    min-height: auto !important;
    max-height: none !important;
    overflow: visible !important;
    background: #ffffff !important;
  }

  .invoice-container {
    width: 100% !important;
    max-width: 100% !important;
    height: auto !important;
    min-height: auto !important;
    max-height: none !important;
    padding: 0 !important;
    box-shadow: none !important;
    border-radius: 0 !important;
    position: static !important;
    box-sizing: border-box !important;
    display: block !important;
    background: #ffffff !important;
    page-break-after: auto !important;
    page-break-inside: auto !important;
    break-inside: auto !important;
    overflow: visible !important;
  }

  /* Top & bottom teal bars */
  .top-bar {
    position: static !important;
    width: 100% !important;
    height: 6mm !important;
    margin: 0 0 4mm 0 !important;
    background-color: #135d66 !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }

  .bottom-bar {
    position: static !important;
    width: 100% !important;
    height: 6mm !important;
    margin: 6mm 0 0 0 !important;
    background-color: #135d66 !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    page-break-inside: avoid !important;
    break-inside: avoid !important;
    page-break-before: avoid !important;
    break-before: avoid !important;
  }

  /* Header Section */
  .header {
    padding-top: 0 !important;
    width: 100% !important;
    page-break-inside: avoid !important;
    break-inside: avoid !important;
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
    display: table-header-group !important;
    background-color: #d6b374 !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  .items-table tr {
    page-break-inside: avoid !important;
    break-inside: avoid !important;
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
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
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
    page-break-inside: avoid !important;
    break-inside: avoid !important;
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
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }

  .summary-box {
    width: 65mm !important;
    direction: rtl !important;
    display: flex !important;
    flex-direction: column !important;
    page-break-inside: avoid !important;
    break-inside: avoid !important;
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
    page-break-inside: avoid !important;
    break-inside: avoid !important;
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
    position: static !important;
    margin-top: 8mm !important;
    padding-bottom: 0 !important;
    direction: rtl !important;
    display: flex !important;
    flex-direction: column !important;
    gap: 2mm !important;
    align-items: flex-start !important;
    width: auto !important;
    page-break-inside: avoid !important;
    break-inside: avoid !important;
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
          <div class="invoice-title">
            فاتورة مبيعات
          </div>

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
  function openThermalReceipt() {
    var id = ${JSON.stringify(invoiceId)};
    if (id) {
      var backendUrl = ${JSON.stringify(import.meta.env?.VITE_BACKEND_URL || 'https://elwafaabackend.vercel.app')};
      window.open(backendUrl + "/api/v1/invoices/" + id + "/thermal", "_blank");
    } else {
      window.print();
    }
  }

  function handleWhatsAppShare() {
    var num = ${JSON.stringify(invoiceNumber)};
    var cl = ${JSON.stringify(customerName)};
    var tot = ${JSON.stringify(calculatedTotal.toFixed(2))};

    // رابط عرض الفاتورة
    var invoiceUrl =
      ${JSON.stringify(
    `${import.meta.env?.VITE_BACKEND_URL || "https://elwafaabackend.vercel.app"}/api/v1/invoices/${invoiceId}/view`
  )};

    var text =
      "*فاتورة مبيعات - شركة الوفاء للمستلزمات*" +
      "\\n\\n" +
      "📄 رقم الفاتورة: #" + num +
      "\\n" +
      "👤 العميل: " + (cl || "—") +
      "\\n" +
      "💰 الإجمالي: " + tot + " ريال" +
      "\\n" +
      "🔗 رابط عرض الفاتورة:" +
      "\\n" +
      invoiceUrl;

    // Web Share API
    if (navigator.share) {
      navigator.share({
        title: "فاتورة مبيعات - " + num,
        text: text
      }).catch(function (error) {
        // User cancelled sharing
        if (error && error.name === "AbortError") {
          return;
        }

        // Fallback to WhatsApp
        window.open(
          "https://wa.me/?text=" + encodeURIComponent(text),
          "_blank"
        );
      });

      return;
    }

    // Fallback for browsers that don't support navigator.share
    window.open(
      "https://wa.me/?text=" + encodeURIComponent(text),
      "_blank"
    );
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
    const url = `${import.meta.env?.VITE_BACKEND_URL}/api/v1/invoices/${targetId}/view${autoPrint ? "?print=true" : ""}`;
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

/**
 * Builds a 55mm thermal receipt HTML string directly in client.
 *
 * @param {Object} invoice
 * @param {Object} [options]
 * @param {boolean} [options.autoPrint=false]
 * @returns {string}
 */
export function buildClientThermalReceiptHTML(invoice, options = {}) {
  const { autoPrint = false } = options;

  // Normalize items
  const rawItems = Array.isArray(invoice.products)
    ? invoice.products
    : (Array.isArray(invoice.items) ? invoice.items : []);

  const products = rawItems.map((p) => ({
    name: p.name || "",
    qty: p.qty !== undefined ? p.qty : (p.quantity !== undefined ? p.quantity : 1),
    price: Number(p.price || 0),
  }));

  const subtotal = products.reduce(
    (acc, p) => acc + Number(p.qty || 0) * Number(p.price || 0),
    0
  );
  const calculatedTotal =
    invoice.total !== undefined ? Number(invoice.total) : subtotal;
  const paid = Number(invoice.paid || 0);
  const balance = calculatedTotal - paid;

  // Date formatted as "23 Oct 2026"
  let formattedDate = "";
  try {
    const d = new Date(invoice.createdAt || invoice.date || Date.now());
    if (!isNaN(d.getTime())) {
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      formattedDate = `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    } else {
      formattedDate = String(invoice.createdAt || invoice.date || "");
    }
  } catch {
    formattedDate = String(invoice.createdAt || invoice.date || "");
  }

  const invoiceNumber = invoice.invoiceNumber || invoice.id || invoice._id?.toString() || "1";
  const clientName = invoice.customerName || invoice.clientName || invoice.name || "";
  const invoiceId = invoice._id?.toString() || invoice.id || "";

  // QR code URL — encodes a link to the invoice view page
  const invoiceViewUrl = `${import.meta.env?.VITE_BACKEND_URL || "https://elwafaabackend.vercel.app"}/api/v1/invoices/${invoiceId}/view`;
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(invoiceViewUrl)}`;

  // Product rows
  const itemsHTML = products
    .map(
      (item) => `
      <tr>
        <td class="col-name">${escapeHTML(item.name)}</td>
        <td class="col-qty">${item.qty}</td>
        <td class="col-price">${Number(item.price).toFixed(2)}</td>
        <td class="col-total">${(Number(item.qty || 0) * Number(item.price || 0)).toFixed(2)}</td>
      </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>فاتورة حرارية #${escapeHTML(invoiceNumber)} - مؤسسة الوفاء الخضراء</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    html, body {
      width: 100%;
      margin: 0;
      padding: 0;
      background: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, Tahoma, sans-serif;
      color: #000000;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      -webkit-text-size-adjust: 100%;
    }

    /* Action bar — screen only */
    .action-bar {
      position: sticky;
      top: 0;
      z-index: 9999;
      background: linear-gradient(135deg, #0d3b41 0%, #135d66 100%);
      color: #fff;
      padding: 10px 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 8px;
      box-shadow: 0 4px 15px rgba(0,0,0,.18);
      border-bottom: 2px solid #d6b374;
      font-family: Tahoma, Arial, sans-serif;
    }

    .action-info {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .action-title {
      font-size: 14px;
      font-weight: 800;
    }

    .action-client {
      font-size: 12px;
      font-weight: 600;
      color: #e0f2fe;
      background: rgba(255,255,255,.12);
      padding: 2px 8px;
      border-radius: 999px;
    }

    .action-buttons {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
      align-items: center;
    }

    .act-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 5px;
      padding: 7px 12px;
      border-radius: 6px;
      font-family: Tahoma, Arial, sans-serif;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      border: none;
      white-space: nowrap;
      text-decoration: none;
      transition: all .2s;
    }

    .btn-thermal {
      background-color: #d6b374;
      color: #111827;
      box-shadow: 0 2px 5px rgba(214,179,116,0.4);
    }
    .btn-thermal:hover { background-color: #c49f5c; }

    .btn-a4 {
      background-color: #ffffff;
      color: #135d66;
    }
    .btn-a4:hover { background-color: #f0fdf4; }

    .btn-whatsapp {
      background-color: #25d366;
      color: #fff;
    }
    .btn-whatsapp:hover { background-color: #20bd5a; }

    .btn-close {
      background-color: rgba(255,255,255,.15);
      color: #fff;
    }
    .btn-close:hover { background-color: rgba(255,255,255,.25); }

    /* Main viewport */
    .page-viewport {
      width: 100%;
      margin: 0;
      padding: 0;
      min-height: auto;
      display: block;
      background: #ffffff;
    }

    /* Receipt container: fills 100% width on thermal devices with bold, legible typography */
    .receipt {
      width: 100%;
      max-width: 100%;
      margin: 0 auto;
      padding: 6px 8px 12px;
      background: #ffffff;
      box-sizing: border-box;
      direction: rtl;
      font-size: 13px;
      line-height: 1.35;
      color: #000000;
    }

    /* Desktop centering */
    @media screen and (min-width: 600px) {
      body {
        background: #f1f5f9;
      }
      .page-viewport {
        display: flex;
        justify-content: center;
        padding: 24px 0;
      }
      .receipt {
        width: 380px;
        max-width: 380px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.12);
        border-radius: 4px;
        padding: 16px 14px 24px;
      }
    }

    /* Header */
    .r-company {
      text-align: center;
      font-size: 15px;
      font-weight: 800;
      line-height: 1.35;
      margin-bottom: 4px;
    }

    .r-company .r-phone {
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.5px;
      margin-top: 1px;
    }

    .r-company .r-vat {
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.5px;
      margin-top: 1px;
    }

    .r-title {
      text-align: center;
      font-size: 16px;
      font-weight: 900;
      margin: 6px 0 4px;
      letter-spacing: 2px;
      text-transform: uppercase;
    }

    .r-meta-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      font-size: 12px;
      font-weight: 700;
      margin: 5px 0;
      direction: ltr;
    }

    .r-meta-row .inv-no {
      font-weight: 800;
    }

    .r-client-section {
      text-align: right;
      margin: 5px 0 6px;
      font-size: 13px;
    }

    .r-client-label {
      font-weight: 800;
      margin-bottom: 1px;
    }

    .r-client-name {
      font-weight: 700;
      font-size: 13.5px;
    }

    .r-divider {
      border: none;
      border-top: 1px dashed #000;
      margin: 6px 0;
    }

    /* Items Table */
    .r-table {
      width: 100%;
      border-collapse: collapse;
      margin: 6px 0;
      font-size: 12px;
      direction: ltr;
    }

    .r-table thead tr {
      border-top: 1px dashed #000;
      border-bottom: 1px dashed #000;
    }

    .r-table th {
      padding: 4px 2px;
      text-align: center;
      font-weight: 800;
      font-size: 12px;
      color: #000;
    }

    .r-table td {
      padding: 4px 2px;
      text-align: center;
      font-size: 12px;
      font-weight: 700;
      vertical-align: top;
      word-break: break-word;
      color: #000;
    }

    .col-name {
      text-align: right !important;
      direction: rtl !important;
      width: 44%;
    }
    .col-qty  { width: 14%; }
    .col-price { width: 21%; text-align: right !important; }
    .col-total { width: 21%; text-align: right !important; }

    /* Summary */
    .r-summary {
      margin-top: 6px;
      font-size: 13px;
      font-weight: 700;
      direction: ltr;
    }

    .r-summary-row {
      display: flex;
      justify-content: space-between;
      padding: 2px 0;
    }

    .r-summary-row span:last-child {
      direction: rtl;
    }

    .r-summary-row.total-row {
      font-weight: 900;
      font-size: 14.5px;
      border-top: 1px dashed #000;
      border-bottom: 1px dashed #000;
      padding: 4px 0;
      margin: 3px 0;
    }

    /* Payment Details */
    .r-payment {
      margin-top: 6px;
      font-size: 12px;
      font-weight: 600;
      line-height: 1.45;
      direction: rtl;
      text-align: right;
    }

    .r-payment-title {
      font-weight: 800;
      font-size: 12.5px;
      margin-bottom: 2px;
      direction: ltr;
      text-align: left;
    }

    .r-payment-line {
      word-break: break-all;
    }

    /* Signature */
    .r-sig-wrapper {
      margin-top: 8px;
      text-align: right;
      direction: ltr;
      font-size: 12px;
      font-weight: 700;
      padding-top: 2px;
    }

    /* Footer & QR */
    .r-footer {
      margin-top: 10px;
      text-align: center;
    }

    .r-thanks {
      font-size: 13.5px;
      font-weight: 800;
      margin-bottom: 8px;
      letter-spacing: 0.2px;
    }

    .r-footer img.qr {
      width: 120px;
      height: 120px;
      margin: 0 auto;
      display: block;
    }

    /* ========================
       PRINT STYLES (58mm)
    ======================== */
    @media print {
      @page {
        size: 58mm auto;
        margin: 0;
      }

      html, body {
        background: #fff !important;
        margin: 0 !important;
        padding: 0 !important;
        width: 100% !important;
      }

      .no-print, .action-bar, header.action-bar {
        display: none !important;
      }

      .page-viewport {
        padding: 0 !important;
        margin: 0 !important;
        min-height: auto !important;
        display: block !important;
        width: 100% !important;
      }

      .receipt {
        width: 100% !important;
        max-width: 100% !important;
        box-shadow: none !important;
        border-radius: 0 !important;
        padding: 2mm 3mm 6mm !important;
        margin: 0 auto !important;
        font-size: 12.5px !important;
      }
    }
  </style>
</head>
<body>

  <!-- ACTION BAR (screen only) -->
  <header class="action-bar no-print">
    <div class="action-info">
      <span class="action-title">🧾 فاتورة حرارية #${escapeHTML(invoiceNumber)}</span>
      ${clientName ? `<span class="action-client">${escapeHTML(clientName)}</span>` : ""}
    </div>
    <div class="action-buttons">
      <button class="act-btn btn-thermal" onclick="window.print()" title="طباعة فورية للطابعة الحرارية">
        🖨️ طباعة حرارية
      </button>
      <button class="act-btn btn-a4" onclick="openA4()" title="عرض الفاتورة بالحجم الكبير A4">
        📄 عرض A4
      </button>
      <button class="act-btn btn-whatsapp" onclick="handleWhatsApp()">
        <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
          <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.698.053-2.128-.538-1.748-.724-2.885-2.502-2.973-2.617-.087-.116-.708-.94-0.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.275.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.099.824zm-3.392-12.416c-5.523 0-10 4.477-10 10 0 1.767.459 3.428 1.261 4.872l-1.341 4.897 5.01-1.314c1.4 0.748 2.99 1.175 4.68 1.175 5.523 0 10-4.477 10-10s-4.477-10-10-10z"/>
        </svg>
        <span>واتساب</span>
      </button>
      <button class="act-btn btn-close" onclick="window.close()">إغلاق ✕</button>
    </div>
  </header>

  <!-- RECEIPT BODY -->
  <div class="page-viewport">
    <div class="receipt">

      <!-- Company Header -->
      <div class="r-company">
        مؤسسة الوفاء الخضراء<br>
        <div class="r-phone">057484102</div>
        <div class="r-vat">311058365400003</div>
      </div>

      <div class="r-title">INVOICE</div>

      <div class="r-meta-row">
        <div class="inv-no">INVOICE No ${escapeHTML(invoiceNumber)}</div>
        <div>${formattedDate}</div>
      </div>

      <div class="r-client-section">
        <div class="r-client-label">العميل</div>
        <div class="r-client-name">${escapeHTML(clientName || "عميل نقدي")}</div>
      </div>

      <!-- Items Table -->
      <table class="r-table">
        <thead>
          <tr>
            <th class="col-name">Product</th>
            <th class="col-qty">Quantity</th>
            <th class="col-price">Rate</th>
            <th class="col-total">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHTML}
        </tbody>
      </table>

      <hr class="r-divider">

      <!-- Summary -->
      <div class="r-summary">
        <div class="r-summary-row">
          <span>Base Amount</span>
          <span>${subtotal.toFixed(2)} ر.س.</span>
        </div>
        <div class="r-summary-row total-row">
          <span>Total</span>
          <span>${calculatedTotal.toFixed(2)} ر.س.</span>
        </div>
        <div class="r-summary-row">
          <span>Paid</span>
          <span>${paid.toFixed(2)} ر.س.</span>
        </div>
        <div class="r-summary-row" style="font-weight: 800;">
          <span>Balance</span>
          <span>${balance.toFixed(2)} ر.س.</span>
        </div>
      </div>

      <hr class="r-divider">

      <!-- Payment Details -->
      <div class="r-payment">
        <div class="r-payment-title">Payment Detail</div>
        <div class="r-payment-line">مؤسسة الوفاء الخضراء : مؤسسة الوفاء الخضراء</div>
        <div class="r-payment-line">Account No : SA3430100949000013389245</div>
        <div class="r-payment-line" style="margin-top: 3px; font-weight: bold;">Other Details :</div>
        <div class="r-payment-line">SA7680000205608016618095</div>
      </div>

      <!-- Signature -->
      <div class="r-sig-wrapper">
        <span>Signature</span>
      </div>

      <!-- Footer & QR -->
      <div class="r-footer">
        <div class="r-thanks">Thank you! Happy Business!</div>
      </div>

    </div>
  </div>

  <script>
    var invoiceViewUrl = ${JSON.stringify(invoiceViewUrl)};
    var invoiceA4Url   = ${JSON.stringify(`${import.meta.env?.VITE_BACKEND_URL || "https://elwafaabackend.vercel.app"}/api/v1/invoices/${invoiceId}/view`)};
    var invoiceNumber  = ${JSON.stringify(invoiceNumber)};
    var clientName     = ${JSON.stringify(clientName)};
    var total          = ${JSON.stringify(calculatedTotal.toFixed(2))};

    function openA4() {
      window.open(invoiceA4Url, "_blank");
    }

    function handleWhatsApp() {
      var text =
        "*فاتورة مبيعات - مؤسسة الوفاء الخضراء*" +
        "\\n\\n" +
        "📄 رقم الفاتورة: #" + invoiceNumber +
        "\\n" +
        "👤 العميل: " + (clientName || "—") +
        "\\n" +
        "💰 الإجمالي: " + total + " ريال" +
        "\\n" +
        "🔗 رابط عرض الفاتورة:\\n" +
        invoiceViewUrl;

      if (navigator.share) {
        navigator.share({ title: "فاتورة #" + invoiceNumber, text: text })
          .catch(function(e) {
            if (e && e.name !== "AbortError") {
              window.open("https://wa.me/?text=" + encodeURIComponent(text), "_blank");
            }
          });
        return;
      }
      window.open("https://wa.me/?text=" + encodeURIComponent(text), "_blank");
    }

    ${autoPrint ? `
    window.addEventListener("load", function() {
      setTimeout(function() { window.print(); }, 400);
    });
    ` : ""}
  </script>
</body>
</html>`;
}

export function openThermalInBlankHtmlPage(invoiceData, autoPrint = true) {
  const targetId =
    invoiceData?._id && !String(invoiceData._id).startsWith("inv-")
      ? invoiceData._id
      : null;

  if (targetId) {
    const url = `${import.meta.env?.VITE_BACKEND_URL}/api/v1/invoices/${targetId}/thermal${autoPrint ? "?print=true" : ""}`;
    const win = window.open(url, "_blank");
    if (!win || win.closed || typeof win.closed === "undefined") {
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

  // Fallback to client-side rendered HTML if server is offline or invoice is local
  const html = buildClientThermalReceiptHTML(invoiceData, { autoPrint });
  const newWin = window.open("", "_blank");
  if (newWin) {
    newWin.document.open();
    newWin.document.write(html);
    newWin.document.close();
  }
}

export const buildThermalReceiptHTML = buildClientThermalReceiptHTML;
