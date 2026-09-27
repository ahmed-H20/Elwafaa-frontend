import React from "react";
import { CheckCircle2, FileDown, Printer, Plus, X, Share } from "lucide-react";
import "./SubmitModal.css";
import { formatCurrency } from "../utils/arabicOrdinals";

export default function SubmitModal({
  isOpen,
  onClose,
  invoiceNumber,
  customerName,
  invoiceDate,
  itemCount,
  subtotal,
  tax,
  grandTotal,
  onDownloadPdf,
  onPrint,
  onNewInvoice,
  isGeneratingPdf = false,
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-icon-badge">
          <CheckCircle2 size={36} />
        </div>

        <h3 className="modal-title">تم اعتماد وحفظ الفاتورة بنجاح!</h3>
        <p className="modal-subtitle">
          تم حفظ الفاتورة رقم #{invoiceNumber} بنجاح، ويتم الآن تنزيل ملف الـ PDF تلقائياً
        </p>

        <div className="modal-summary-box">
          <div className="summary-item">
            <span>رقم الفاتورة:</span>
            <strong>#{invoiceNumber}</strong>
          </div>
          <div className="summary-item">
            <span>اسم العميل:</span>
            <strong>{customerName || "—"}</strong>
          </div>
          <div className="summary-item">
            <span>التاريخ:</span>
            <span>{invoiceDate}</span>
          </div>
          <div className="summary-item">
            <span>عدد البنود:</span>
            <span>{itemCount}</span>
          </div>
          <div className="summary-item">
            <span>اجمالي السعر:</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="summary-item">
            <span>الضريبة:</span>
            <span>{formatCurrency(tax)}</span>
          </div>
          <div className="summary-item highlight">
            <span>الإجمالي العام:</span>
            <span style={{ direction: "ltr" }}>{formatCurrency(grandTotal)}</span>
          </div>
        </div>

        <div className="modal-actions">
          <button
            type="button"
            className="btn-modal-primary"
            onClick={() => {
              onDownloadPdf();
            }}
            disabled={isGeneratingPdf}
          >
            <FileDown size={18} />
            <span>{isGeneratingPdf ? "جاري تجهيز وتنزيل الـ PDF..." : "تحميل نسخة PDF مرة أخرى"}</span>
          </button>

          <div className="modal-actions-grid">
            <button
              type="button"
              className="btn-modal-secondary"
              onClick={() => {
                onPrint();
              }}
            >
              <Share size={16} />
              مشاركة
            </button>

            <button
              type="button"
              className="btn-modal-secondary"
              onClick={() => {
                onClose();
                onNewInvoice();
              }}
            >
              <Plus size={16} />
              فاتورة جديدة
            </button>
          </div>

          <button
            type="button"
            className="btn-modal-secondary"
            onClick={onClose}
            style={{ marginTop: 4 }}
          >
            <X size={15} />
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}
