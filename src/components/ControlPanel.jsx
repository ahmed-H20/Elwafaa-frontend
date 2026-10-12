import React from "react";
import {
  Plus,
  Trash2,
  FileDown,
  Printer,
  CheckCircle2,
  RotateCcw,
  User,
  Phone,
  Calendar,
  Receipt as ReceiptIcon,
  Percent
} from "lucide-react";
import "./ControlPanel.css";
import { formatCurrency } from "../utils/arabicOrdinals";

export default function ControlPanel({
  customerName,
  setCustomerName,
  customerId,
  setCustomerId,
  customerPhone,
  setCustomerPhone,
  customersList = [],
  invoiceNumber,
  setInvoiceNumber,
  invoiceDate,
  setInvoiceDate,
  tax,
  setTax,
  items,
  addItem,
  removeItem,
  updateItem,
  subtotal,
  grandTotal,
  badgeTheme = "white",
  setBadgeTheme,
  logoChoice = "cropped",
  setLogoChoice,
  onSubmit,
  onDownloadPdf,
  onPrint,
  onLoadSample,
  onResetNew,
  isGeneratingPdf,
}) {
  const [showDropdown, setShowDropdown] = React.useState(false);
  const dropdownRef = React.useRef(null);

  // Close dropdown on click outside
  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter matching customers
  const filteredCustomers = React.useMemo(() => {
    if (!customerName || !customerName.trim()) return customersList.slice(0, 5);
    const q = customerName.toLowerCase().trim();
    return customersList
      .filter(
        (c) =>
          c.name?.toLowerCase().includes(q) ||
          (c.phone && c.phone.includes(q))
      )
      .slice(0, 8);
  }, [customersList, customerName]);

  const handleSelectCustomer = (customer) => {
    setCustomerName(customer.name);
    if (setCustomerId) setCustomerId(customer._id);
    if (setCustomerPhone) setCustomerPhone(customer.phone || "");
    setShowDropdown(false);
  };

  return (
    <aside className="control-panel no-print">
      {/* Panel Header */}
      <div className="panel-header">
        <h2 className="panel-title">
          <ReceiptIcon size={20} />
          <span>إدارة الفاتورة</span>
        </h2>
        <div className="panel-actions-top">
          <button
            type="button"
            className="btn-icon-subtle"
            onClick={onLoadSample}
            title="استرجاع بيانات النموذج الأصلي (مطابقة للصورة)"
          >
            <span>النموذج الأصلي</span>
          </button>
          <button
            type="button"
            className="btn-icon-subtle"
            onClick={onResetNew}
            title="تفريغ الحقول وإنشاء فاتورة جديدة"
          >
            <RotateCcw size={14} />
            <span>جديدة</span>
          </button>
        </div>
      </div>

      {/* Invoice Meta Section */}
      <section className="form-section">
        <div className="section-label">
          <span>بيانات العميل والفاتورة</span>
        </div>

        {/* Customer Name Autocomplete */}
        <div className="input-group" ref={dropdownRef}>
          <label className="input-label" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>
              <User size={13} style={{ display: "inline", verticalAlign: "middle", marginLeft: 4 }} />
              اسم العميل
            </span>
            {customerId && (
              <span className="customer-status-badge">
                <CheckCircle2 size={11} /> عميل مسجل
              </span>
            )}
          </label>
          <div className="customer-autocomplete-wrapper">
            <input
              type="text"
              className="input-field"
              placeholder="اكتب اسم العميل (اختر مسجلاً أو أدخل جديداً)"
              value={customerName}
              onFocus={() => setShowDropdown(true)}
              onChange={(e) => {
                setCustomerName(e.target.value);
                if (customerId && setCustomerId) setCustomerId(null);
                setShowDropdown(true);
              }}
              autoComplete="off"
            />

            {showDropdown && filteredCustomers.length > 0 && (
              <div className="customer-dropdown-menu">
                {filteredCustomers.map((cust) => (
                  <div
                    key={cust._id}
                    className="customer-dropdown-item"
                    onClick={() => handleSelectCustomer(cust)}
                  >
                    <div className="customer-item-info">
                      <span className="customer-item-name">{cust.name}</span>
                      {cust.phone && (
                        <span className="customer-item-phone" dir="ltr">
                          📞 {cust.phone}
                        </span>
                      )}
                    </div>
                    {cust.invoicesCount != null && cust.invoicesCount > 0 && (
                      <span className="customer-item-badge">
                        {cust.invoicesCount} {cust.invoicesCount === 1 ? "فاتورة" : "فواتير"}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Customer Phone (Optional - رقم الهاتف اختياري لسرعة التسجيل) */}
        <div className="input-group">
          <label className="input-label">
            <span>
              <Phone size={13} style={{ display: "inline", verticalAlign: "middle", marginLeft: 4 }} />
              رقم الهاتف <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 400 }}>(اختياري)</span>
            </span>
          </label>
          <input
            type="tel"
            className="input-field"
            placeholder="مثال: 01012345678"
            value={customerPhone || ""}
            onChange={(e) => setCustomerPhone && setCustomerPhone(e.target.value)}
            dir="ltr"
          />
        </div>

        {/* Invoice Number & Date Grid
        <div className="grid-2">
          {/* Invoice Number 
          <div className="input-group">
            <label className="input-label">
              <span>رقم الفاتورة #</span>
            </label>
            <input
              type="text"
              className="input-field"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
            />
          </div>

          {/* Date (Automated - التاريخ تلقائي) 
          <div className="input-group">
            <label className="input-label">
              <span>
                <Calendar size={13} style={{ display: "inline", verticalAlign: "middle", marginLeft: 4 }} />
                التاريخ
              </span>
              <span className="badge-tag auto">تلقائي</span>
            </label>
            <input
              type="text"
              className="input-field"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              title="تاريخ اليوم يتم توليده تلقائياً"
            />
          </div>
        </div> */}

        {/* Tax (Manual Input - الضريبة يدوي) */}
        <div className="input-group">
          <label className="input-label">
            <span>
              <Percent size={13} style={{ display: "inline", verticalAlign: "middle", marginLeft: 4 }} />
              الضريبة
            </span>
            <span className="badge-tag manual">يدوي</span>
          </label>
          <input
            type="number"
            step="any"
            min="0"
            className="input-field"
            value={tax}
            onChange={(e) => setTax(e.target.value)}
            placeholder="0"
          />
        </div>
      </section>

      {/* Items List Section */}
      <section className="form-section">
        <div className="section-label">
          <span>بنود الفاتورة ({items.length})</span>
          <span className="badge-tag auto">البيان & الإجمالي تلقائي</span>
        </div>

        <div className="items-list-container">
          {items.map((item, index) => {
            const lineTotal = Number(item.quantity || 0) * Number(item.price || 0);
            return (
              <div key={item.id} className="item-card">
                <div className="item-card-header">
                  <span className="item-index-badge">بند #{index + 1}</span>
                  {items.length > 1 && (
                    <button
                      type="button"
                      className="btn-remove-item"
                      onClick={() => removeItem(item.id)}
                      title="حذف هذا البند"
                      aria-label="حذف البند"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>

                {/* Description (البيان تلقائي) */}
                <div className="input-group">
                  <label className="input-label" style={{ fontSize: 11 }}>
                    البيان
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={item.name}
                    onChange={(e) => updateItem(item.id, "name", e.target.value)}
                  />
                </div>

                {/* Quantity, Price, Line Total row */}
                <div className="item-sub-grid">
                  {/* Manual Quantity (الكمية يدوي) */}
                  <div className="input-group">
                    <label className="input-label" style={{ fontSize: 11 }}>
                      الكمية
                    </label>
                    <input
                      type="number"
                      min="1"
                      className="input-field text-center"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, "quantity", e.target.value)}
                    />
                  </div>

                  {/* Manual Price (السعر يدوي) */}
                  <div className="input-group">
                    <label className="input-label" style={{ fontSize: 11 }}>
                      السعر
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="input-field text-center"
                      placeholder="0"
                      // value={item.price}
                      onChange={(e) => updateItem(item.id, "price", e.target.value)}
                    />
                  </div>

                  {/* Automated Line Total (الاجمالي تلقائي) */}
                  <div className="input-group">
                    <label className="input-label" style={{ fontSize: 11 }}>
                      الاجمالي (تلقائي)
                    </label>
                    <div className="item-calc-preview">
                      {formatCurrency(lineTotal)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Item Button */}
        <button type="button" className="btn-add-item" onClick={addItem}>
          <Plus size={18} />
          إضافة صنف جديد (تلقائي الترقيم)
        </button>
      </section>

      {/* Summary Card */}
      <section className="panel-summary-card">
        <div className="summary-row">
          <span>اجمالي السعر (تلقائي):</span>
          <strong>{formatCurrency(subtotal)}</strong>
        </div>
        <div className="summary-row">
          <span>الضريبة (يدوي):</span>
          <span>{formatCurrency(tax)}</span>
        </div>
        <div className="summary-row grand">
          <span>الإجمالي العام (تلقائي):</span>
          <span style={{ fontSize: 18, direction: "ltr" }}>
            {formatCurrency(grandTotal)}
          </span>
        </div>
      </section>

      {/* Action Buttons */}
      <div className="panel-main-actions">
        <button
          type="button"
          className="btn-submit-invoice"
          onClick={onSubmit}
        >
          <CheckCircle2 size={19} />
          اعتماد وحفظ الفاتورة
        </button>
        {/* 
        <div className="actions-row-secondary">
          <button
            type="button"
            className="btn-pdf"
            onClick={onDownloadPdf}
            disabled={isGeneratingPdf}
          >
            <FileDown size={16} />
            {isGeneratingPdf ? "جاري التجهيز..." : "تحميل PDF"}
          </button>
        </div> */}
      </div>
    </aside>
  );
}
