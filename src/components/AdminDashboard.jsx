import React, { useState, useMemo } from "react";
import {
  Search,
  Plus,
  ArrowRight,
  RotateCw,
  Trash2,
  CheckCircle2,
  X,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import "./AdminDashboard.css";

export default function AdminDashboard({
  invoices = [],
  onViewInvoice,
  onCreateNewInvoice,
  onRefresh,
  onDeleteInvoice,
  isLoading = false,
  apiStatus = "idle",
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [deletingId, setDeletingId] = useState(null);
  const [showAtlasGuide, setShowAtlasGuide] = useState(false);
  const itemsPerPage = 5;

  // Filter invoices by client name or invoice number
  const filteredInvoices = useMemo(() => {
    if (!searchQuery.trim()) return invoices;
    const q = searchQuery.toLowerCase().trim();
    return invoices.filter(
      (inv) =>
        inv.clientName?.toLowerCase().includes(q) ||
        inv.invoiceNumber?.toLowerCase().includes(q)
    );
  }, [invoices, searchQuery]);

  // Unique clients count
  const clientsCount = useMemo(() => {
    const unique = new Set(invoices.map((inv) => inv.clientName).filter(Boolean));
    return unique.size || (invoices.length > 0 ? invoices.length : 0);
  }, [invoices]);

  // Overall total revenue
  const totalRevenue = useMemo(() => {
    const sum = invoices.reduce((acc, inv) => acc + (parseFloat(inv.total) || 0), 0);
    return Math.round(sum);
  }, [invoices]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage) || 1;
  const paginatedInvoices = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredInvoices.slice(start, start + itemsPerPage);
  }, [filteredInvoices, currentPage, itemsPerPage]);

  const handleDelete = async (inv) => {
    if (window.confirm(`هل أنت متأكد من حذف فاتورة "${inv.clientName || inv.invoiceNumber}"؟`)) {
      setDeletingId(inv.id);
      if (onDeleteInvoice) {
        await onDeleteInvoice(inv.id, inv._id);
      }
      setDeletingId(null);
    }
  };

  return (
    <div className="admin-page-container">
      <div className="admin-content-wrapper">
        {/* Top Header Row: Dual-Tone Title & New Invoice Button */}
        <div className="admin-header-row">
          <div className="admin-title-col">
            <h1 className="admin-main-title">
              <span className="title-green">Al-Wa</span>
              <span className="title-sand">faa</span>
              <span className="title-green"> Me</span>
              <span className="title-sand">dic</span>
              <span className="title-green">al </span>
              <span className="title-green">Supp</span>
              <span className="title-sand">lie</span>
              <span className="title-green">s and</span>
              <br />
              <span className="title-sand">Cosme</span>
              <span className="title-green">tic</span>
            </h1>
          </div>

          <div className="admin-top-actions" style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            {/* Cloud Sync Status Indicator */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 12px",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                backgroundColor: apiStatus === "connected" ? "#ecfdf5" : "#fef3c7",
                color: apiStatus === "connected" ? "#065f46" : "#92400e",
                border: apiStatus === "connected" ? "1px solid #a7f3d0" : "1px solid #fde68a",
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor: apiStatus === "connected" ? "#10b981" : "#f59e0b",
                  display: "inline-block",
                }}
              />
              <span>
                {apiStatus === "connected"
                  ? "السحابة متصلة ومزامنة عالمياً"
                  : "مزامنة محلية (بانتظار تصريح Atlas)"}
              </span>
              {apiStatus !== "connected" && (
                <button
                  type="button"
                  onClick={() => setShowAtlasGuide(true)}
                  style={{
                    marginRight: 6,
                    padding: "3px 8px",
                    borderRadius: 4,
                    backgroundColor: "#d97706",
                    color: "#ffffff",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                  title="اضغط لمعرفة خطوات تفعيل الربط السحابي في دقيقة واحدة"
                >
                  طريقة التفعيل ↗
                </button>
              )}
            </div>

            {onRefresh && (
              <button
                type="button"
                className="btn-refresh-api"
                onClick={onRefresh}
                disabled={isLoading}
                title="تحديث ومزامنة الفواتير من الخادم"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "1px solid #d1d5db",
                  backgroundColor: "#ffffff",
                  color: "#374151",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                <RotateCw
                  size={15}
                  style={{
                    animation: isLoading ? "spin 1s linear infinite" : "none",
                  }}
                />
                <span>{isLoading ? "جاري التحديث..." : "مزامنة"}</span>
              </button>
            )}

            <button
              type="button"
              className="btn-nav-to-receipt"
              onClick={onCreateNewInvoice}
              title="إنشاء فاتورة جديدة"
            >
              <Plus size={18} />
              <span>إنشاء فاتورة مبيعات</span>
            </button>
          </div>
        </div>

        {/* Stats Card (عدد العملاء & الاجمالي العام لجميع العملاء) */}
        <div className="admin-stats-card">
          {/* Stat 1: عدد العملاء */}
          <div className="stat-item">
            <span className="stat-number">{clientsCount}</span>
            <span className="stat-label-arabic">عدد العملاء</span>
          </div>

          <div className="stats-divider"></div>

          {/* Stat 2: الاجمالي العام لجميع العملاء */}
          <div className="stat-item">
            <span className="stat-number">{totalRevenue.toLocaleString()}</span>
            <span className="stat-label-arabic">الاجمالي العام لجميع العملاء</span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="admin-search-bar">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="البحث عن عملاء او فواتير"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        {/* Invoices Table Card */}
        <div className="admin-table-card">
          <table className="admin-table">
            <thead>
              <tr>
                <th className="th-client">اسم العميل</th>
                <th className="th-inv">رقم الفاتورة</th>
                <th className="th-total">الاجمالي العام</th>
                <th className="th-action"></th>
              </tr>
            </thead>
            <tbody>
              {paginatedInvoices.map((inv) => (
                <tr key={inv.id || inv._id}>
                  {/* Client with Avatar */}
                  <td>
                    <div className="client-info-cell">
                      <div
                        className={`client-avatar-badge ${
                          inv.avatarClass || "avatar-default"
                        }`}
                      >
                        {inv.avatarLetters ||
                          inv.clientName?.slice(0, 2).toUpperCase() ||
                          "CL"}
                      </div>
                      <span className="client-name-text">{inv.clientName}</span>
                    </div>
                  </td>

                  {/* Invoice Badge */}
                  <td className="inv-number-cell">
                    <span className="inv-badge-pill">{inv.invoiceNumber}</span>
                  </td>

                  {/* Total Amount & Currency */}
                  <td>
                    <div className="total-amount-cell">
                      <span className="amount-number">{inv.total?.toLocaleString() || inv.total}</span>
                      <span className="amount-currency">SAR</span>
                    </div>
                  </td>

                  {/* Action Link: View → & Delete */}
                  <td className="action-cell">
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 6 }}>
                      <button
                        type="button"
                        className="btn-view-invoice"
                        onClick={() => onViewInvoice(inv)}
                        title="عرض وطباعة هذه الفاتورة"
                      >
                        <span>View</span>
                        <ArrowRight size={14} />
                      </button>

                      {onDeleteInvoice && (
                        <button
                          type="button"
                          className="btn-delete-invoice"
                          onClick={() => handleDelete(inv)}
                          disabled={deletingId === inv.id}
                          title="حذف الفاتورة"
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "#ef4444",
                            cursor: "pointer",
                            padding: "6px",
                            borderRadius: "6px",
                            display: "inline-flex",
                            alignItems: "center",
                            opacity: deletingId === inv.id ? 0.4 : 0.8,
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {paginatedInvoices.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ textAlign: "center", padding: "32px", color: "#6b7280" }}>
                    {isLoading ? "جاري تحميل الفواتير من السيرفر..." : "لا توجد فواتير مطابقة لبحثك"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Row matching original image */}
        <div className="admin-pagination-row">
          <button
            type="button"
            className="pagination-btn nav-text"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          >
            &lt; Prev
          </button>

          <button
            type="button"
            className={`pagination-btn ${currentPage === 1 ? "active" : ""}`}
            onClick={() => setCurrentPage(1)}
          >
            1
          </button>

          <button
            type="button"
            className={`pagination-btn ${currentPage === 2 ? "active" : ""}`}
            onClick={() => setCurrentPage(2)}
          >
            2
          </button>

          <button
            type="button"
            className={`pagination-btn ${currentPage === 3 ? "active" : ""}`}
            onClick={() => setCurrentPage(3)}
          >
            3
          </button>

          <span className="pagination-dots">...</span>

          <button
            type="button"
            className={`pagination-btn ${currentPage === 6 ? "active" : ""}`}
            onClick={() => setCurrentPage(6)}
          >
            6
          </button>

          <button
            type="button"
            className="pagination-btn nav-text"
            onClick={() => setCurrentPage((p) => Math.min(6, p + 1))}
          >
            Next &gt;
          </button>
        </div>
      </div>

      {/* Atlas Guide Modal */}
      {showAtlasGuide && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            direction: "rtl",
          }}
          onClick={() => setShowAtlasGuide(false)}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: 14,
              maxWidth: 520,
              width: "100%",
              padding: 24,
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)",
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <ShieldAlert size={22} color="#d97706" />
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#111827" }}>
                  تفعيل الربط السحابي لجميع الأجهزة (MongoDB Atlas)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAtlasGuide(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "#9ca3af",
                }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: 14, color: "#4b5563", lineHeight: 1.6, margin: "0 0 16px" }}>
              لكي تظهر الفواتير التي ينشئها أي شخص من أي موبايل أو كمبيوتر حول العالم في لوحة تحكم الأدمن مباشرة، تحتاج فقط السماح للاتصال السحابي في MongoDB Atlas (خطوة واحدة تستغرق دقيقة واحدة):
            </p>

            <ol style={{ paddingRight: 20, margin: "0 0 20px", fontSize: 14, color: "#1f2937", lineHeight: 1.8 }}>
              <li>
                افتح موقع{" "}
                <a
                  href="https://cloud.mongodb.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#004f49", fontWeight: 700, textDecoration: "underline" }}
                >
                  cloud.mongodb.com <ExternalLink size={12} style={{ display: "inline" }} />
                </a>{" "}
                وسجل الدخول.
              </li>
              <li>من القائمة الجانبية اليسرى تحت <strong>Security</strong>، اختر <strong>Network Access</strong>.</li>
              <li>اضغط على الزر الأخضر <strong>+ Add IP Address</strong>.</li>
              <li>اضغط على خيار <strong>ALLOW ACCESS FROM ANYWHERE</strong> (سيتم وضع <code>0.0.0.0/0</code> تلقائياً).</li>
              <li>اضغط <strong>Confirm</strong>.</li>
            </ol>

            <div style={{ backgroundColor: "#ecfdf5", border: "1px solid #a7f3d0", padding: "12px 14px", borderRadius: 8, fontSize: 13, color: "#065f46", marginBottom: 20 }}>
              💡 بمجرد الضغط على Confirm، ستتصل السحابة تلقائياً وستظهر أي فاتورة جديدة للأدمن فوراً بدون الحاجة لأي تعديل آخر!
            </div>

            <button
              type="button"
              onClick={() => setShowAtlasGuide(false)}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: 8,
                backgroundColor: "#004f49",
                color: "#ffffff",
                border: "none",
                fontWeight: 700,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              فهمت ذلك، إغلاق
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
