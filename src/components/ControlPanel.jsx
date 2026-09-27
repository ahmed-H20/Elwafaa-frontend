import React from "react";
import {
  Plus,
  Trash2,
  FileDown,
  Printer,
  CheckCircle2,
  RotateCcw,
  User,
  Calendar,
  Receipt as ReceiptIcon,
  Percent
} from "lucide-react";
import "./ControlPanel.css";
import { formatCurrency } from "../utils/arabicOrdinals";

export default function ControlPanel({
  customerName,
  setCustomerName,
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

      {/* Brand & Badge Customization Section */}
      {/* <section className="form-section">
        <div className="section-label">
          <span>شعار وهوية الفاتورة</span>
          <span className="badge-tag auto">هوية الشعار</span>
        </div>

        <div className="grid-2">
          <div className="input-group">
            <label className="input-label">خلفية مستطيل الترويسة</label>
            <select
              className="input-field"
              value={badgeTheme}
              onChange={(e) => setBadgeTheme && setBadgeTheme(e.target.value)}
            >
              <option value="white">أبيض ناصع (إبراز الشعار)</option>
              <option value="dark">أخضر زيتي متناسق</option>
            </select>
          </div>

          <div className="input-group">
            <label className="input-label">شكل الشعار</label>
            <select
              className="input-field"
              value={logoChoice}
              onChange={(e) => setLogoChoice && setLogoChoice(e.target.value)}
            >
              <option value="cropped">الشعار الكامل</option>
              <option value="icon">رمز الدرع فقط</option>
            </select>
          </div>
        </div>
      </section> */}

      {/* Invoice Meta Section */}
      <section className="form-section">
        <div className="section-label">
          <span>بيانات العميل والفاتورة</span>
        </div>

        {/* Customer Name (Manual Input - اسم العميل يدوي) */}
        <div className="input-group">
          <label className="input-label">
            <span>
              <User size={13} style={{ display: "inline", verticalAlign: "middle", marginLeft: 4 }} />
              اسم العميل
            </span>
          </label>
          <input
            type="text"
            className="input-field"
            placeholder="أدخل اسم العميل"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
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
                      value={item.price}
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
