import React, { useState, useMemo, useEffect } from "react";
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
  Printer,
  Users,
  FileText,
  Phone,
  Eye,
  Receipt as ReceiptIcon,
  Calendar,
} from "lucide-react";
import { getAllCustomers, getCustomerById } from "../APIs/customersAPI";
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
  const [activeTab, setActiveTab] = useState("invoices"); // "invoices" | "customers"
  const [customersList, setCustomersList] = useState([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerInvoices, setCustomerInvoices] = useState([]);
  const [isLoadingCustomerDetails, setIsLoadingCustomerDetails] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [deletingId, setDeletingId] = useState(null);
  const [showAtlasGuide, setShowAtlasGuide] = useState(false);
  const itemsPerPage = 5;

  const fetchCustomers = async () => {
    try {
      setIsLoadingCustomers(true);
      const data = await getAllCustomers();
      if (Array.isArray(data)) setCustomersList(data);
    } catch (err) {
      console.warn("Could not load customers:", err);
    } finally {
      setIsLoadingCustomers(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [invoices]);

  const handleOpenCustomerModal = async (cust) => {
    setSelectedCustomer(cust);
    setIsLoadingCustomerDetails(true);
    try {
      const details = await getCustomerById(cust._id);
      if (details && Array.isArray(details.invoices)) {
        setCustomerInvoices(details.invoices);
      } else {
        setCustomerInvoices(
          invoices.filter(
            (i) => i.customerId === cust._id || i.clientName === cust.name
          )
        );
      }
    } catch (err) {
      console.warn("Could not load customer invoices:", err);
      setCustomerInvoices(
        invoices.filter(
          (i) => i.customerId === cust._id || i.clientName === cust.name
        )
      );
    } finally {
      setIsLoadingCustomerDetails(false);
    }
  };

  // Date filter state
  const [dateFilter, setDateFilter] = useState("all"); // "all" | "today" | "week" | "month" | "custom"
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const getInvoiceDateObj = (inv) => {
    if (inv.createdAt) {
      const d = new Date(inv.createdAt);
      if (!isNaN(d.getTime())) return d;
    }
    if (inv.rawDoc?.createdAt) {
      const d = new Date(inv.rawDoc.createdAt);
      if (!isNaN(d.getTime())) return d;
    }
    if (inv.date) {
      const d = new Date(String(inv.date).replace(/\//g, "-"));
      if (!isNaN(d.getTime())) return d;
    }
    if (inv._id && typeof inv._id === "string" && inv._id.length === 24) {
      const timestamp = parseInt(inv._id.substring(0, 8), 16) * 1000;
      if (!isNaN(timestamp)) return new Date(timestamp);
    }
    return null;
  };

  const formatDisplayDate = (inv) => {
    const d = getInvoiceDateObj(inv);
    if (!d) return inv.date || "-";
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}/${month}/${day}`;
  };

  // Sort invoices: Newest first (الأحدث أعلى)
  const sortedInvoices = useMemo(() => {
    return [...invoices].sort((a, b) => {
      const timeA = getInvoiceDateObj(a)?.getTime() || 0;
      const timeB = getInvoiceDateObj(b)?.getTime() || 0;
      return timeB - timeA;
    });
  }, [invoices]);

  // Filter invoices by client name, invoice number AND date
  const filteredInvoices = useMemo(() => {
    let list = sortedInvoices;

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (inv) =>
          inv.clientName?.toLowerCase().includes(q) ||
          inv.invoiceNumber?.toLowerCase().includes(q)
      );
    }

    // Date filter
    if (dateFilter === "today") {
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      list = list.filter((inv) => {
        const d = getInvoiceDateObj(inv);
        if (!d) return false;
        const invStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        return invStr === todayStr;
      });
    } else if (dateFilter === "week") {
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      list = list.filter((inv) => {
        const d = getInvoiceDateObj(inv);
        if (!d) return false;
        return d >= weekAgo && d <= now;
      });
    } else if (dateFilter === "month") {
      const now = new Date();
      const curMonth = now.getMonth();
      const curYear = now.getFullYear();
      list = list.filter((inv) => {
        const d = getInvoiceDateObj(inv);
        if (!d) return false;
        return d.getMonth() === curMonth && d.getFullYear() === curYear;
      });
    } else if (dateFilter === "custom") {
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        list = list.filter((inv) => {
          const d = getInvoiceDateObj(inv);
          if (!d) return false;
          return d >= start;
        });
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        list = list.filter((inv) => {
          const d = getInvoiceDateObj(inv);
          if (!d) return false;
          return d <= end;
        });
      }
    }

    return list;
  }, [sortedInvoices, searchQuery, dateFilter, startDate, endDate]);

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

  // Filter customers by name or phone
  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return customersList;
    const q = searchQuery.toLowerCase().trim();
    return customersList.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q))
    );
  }, [customersList, searchQuery]);

  const totalCustomerPages = Math.ceil(filteredCustomers.length / itemsPerPage) || 1;
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCustomers.slice(start, start + itemsPerPage);
  }, [filteredCustomers, currentPage, itemsPerPage]);

  const activeTotalPages = activeTab === "invoices" ? totalPages : totalCustomerPages;

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
                onClick={() => {
                  onRefresh();
                  fetchCustomers();
                }}
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
              onClick={() => onCreateNewInvoice()}
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
          <div
            className="stat-item"
            style={{ cursor: "pointer" }}
            onClick={() => {
              setActiveTab("customers");
              setCurrentPage(1);
            }}
            title="اضغط لعرض قائمة العملاء"
          >
            <span className="stat-number">{customersList.length || clientsCount}</span>
            <span className="stat-label-arabic">عدد العملاء</span>
          </div>

          <div className="stats-divider"></div>

          {/* Stat 2: الاجمالي العام لجميع العملاء */}
          <div
            className="stat-item"
            style={{ cursor: "pointer" }}
            onClick={() => {
              setActiveTab("invoices");
              setCurrentPage(1);
            }}
            title="اضغط لعرض جميع الفواتير"
          >
            <span className="stat-number">{totalRevenue.toLocaleString()}</span>
            <span className="stat-label-arabic">الاجمالي العام لجميع العملاء</span>
          </div>
        </div>

        {/* Navigation Tabs (الفواتير & العملاء) */}
        <div className="admin-tabs-bar">
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === "invoices" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("invoices");
              setCurrentPage(1);
            }}
          >
            <FileText size={16} />
            <span>الفواتير</span>
            <span className="admin-tab-badge">{invoices.length}</span>
          </button>

          <button
            type="button"
            className={`admin-tab-btn ${activeTab === "customers" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("customers");
              setCurrentPage(1);
              fetchCustomers();
            }}
          >
            <Users size={16} />
            <span>العملاء وسجلاتهم</span>
            <span className="admin-tab-badge">{customersList.length || clientsCount}</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="admin-search-bar">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder={
              activeTab === "invoices"
                ? "البحث عن عملاء أو أرقام فواتير..."
                : "البحث عن عميل بالاسم أو الهاتف..."
            }
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        {/* Date Filter Bar */}
        {activeTab === "invoices" && (
          <div className="admin-date-filter-bar">
            <div className="date-filter-pills">
              <span className="date-filter-label">
                <Calendar size={14} />
                <span>الفلترة بالتاريخ:</span>
              </span>

              <button
                type="button"
                className={`filter-pill-btn ${dateFilter === "all" ? "active" : ""}`}
                onClick={() => {
                  setDateFilter("all");
                  setStartDate("");
                  setEndDate("");
                  setCurrentPage(1);
                }}
              >
                الكل
              </button>

              <button
                type="button"
                className={`filter-pill-btn ${dateFilter === "today" ? "active" : ""}`}
                onClick={() => {
                  setDateFilter("today");
                  setCurrentPage(1);
                }}
              >
                اليوم
              </button>

              <button
                type="button"
                className={`filter-pill-btn ${dateFilter === "week" ? "active" : ""}`}
                onClick={() => {
                  setDateFilter("week");
                  setCurrentPage(1);
                }}
              >
                آخر 7 أيام
              </button>

              <button
                type="button"
                className={`filter-pill-btn ${dateFilter === "month" ? "active" : ""}`}
                onClick={() => {
                  setDateFilter("month");
                  setCurrentPage(1);
                }}
              >
                هذا الشهر
              </button>
            </div>

            {/* Custom Date Range Picker */}
            <div className="date-range-picker">
              <div className="date-input-wrap">
                <span className="date-range-text">من:</span>
                <input
                  type="date"
                  className="date-filter-input"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setDateFilter("custom");
                    setCurrentPage(1);
                  }}
                />
              </div>

              <div className="date-input-wrap">
                <span className="date-range-text">إلى:</span>
                <input
                  type="date"
                  className="date-filter-input"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setDateFilter("custom");
                    setCurrentPage(1);
                  }}
                />
              </div>

              {(dateFilter !== "all" || startDate || endDate) && (
                <button
                  type="button"
                  className="btn-clear-date-filter"
                  onClick={() => {
                    setDateFilter("all");
                    setStartDate("");
                    setEndDate("");
                    setCurrentPage(1);
                  }}
                  title="مسح فلتر التاريخ"
                >
                  <X size={13} />
                  <span>مسح الفلتر</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* View 1: Invoices Table */}
        {activeTab === "invoices" && (
          <div className="admin-table-card">
            <div className="table-scroll-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th className="th-client">اسم العميل</th>
                    <th className="th-date" style={{ textAlign: "center" }}>التاريخ</th>
                    <th className="th-action"></th>
                    <th className="th-total">الاجمالي العام</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedInvoices.map((inv) => (
                    <tr key={inv.id || inv._id}>
                      {/* Client with Avatar */}
                      <td>
                        <div
                          className="client-info-cell"
                          style={{ cursor: "pointer" }}
                          title="اضغط لفتح كشف حساب هذا العميل"
                          onClick={() => {
                            const matched = customersList.find(
                              (c) => c._id === inv.customerId || c.name === inv.clientName
                            ) || { name: inv.clientName, _id: inv.customerId, phone: inv.customerPhone };
                            handleOpenCustomerModal(matched);
                          }}
                        >
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

                      {/* Invoice Date Column */}
                      <td style={{ textAlign: "center" }}>
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            padding: "4px 10px",
                            backgroundColor: "#f8fafc",
                            border: "1px solid #e2e8f0",
                            borderRadius: "7px",
                            fontSize: "12px",
                            fontWeight: 600,
                            color: "#334155",
                          }}
                        >
                          <Calendar size={13} style={{ color: "#0f766e" }} />
                          <span dir="ltr">{formatDisplayDate(inv)}</span>
                        </div>
                      </td>

                      {/* Action Link: View → & Delete */}
                      <td className="action-cell">
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "flex-end",
                            gap: 6,
                          }}
                        >
                          <a
                            href={`${import.meta.env.VITE_BACKEND_URL}/api/v1/invoices/${inv.id || inv._id}/view`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="فتح الفاتورة في صفحة HTML مستقلة للطباعة والتنزيل"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              padding: "6px 9px",
                              borderRadius: "6px",
                              backgroundColor: "#f0fdfa",
                              color: "#135d66",
                              border: "1px solid #99f6e4",
                              textDecoration: "none",
                              fontSize: 12,
                              fontWeight: 700,
                              transition: "all 0.2s",
                            }}
                          >
                            <Printer size={13} />
                            <span>طباعة / HTML</span>
                          </a>

                          <button
                            type="button"
                            className="btn-view-invoice"
                            onClick={() => onViewInvoice(inv)}
                            title="عرض وتعديل هذه الفاتورة"
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

                      {/* Total Amount & Currency */}
                      <td>
                        <div className="total-amount-cell">
                          <span className="amount-number">
                            {inv.total?.toLocaleString() || inv.total}
                          </span>
                          <span className="amount-currency">SAR</span>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {paginatedInvoices.length === 0 && (
                    <tr>
                      <td
                        colSpan="4"
                        style={{
                          textAlign: "center",
                          padding: "32px",
                          color: "#6b7280",
                        }}
                      >
                        {isLoading
                          ? "جاري تحميل الفواتير من السيرفر..."
                          : "لا توجد فواتير مطابقة لبحثك"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* View 2: Customers Table */}
        {activeTab === "customers" && (
          <div className="admin-table-card">
            <div className="table-scroll-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th className="th-client" style={{ textAlign: "right" }}>
                      اسم العميل
                    </th>
                    <th style={{ textAlign: "center" }}>رقم الهاتف</th>
                    <th style={{ textAlign: "center" }}>عدد الفواتير</th>
                    <th className="th-action" style={{ textAlign: "center" }}>
                      إجراءات
                    </th>
                    <th className="th-total" style={{ textAlign: "left" }}>
                      إجمالي المشتريات
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCustomers.map((cust) => (
                    <tr key={cust._id}>
                      {/* Customer Name & Avatar */}
                      <td>
                        <div
                          className="client-info-cell"
                          style={{ cursor: "pointer" }}
                          onClick={() => handleOpenCustomerModal(cust)}
                          title="فتح كشف حساب وفواتير العميل"
                        >
                          <div className="client-avatar-badge avatar-default">
                            {cust.name?.slice(0, 2).toUpperCase()}
                          </div>
                          <span
                            className="client-name-text"
                            style={{ fontWeight: 700 }}
                          >
                            {cust.name}
                          </span>
                        </div>
                      </td>

                      {/* Phone */}
                      <td style={{ textAlign: "center" }}>
                        {cust.phone ? (
                          <span
                            style={{
                              fontSize: 13,
                              color: "#475569",
                              fontWeight: 600,
                            }}
                            dir="ltr"
                          >
                            📞 {cust.phone}
                          </span>
                        ) : (
                          <span style={{ fontSize: 12, color: "#94a3b8" }}>
                            غير مسجل
                          </span>
                        )}
                      </td>

                      {/* Invoices Count */}
                      <td style={{ textAlign: "center" }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "3px 10px",
                            borderRadius: "12px",
                            backgroundColor: "#f1f5f9",
                            color: "#0f766e",
                            fontSize: "12px",
                            fontWeight: 700,
                          }}
                        >
                          {cust.invoicesCount || 0}{" "}
                          {cust.invoicesCount === 1 ? "فاتورة" : "فواتير"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="action-cell">
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 8,
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => handleOpenCustomerModal(cust)}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 5,
                              padding: "6px 12px",
                              borderRadius: "7px",
                              backgroundColor: "#f0fdfa",
                              color: "#0f766e",
                              border: "1px solid #99f6e4",
                              fontSize: "12px",
                              fontWeight: 700,
                              cursor: "pointer",
                              transition: "all 0.15s",
                            }}
                            title="عرض كشف الحساب وجميع فواتير هذا العميل"
                          >
                            <Eye size={13} />
                            <span>كشف الحساب ({cust.invoicesCount || 0})</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onCreateNewInvoice(cust)}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              padding: "6px 10px",
                              borderRadius: "7px",
                              backgroundColor: "#004f49",
                              color: "#ffffff",
                              border: "none",
                              fontSize: "12px",
                              fontWeight: 700,
                              cursor: "pointer",
                              transition: "all 0.15s",
                            }}
                            title="إنشاء فاتورة جديدة لهذا العميل مباشرة"
                          >
                            <Plus size={13} />
                            <span>+ فاتورة</span>
                          </button>
                        </div>
                      </td>

                      {/* Total Amount */}
                      <td>
                        <div className="total-amount-cell">
                          <span className="amount-number">
                            {(cust.totalAmount || 0).toLocaleString()}
                          </span>
                          <span className="amount-currency">SAR</span>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {paginatedCustomers.length === 0 && (
                    <tr>
                      <td
                        colSpan="5"
                        style={{
                          textAlign: "center",
                          padding: "36px",
                          color: "#6b7280",
                        }}
                      >
                        {isLoadingCustomers
                          ? "جاري تحميل العملاء من السيرفر..."
                          : "لا يوجد عملاء مطابقين للبحث"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Dynamic Pagination Row */}
        <div className="admin-pagination-row">
          <button
            type="button"
            className="pagination-btn nav-text"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          >
            &lt; Prev
          </button>

          {Array.from({ length: Math.min(5, activeTotalPages) }, (_, i) => i + 1).map(
            (pageNum) => (
              <button
                key={pageNum}
                type="button"
                className={`pagination-btn ${
                  currentPage === pageNum ? "active" : ""
                }`}
                onClick={() => setCurrentPage(pageNum)}
              >
                {pageNum}
              </button>
            )
          )}

          {activeTotalPages > 5 && (
            <>
              <span className="pagination-dots">...</span>
              <button
                type="button"
                className={`pagination-btn ${
                  currentPage === activeTotalPages ? "active" : ""
                }`}
                onClick={() => setCurrentPage(activeTotalPages)}
              >
                {activeTotalPages}
              </button>
            </>
          )}

          <button
            type="button"
            className="pagination-btn nav-text"
            disabled={currentPage >= activeTotalPages}
            onClick={() => setCurrentPage((p) => Math.min(activeTotalPages, p + 1))}
          >
            Next &gt;
          </button>
        </div>
      </div>

      {/* Customer Account Statement Modal (ملف العميل وسجل الفواتير) */}
      {selectedCustomer && (
        <div
          className="customer-modal-backdrop"
          onClick={() => setSelectedCustomer(null)}
        >
          <div
            className="customer-modal-card"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            {/* Modal Header */}
            <div className="customer-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  className="client-avatar-badge avatar-default"
                  style={{ width: 44, height: 44, fontSize: 16 }}
                >
                  {selectedCustomer.name?.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: 18,
                      fontWeight: 800,
                      color: "#135d66",
                    }}
                  >
                    {selectedCustomer.name}
                  </h3>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginTop: 4,
                      color: "#64748b",
                      fontSize: 13,
                    }}
                  >
                    {selectedCustomer.phone ? (
                      <span dir="ltr">📞 {selectedCustomer.phone}</span>
                    ) : (
                      <span style={{ color: "#94a3b8" }}>
                        لا يوجد رقم هاتف مسجل
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button
                  type="button"
                  className="btn-nav-to-receipt"
                  style={{ padding: "8px 14px", fontSize: 13 }}
                  onClick={() => {
                    onCreateNewInvoice(selectedCustomer);
                    setSelectedCustomer(null);
                  }}
                >
                  <Plus size={15} />
                  <span>فاتورة جديدة لهذا العميل</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCustomer(null)}
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    color: "#64748b",
                    padding: 6,
                  }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="customer-modal-body">
              {/* Quick Summary Cards */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    background: "#f8fafc",
                    padding: 14,
                    borderRadius: 12,
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      color: "#64748b",
                      fontWeight: 600,
                    }}
                  >
                    إجمالي مسحوبات العميل
                  </span>
                  <div
                    style={{
                      fontSize: 22,
                      fontWeight: 800,
                      color: "#0f766e",
                      marginTop: 4,
                    }}
                  >
                    {(
                      selectedCustomer.totalAmount ||
                      customerInvoices.reduce(
                        (s, i) => s + (Number(i.total) || 0),
                        0
                      )
                    ).toLocaleString()}{" "}
                    SAR
                  </div>
                </div>
                <div
                  style={{
                    background: "#f8fafc",
                    padding: 14,
                    borderRadius: 12,
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      color: "#64748b",
                      fontWeight: 600,
                    }}
                  >
                    عدد الفواتير المسجلة
                  </span>
                  <div
                    style={{
                      fontSize: 22,
                      fontWeight: 800,
                      color: "#1e293b",
                      marginTop: 4,
                    }}
                  >
                    {customerInvoices.length}{" "}
                    {customerInvoices.length === 1 ? "فاتورة" : "فواتير"}
                  </div>
                </div>
              </div>

              {/* Invoices List for this Client */}
              <div>
                <h4
                  style={{
                    margin: "0 0 12px 0",
                    fontSize: 15,
                    fontWeight: 700,
                    color: "#334155",
                  }}
                >
                  سجل جميع فواتير العميل (كشف الحساب)
                </h4>
                {isLoadingCustomerDetails ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: 30,
                      color: "#64748b",
                    }}
                  >
                    جاري تحميل سجل فواتير العميل...
                  </div>
                ) : customerInvoices.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: 30,
                      color: "#94a3b8",
                      background: "#f8fafc",
                      borderRadius: 10,
                    }}
                  >
                    لا توجد فواتير مسجلة لهذا العميل بعد.
                  </div>
                ) : (
                  <div
                    style={{
                      overflowX: "auto",
                      border: "1px solid #e2e8f0",
                      borderRadius: 12,
                    }}
                  >
                    <table
                      style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        fontSize: 13,
                      }}
                    >
                      <thead>
                        <tr style={{ background: "#f1f5f9", textAlign: "right" }}>
                          <th style={{ padding: "10px 14px", color: "#475569" }}>
                            رقم الفاتورة
                          </th>
                          <th style={{ padding: "10px 14px", color: "#475569" }}>
                            التاريخ
                          </th>
                          <th style={{ padding: "10px 14px", color: "#475569" }}>
                            الإجمالي
                          </th>
                          <th
                            style={{
                              padding: "10px 14px",
                              color: "#475569",
                              textAlign: "left",
                            }}
                          >
                            إجراءات
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {customerInvoices.map((inv) => (
                          <tr
                            key={inv._id || inv.id}
                            style={{ borderTop: "1px solid #f1f5f9" }}
                          >
                            <td
                              style={{
                                padding: "10px 14px",
                                fontWeight: 700,
                                color: "#0f766e",
                              }}
                              dir="ltr"
                            >
                              {inv.invoiceNumber || `#${inv._id?.slice(-4)}`}
                            </td>
                            <td
                              style={{
                                padding: "10px 14px",
                                color: "#64748b",
                              }}
                            >
                              {inv.createdAt
                                ? new Date(inv.createdAt).toLocaleDateString(
                                    "ar-EG"
                                  )
                                : inv.date || "-"}
                            </td>
                            <td
                              style={{
                                padding: "10px 14px",
                                fontWeight: 700,
                                color: "#1e293b",
                              }}
                            >
                              {Number(inv.total || 0).toLocaleString()} SAR
                            </td>
                            <td
                              style={{
                                padding: "10px 14px",
                                textAlign: "left",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  gap: 6,
                                  justifyContent: "flex-end",
                                }}
                              >
                                <a
                                  href={`${import.meta.env.VITE_BACKEND_URL}/api/v1/invoices/${inv.id || inv._id}/view`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    padding: "5px 8px",
                                    borderRadius: 6,
                                    background: "#f0fdfa",
                                    color: "#0f766e",
                                    border: "1px solid #99f6e4",
                                    fontSize: 12,
                                    textDecoration: "none",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 4,
                                  }}
                                >
                                  <Printer size={12} />
                                  <span>طباعة</span>
                                </a>
                                <button
                                  type="button"
                                  onClick={() => {
                                    onViewInvoice(inv);
                                    setSelectedCustomer(null);
                                  }}
                                  style={{
                                    padding: "5px 10px",
                                    borderRadius: 6,
                                    background: "#135d66",
                                    color: "#fff",
                                    border: "none",
                                    fontSize: 12,
                                    fontWeight: 700,
                                    cursor: "pointer",
                                  }}
                                >
                                  عرض
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

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
