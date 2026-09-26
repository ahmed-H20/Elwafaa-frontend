import React from "react";
import { Phone, Mail } from "lucide-react";
import "./Receipt.css";
import { formatCurrency } from "../utils/arabicOrdinals";
import defaultLogo from "../assets/logo.png";

export default function Receipt({
  invoiceNumber = "1",
  customerName = "",
  invoiceDate = "",
  items = [],
  tax = 0,
  subtotal = 0,
  grandTotal = 0,
  minRows = 7,
  companyName = "شركة الوفاء للمستلزمات",
  title = "فاتورة مبيعات",
  phone = "0582076406",
  email = "elwafaa.company1@gmail.com",
  noteText = "التأكد من استلام جميع بنود الفاتورة",
  thankYouText = "شكرا لكم...",
  logoUrl = defaultLogo,
  badgeTheme = "white", // "white" | "dark"
}) {
  // Pad with dashed rows if items count is less than minRows (exactly like the image)
  const emptyRowsCount = Math.max(0, minRows - items.length);
  const emptyRows = Array.from({ length: emptyRowsCount }, (_, i) => i);

  return (
    <div className="receipt-wrapper">
      <div id="receipt-document" className="receipt-sheet">
        {/* TOP BRAND BANNER WITH COMPANY BADGE & LOGO */}
        <div className="receipt-header-banner">
          <div className={`header-center-badge theme-${badgeTheme}`}>
            {logoUrl && (
              <img
                src={logoUrl}
                alt="شعار شركة الوفاء للمستلزمات"
                className="header-badge-logo"
              />
            )}
            <span className="header-company-name">{companyName}</span>
          </div>
        </div>

        {/* RECEIPT CONTENT AREA */}
        <div className="receipt-body">
          {/* TOP SECTION: Right has Invoice Info, Left has Title "فاتورة مبيعات" */}
          <div className="receipt-top-row">
            {/* Left side: فاتورة مبيعات */}
            <div className="invoice-title-block">
              <h1 className="invoice-title">{title}</h1>
            </div>

            {/* Right side: رقم الفاتورة, اسم العميل, التاريخ */}
            <div className="invoice-meta-block">
              <div className="meta-row">
                <span className="meta-label">رقم الفاتورة</span>
                <span className="meta-val invoice-no-val" dir="ltr">#{invoiceNumber}</span>
              </div>
              <div className="meta-row">
                <span className="meta-label">اسم العميل</span>
                {customerName ? (
                  <span className="meta-val customer-name-val">{customerName}</span>
                ) : null}
              </div>
              <div className="meta-row">
                <span className="meta-label">التاريخ</span>
                {invoiceDate ? (
                  <span className="meta-val date-val">{invoiceDate}</span>
                ) : null}
              </div>
            </div>
          </div>

          {/* TABLE SECTION */}
          <div className="receipt-table-container">
            <table className="receipt-table">
              <thead>
                <tr>
                  <th className="col-index">م</th>
                  <th className="col-desc">البيــــــــــــان</th>
                  <th className="col-qty">الكمية</th>
                  <th className="col-price">السعر</th>
                  <th className="col-total">الاجمالي</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={item.id || idx}>
                    <td className="col-index">{idx + 1}</td>
                    <td className="col-desc">{item.name}</td>
                    <td className="col-qty">{item.quantity}</td>
                    <td className="col-price">{formatCurrency(item.price)}</td>
                    <td className="col-total">
                      {formatCurrency(Number(item.quantity) * Number(item.price))}
                    </td>
                  </tr>
                ))}

                {/* Empty dashed rows (identical to image template) */}
                {emptyRows.map((_, idx) => (
                  <tr key={`empty-${idx}`} className="dashed-row">
                    <td className="col-index"></td>
                    <td className="col-desc"></td>
                    <td className="col-qty">-</td>
                    <td className="col-price">-</td>
                    <td className="col-total">-</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Solid separator line below the table */}
            <div className="table-bottom-divider"></div>
          </div>

          {/* BELOW TABLE: LEFT TOTALS & RIGHT THANK YOU / NOTES / CONTACT */}
          <div className="receipt-middle-area">
            {/* Left Totals Block: aligned under the table left columns */}
            <div className="receipt-totals-box">
              {/* Row 1: Subtotal */}
              <div className="total-row">
                <div className="total-label-stacked">
                  <span>الاجمالي</span>
                  <span>السعر</span>
                </div>
                <div className="total-val">{formatCurrency(subtotal)}</div>
              </div>

              {/* Row 2: Tax */}
              <div className="total-row">
                <div className="total-label-stacked">
                  <span>الضريبة</span>
                </div>
                <div className="total-val">{formatCurrency(tax)}</div>
              </div>

              {/* Row 3: Grand Total (Tan Highlight) */}
              <div className="total-row grand-total-row">
                <div className="total-label-stacked bold-label">
                  <span>الإجمالي</span>
                  <span>العام</span>
                </div>
                <div className="total-val bold-val">{formatCurrency(grandTotal)}</div>
              </div>
            </div>

            {/* Right Side Content: Thank you, Notes, Contact */}
            <div className="receipt-right-content">
              {/* Thank you */}
              <div className="receipt-thanks-box">
                <span className="thanks-text">{thankYouText}</span>
              </div>

              {/* Notes */}
              <div className="receipt-notes-section">
                <h4 className="notes-title">ملاحظات</h4>
                <p className="notes-text">• {noteText}</p>
              </div>

              {/* Contact Card */}
              <div className="receipt-contact-card">
                <div className="contact-details">
                  <span className="contact-phone">{phone}</span>
                  <span className="contact-email">{email}</span>
                </div>
                <div className="contact-icons-box">
                  <Phone className="contact-icon" />
                  <Mail className="contact-icon" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM FULL-WIDTH TEAL BAR */}
        <div className="receipt-bottom-bar"></div>
      </div>
    </div>
  );
}
