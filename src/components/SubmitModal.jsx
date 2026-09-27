import React from "react";
import { CheckCircle2, FileDown, Plus, X } from "lucide-react";
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
  onShareWhatsApp,
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
          تم حفظ الفاتورة رقم #{invoiceNumber} بنجاح، ويمكنك مشاركتها أو تنزيلها مباشرة
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
            <span>% {tax || 0}</span>
          </div>
          <div className="summary-item highlight">
            <span>الإجمالي العام:</span>
            <span style={{ direction: "ltr" }}>{formatCurrency(grandTotal)}</span>
          </div>
        </div>

        <div className="modal-actions">
          {/* WhatsApp Share Button - High Priority */}
          <button
            type="button"
            className="btn-modal-whatsapp"
            onClick={() => {
              if (onShareWhatsApp) {
                onShareWhatsApp();
              }
            }}
            disabled={isGeneratingPdf}
          >
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="currentColor"
              style={{ flexShrink: 0 }}
            >
              <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.698.053-2.128-.538-1.748-.724-2.885-2.502-2.973-2.617-.087-.116-.708-.94-0.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.275.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.099.824zm-3.392-12.416c-5.523 0-10 4.477-10 10 0 1.767.459 3.428 1.261 4.872l-1.341 4.897 5.01-1.314c1.4 0.748 2.99 1.175 4.68 1.175 5.523 0 10-4.477 10-10s-4.477-10-10-10z" />
            </svg>
            <span>{isGeneratingPdf ? "جاري تجهيز ملف الفاتورة..." : "مشاركة ملف الفاتورة PDF (ملف كامل)"}</span>
          </button>

          {/* Download PDF Button */}
          <button
            type="button"
            className="btn-modal-primary"
            onClick={() => {
              onDownloadPdf();
            }}
            disabled={isGeneratingPdf}
          >
            <FileDown size={18} />
            <span>{isGeneratingPdf ? "جاري تجهيز وتنزيل الـ PDF..." : "تحميل نسخة PDF"}</span>
          </button>

          {/* Bottom Secondary Actions */}
          <div className="modal-actions-grid">
            <button
              type="button"
              className="btn-modal-secondary btn-new-invoice"
              onClick={() => {
                onClose();
                onNewInvoice();
              }}
            >
              <Plus size={16} />
              فاتورة جديدة
            </button>

            <button
              type="button"
              className="btn-modal-secondary"
              onClick={onClose}
            >
              <X size={15} />
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
