import React, { useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import confetti from "canvas-confetti";
import {
  FileDown,
  CheckCircle2,
  Eye,
  Edit3,
  Receipt as ReceiptIcon,
} from "lucide-react";

import Receipt from "../components/Receipt";
import ControlPanel from "../components/ControlPanel";
import SubmitModal from "../components/SubmitModal";

import {
  getItemNameByIndex,
  getCurrentDateFormatted,
} from "../utils/arabicOrdinals";
import { downloadReceiptPDF, shareReceiptOnWhatsApp } from "../utils/exportPdf";
import { initialSampleItems } from "../data/invoicesData";
import {
  getInvoiceById,
  normalizeInvoice,
  downloadInvoicePDFFromServer,
  fetchInvoicePDFBlob,
} from "../APIs/invoicesAPI";
import {
  getNextInvoiceNumber,
  formatInvoiceNumber,
} from "../utils/invoiceNumbering";

export default function ReceiptPage({
  invoicesList = [],
  onSaveNewInvoice,
  zoomLevel,
  fitScale,
  showPanel,
  setContainerWidth,
  containerWidth,
  isGeneratingPdf,
  setIsGeneratingPdf,
  isSubmitModalOpen,
  setIsSubmitModalOpen,
  receiptActionsRef,
}) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Receipt manual states
  const [customerName, setCustomerName] = useState("");
  const [tax, setTax] = useState("0");
  const [invoiceNumber, setInvoiceNumber] = useState(() => getNextInvoiceNumber(invoicesList));
  const [invoiceDate, setInvoiceDate] = useState(getCurrentDateFormatted());
  const [items, setItems] = useState([]);
  const [currentMongoId, setCurrentMongoId] = useState(null);

  // Logo & Badge Theme customization states
  const [badgeTheme, setBadgeTheme] = useState("white"); // "white" | "dark"
  const [logoChoice, setLogoChoice] = useState("cropped"); // "cropped" | "icon"

  // Mobile tabs state
  const [activeMobileTab, setActiveMobileTab] = useState("form");
  const [isMobile, setIsMobile] = useState(false);
  const previewContainerRef = useRef(null);

  const handleLoadSample = () => {
    setCustomerName("");
    setTax("0");
    setInvoiceNumber(getNextInvoiceNumber(invoicesList));
    setInvoiceDate(getCurrentDateFormatted());
    setItems([]);
    setCurrentMongoId(null);
  };

  const handleResetNew = () => {
    setCustomerName("");
    setTax("0");
    setInvoiceNumber(getNextInvoiceNumber(invoicesList));
    setInvoiceDate(getCurrentDateFormatted());
    setItems([]);
    setCurrentMongoId(null);
  };

  // Load invoice from URL ?id=... or ?new=true
  useEffect(() => {
    const invId = searchParams.get("id");
    const isNew = searchParams.get("new");

    if (invId) {
      setCurrentMongoId(invId);
      const found = invoicesList.find((i) => i.id === invId || i._id === invId);
      if (found) {
        setCustomerName(found.clientName || found.name || "");
        setInvoiceNumber(found.invoiceNumber?.replace("INV-", "") || "1");
        setInvoiceDate(found.date || getCurrentDateFormatted());
        setTax(found.tax != null ? String(found.tax) : "0");
        if (found.items && found.items.length > 0) {
          setItems(found.items);
        }
        if (found._id) {
          setCurrentMongoId(found._id);
        }
        setActiveMobileTab("preview");
        return;
      }

      // If not found in local cache (e.g. direct URL), fetch directly from API
      if (invId && !invId.startsWith("inv-")) {
        getInvoiceById(invId)
          .then((doc) => {
            const normalized = normalizeInvoice(doc);
            if (normalized) {
              setCustomerName(normalized.clientName || "");
              setInvoiceNumber(normalized.invoiceNumber?.replace("INV-", "") || "1");
              setInvoiceDate(normalized.date || getCurrentDateFormatted());
              setTax(String(normalized.tax || "0"));
              if (normalized.items?.length > 0) {
                setItems(normalized.items);
              }
              if (normalized._id) {
                setCurrentMongoId(normalized._id);
              }
              setActiveMobileTab("preview");
            }
          })
          .catch((err) => {
            console.warn("Could not fetch invoice by ID from API:", err);
          });
        return;
      }
    } else if (isNew) {
      handleResetNew();
      setActiveMobileTab("form");
    }
  }, [searchParams]);

  // Responsive mobile measurement
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 860;
      setIsMobile(mobile);
      if (previewContainerRef.current) {
        setContainerWidth(previewContainerRef.current.clientWidth);
      } else {
        setContainerWidth(window.innerWidth);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [activeMobileTab, setContainerWidth]);

  // Calculations
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const q = parseFloat(item.quantity) || 0;
      const p = parseFloat(item.price) || 0;
      return sum + q * p;
    }, 0);
  }, [items]);

  const grandTotal = useMemo(() => {
    const taxNum = parseFloat(tax) || 0;
    return subtotal + taxNum;
  }, [subtotal, tax]);

  // Handlers
  const handleAddItem = () => {
    const nextIndex = items.length;
    const newItem = {
      id: `item-${Date.now()}-${nextIndex}`,
      name: '',
      quantity: 1,
      price: 0,
    };
    setItems((prev) => [...prev, newItem]);
  };

  const handleRemoveItem = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUpdateItem = (id, field, value) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };



  const handleSubmitInvoice = async () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });

    const clientInitials = customerName
      ? customerName
        .split(" ")
        .filter(Boolean)
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
      : "CL";

    const finalRawNum = invoiceNumber?.trim() || getNextInvoiceNumber(invoicesList);
    const formattedInvNum = formatInvoiceNumber(finalRawNum);

    const newInvoiceRecord = {
      id: `inv-${Date.now()}`,
      clientName: customerName || `عميل #${finalRawNum}`,
      invoiceNumber: formattedInvNum,
      avatarLetters: clientInitials,
      avatarClass: "avatar-default",
      total: Math.round(grandTotal),
      tax: tax,
      date: invoiceDate,
      items: items,
    };

    let savedRecord = null;
    if (onSaveNewInvoice) {
      savedRecord = await onSaveNewInvoice(newInvoiceRecord);
      if (savedRecord?._id) {
        setCurrentMongoId(savedRecord._id);
      }
    }

    // Open confirmation modal (NO automatic download or print)
    setIsSubmitModalOpen(true);
  };

  const handleDownloadPdf = async (idOverride) => {
    setIsGeneratingPdf(true);
    const targetId = idOverride || currentMongoId || searchParams.get("id");
    const fileName = `فاتورة_مبيعات_${customerName || invoiceNumber}.pdf`;

    try {
      // 1. Try server-side Puppeteer PDF generation if invoice exists on server
      if (targetId && !String(targetId).startsWith("inv-")) {
        await downloadInvoicePDFFromServer(targetId, fileName);
        return;
      }

      // 2. If not saved on server yet, save first to get Mongo ID and generate server PDF
      if (onSaveNewInvoice) {
        const clientInitials = customerName
          ? customerName.split(" ").filter(Boolean).map((n) => n[0]).join("").slice(0, 2).toUpperCase()
          : "CL";
        const finalRawNum = invoiceNumber?.trim() || getNextInvoiceNumber(invoicesList);
        const formattedInvNum = formatInvoiceNumber(finalRawNum);
        const saved = await onSaveNewInvoice({
          id: `inv-${Date.now()}`,
          clientName: customerName || `عميل #${finalRawNum}`,
          invoiceNumber: formattedInvNum,
          avatarLetters: clientInitials,
          avatarClass: "avatar-default",
          total: Math.round(grandTotal),
          tax: tax,
          date: invoiceDate,
          items: items,
        });

        if (saved?._id) {
          setCurrentMongoId(saved._id);
          await downloadInvoicePDFFromServer(saved._id, fileName);
          return;
        }
      }

      // 3. Fallback to client-side PDF if offline
      await downloadReceiptPDF("receipt-document", fileName);
    } catch (err) {
      console.warn("Server PDF generation failed, falling back to client-side PDF:", err);
      try {
        await downloadReceiptPDF("receipt-document", fileName);
      } catch (fallbackErr) {
        console.error("PDF generation failed completely:", fallbackErr);
        alert("حدث خطأ أثناء تنزيل ملف الـ PDF. يرجى المحاولة مرة أخرى.");
      }
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleShareWhatsApp = async () => {
    setIsGeneratingPdf(true);
    let targetId = currentMongoId || searchParams.get("id");
    const cleanName = customerName?.trim() ? `_${customerName.trim().replace(/\s+/g, "_")}` : "";
    const filename = `فاتورة_مبيعات_${invoiceNumber}${cleanName}.pdf`;
    const shareText = `*فاتورة مبيعات - شركة الوفاء للمستلزمات*\n\n📄 رقم الفاتورة: #${invoiceNumber}\n👤 العميل: ${customerName || "—"}\n💰 الإجمالي: ${grandTotal.toFixed(2)} ريال`;

    try {
      // 1. Ensure invoice is saved to server to get MongoDB ID
      if (!targetId || String(targetId).startsWith("inv-")) {
        if (onSaveNewInvoice) {
          const clientInitials = customerName
            ? customerName.split(" ").filter(Boolean).map((n) => n[0]).join("").slice(0, 2).toUpperCase()
            : "CL";
          const finalRawNum = invoiceNumber?.trim() || getNextInvoiceNumber(invoicesList);
          const formattedInvNum = formatInvoiceNumber(finalRawNum);
          const saved = await onSaveNewInvoice({
            id: `inv-${Date.now()}`,
            clientName: customerName || `عميل #${finalRawNum}`,
            invoiceNumber: formattedInvNum,
            avatarLetters: clientInitials,
            avatarClass: "avatar-default",
            total: Math.round(grandTotal),
            tax: tax,
            date: invoiceDate,
            items: items,
          });
          if (saved?._id) {
            targetId = saved._id;
            setCurrentMongoId(saved._id);
          }
        }
      }

      // 2. Fetch the exact server Puppeteer PDF file and share it
      if (targetId && !String(targetId).startsWith("inv-")) {
        const blob = await fetchInvoicePDFBlob(targetId);
        if (blob) {
          const file = new File([blob], filename, { type: "application/pdf" });
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: `فاتورة مبيعات #${invoiceNumber}`,
              text: shareText,
            });
            return;
          }
        }
      }

      // 3. Fallback
      await shareReceiptOnWhatsApp({
        invoiceNumber,
        customerName,
        grandTotal,
        elementId: "receipt-document",
      });
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("WhatsApp share failed:", err);
      }
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Register actions to ref for Navbar triggers
  useEffect(() => {
    if (receiptActionsRef) {
      receiptActionsRef.current = {
        submit: handleSubmitInvoice,
        downloadPdf: handleDownloadPdf,
        shareWhatsApp: handleShareWhatsApp,
      };
    }
  });

  // Global event listeners for Navbar triggers
  useEffect(() => {
    const onPdf = () => handleDownloadPdf();
    const onSubmit = () => handleSubmitInvoice();

    window.addEventListener("alwafaa:download-pdf", onPdf);
    window.addEventListener("alwafaa:submit", onSubmit);

    return () => {
      window.removeEventListener("alwafaa:download-pdf", onPdf);
      window.removeEventListener("alwafaa:submit", onSubmit);
    };
  }, [handleSubmitInvoice, handleDownloadPdf,]);

  return (
    <div className="receipt-page-container">
      {/* Mobile Tab Switcher */}
      <div className="mobile-tabs-container no-print">
        <div className="mobile-tabs-bar">
          <button
            type="button"
            className={`mobile-tab-btn ${activeMobileTab === "form" ? "active" : ""
              }`}
            onClick={() => setActiveMobileTab("form")}
          >
            <Edit3 size={15} />
            <span>تعديل الفاتورة</span>
          </button>

          <button
            type="button"
            className={`mobile-tab-btn ${activeMobileTab === "preview" ? "active" : ""
              }`}
            onClick={() => setActiveMobileTab("preview")}
          >
            <Eye size={15} />
            <span>معاينة الفاتورة</span>
          </button>
        </div>
      </div>

      {/* Main Workspace */}
      <main className="app-workspace">
        {/* Control Panel */}
        {(!isMobile ? showPanel : activeMobileTab === "form") && (
          <ControlPanel
            customerName={customerName}
            setCustomerName={setCustomerName}
            invoiceNumber={invoiceNumber}
            setInvoiceNumber={setInvoiceNumber}
            invoiceDate={invoiceDate}
            setInvoiceDate={setInvoiceDate}
            tax={tax}
            setTax={setTax}
            items={items}
            addItem={handleAddItem}
            removeItem={handleRemoveItem}
            updateItem={handleUpdateItem}
            subtotal={subtotal}
            grandTotal={grandTotal}
            badgeTheme={badgeTheme}
            setBadgeTheme={setBadgeTheme}
            logoChoice={logoChoice}
            setLogoChoice={setLogoChoice}
            onSubmit={handleSubmitInvoice}
            onDownloadPdf={handleDownloadPdf}
            onLoadSample={handleLoadSample}
            onResetNew={handleResetNew}
            isGeneratingPdf={isGeneratingPdf}
          />
        )}

        {/* Live Receipt Document Preview */}
        {(!isMobile || activeMobileTab === "preview") && (
          <section className="preview-pane" ref={previewContainerRef}>
            <div className="preview-badge-status no-print">
              <ReceiptIcon size={14} />
              <span>معاينة الورقة (جاهزة للطباعة والـ PDF بنصوص عربية سليمة)</span>
            </div>

            <div className="receipt-fit-outer">
              <div
                className="receipt-mobile-scaler"
                style={{
                  width: `${723 * fitScale}px`,
                  height: `${1024 * fitScale}px`,
                }}
              >
                <div
                  className="receipt-mobile-inner"
                  style={{
                    transform: `scale(${fitScale})`,
                  }}
                >
                  <Receipt
                    invoiceNumber={invoiceNumber}
                    customerName={customerName}
                    invoiceDate={invoiceDate}
                    items={items}
                    tax={tax}
                    subtotal={subtotal}
                    grandTotal={grandTotal}
                    minRows={7}
                    badgeTheme={badgeTheme}
                    logoUrl={logoChoice === "icon" ? "/logo-icon.png" : "/logo.png"}
                  />
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Submit Confirmation Modal */}
      <SubmitModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        invoiceNumber={invoiceNumber}
        customerName={customerName}
        invoiceDate={invoiceDate}
        itemCount={items.length}
        subtotal={subtotal}
        tax={tax}
        grandTotal={grandTotal}
        onDownloadPdf={handleDownloadPdf}
        onShareWhatsApp={handleShareWhatsApp}
        onNewInvoice={handleResetNew}
        isGeneratingPdf={isGeneratingPdf}
      />
    </div>
  );
}
