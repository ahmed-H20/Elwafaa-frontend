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
import { downloadReceiptPDF } from "../utils/exportPdf";
import { initialSampleItems } from "../data/invoicesData";
import { getInvoiceById, normalizeInvoice } from "../APIs/invoicesAPI";
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
  const [tax, setTax] = useState("0.00");
  const [invoiceNumber, setInvoiceNumber] = useState(() => getNextInvoiceNumber(invoicesList));
  const [invoiceDate, setInvoiceDate] = useState(getCurrentDateFormatted());
  const [items, setItems] = useState(initialSampleItems);

  // Logo & Badge Theme customization states
  const [badgeTheme, setBadgeTheme] = useState("white"); // "white" | "dark"
  const [logoChoice, setLogoChoice] = useState("cropped"); // "cropped" | "icon"

  // Mobile tabs state
  const [activeMobileTab, setActiveMobileTab] = useState("form");
  const [isMobile, setIsMobile] = useState(false);
  const previewContainerRef = useRef(null);

  // Load invoice from URL ?id=... or ?new=true
  useEffect(() => {
    const invId = searchParams.get("id");
    const isNew = searchParams.get("new");

    if (invId) {
      const found = invoicesList.find((i) => i.id === invId || i._id === invId);
      if (found) {
        setCustomerName(found.clientName || found.name || "");
        setInvoiceNumber(found.invoiceNumber?.replace("INV-", "") || "1");
        setInvoiceDate(found.date || getCurrentDateFormatted());
        setTax(found.tax != null ? String(found.tax) : "0.00");
        if (found.items && found.items.length > 0) {
          setItems(found.items);
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
              setTax(String(normalized.tax || "0.00"));
              if (normalized.items?.length > 0) {
                setItems(normalized.items);
              }
              setActiveMobileTab("preview");
            }
          })
          .catch((err) => {
            console.warn("Could not fetch invoice by ID from API:", err);
          });
        return;
      }
    }

    if (isNew) {
      handleResetNew();
      setActiveMobileTab("form");
      return;
    }

    // Default: load initial sample
    handleLoadSample();
  }, [searchParams, invoicesList]);

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
    const autoName = getItemNameByIndex(nextIndex);
    const newItem = {
      id: `item-${Date.now()}-${nextIndex}`,
      name: autoName,
      quantity: 1,
      price: 10.0,
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

  const handleLoadSample = () => {
    setCustomerName("");
    setTax("0.00");
    setInvoiceNumber(getNextInvoiceNumber(invoicesList));
    setInvoiceDate(getCurrentDateFormatted());
    setItems(initialSampleItems);
  };

  const handleResetNew = () => {
    setCustomerName("");
    setTax("0.00");
    setInvoiceNumber(getNextInvoiceNumber(invoicesList));
    setInvoiceDate(getCurrentDateFormatted());
    setItems([
      {
        id: `item-${Date.now()}-0`,
        name: getItemNameByIndex(0),
        quantity: 1,
        price: 10.0,
      },
    ]);
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

    if (onSaveNewInvoice) {
      await onSaveNewInvoice(newInvoiceRecord);
    }

    // Automatically prepare next sequential invoice number for next invoice
    const nextNum = getNextInvoiceNumber([...invoicesList, newInvoiceRecord]);
    setInvoiceNumber(nextNum);

    setIsSubmitModalOpen(true);

    // Automatically trigger PDF download when submitting/saving invoice
    setTimeout(() => {
      handleDownloadPdf();
    }, 250);
  };

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const fileName = `فاتورة_مبيعات_${customerName}.pdf`;
      await downloadReceiptPDF("receipt-document", fileName);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("حدث خطأ أثناء تنزيل ملف الـ PDF. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Register actions to ref for Navbar triggers
  useEffect(() => {
    if (receiptActionsRef) {
      receiptActionsRef.current = {
        submit: handleSubmitInvoice,
        downloadPdf: handleDownloadPdf,
        print: handlePrint,
      };
    }
  });

  // Global event listeners for Navbar triggers
  useEffect(() => {
    const onPdf = () => handleDownloadPdf();
    const onSubmit = () => handleSubmitInvoice();
    const onPrint = () => handlePrint();

    window.addEventListener("alwafaa:download-pdf", onPdf);
    window.addEventListener("alwafaa:submit", onSubmit);
    window.addEventListener("alwafaa:print", onPrint);

    return () => {
      window.removeEventListener("alwafaa:download-pdf", onPdf);
      window.removeEventListener("alwafaa:submit", onSubmit);
      window.removeEventListener("alwafaa:print", onPrint);
    };
  }, [handleSubmitInvoice, handleDownloadPdf, handlePrint]);

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
            onPrint={handlePrint}
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

      {/* Mobile Sticky Bottom Bar */}
      <div className="mobile-bottom-bar no-print">
        <button
          type="button"
          className="btn-mobile-submit"
          onClick={handleSubmitInvoice}
        >
          <CheckCircle2 size={16} />
          <span>اعتماد (Submit)</span>
        </button>

        <button
          type="button"
          className="btn-mobile-pdf"
          onClick={handleDownloadPdf}
          disabled={isGeneratingPdf}
        >
          <FileDown size={15} />
          <span>{isGeneratingPdf ? "جاري التجهيز..." : "PDF"}</span>
        </button>

        <button
          type="button"
          className="btn-mobile-view-toggle"
          onClick={() =>
            setActiveMobileTab((prev) => (prev === "form" ? "preview" : "form"))
          }
        >
          {activeMobileTab === "form" ? (
            <>
              <Eye size={14} />
              <span>المعاينة</span>
            </>
          ) : (
            <>
              <Edit3 size={14} />
              <span>التعديل</span>
            </>
          )}
        </button>
      </div>

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
        onPrint={handlePrint}
        onNewInvoice={handleResetNew}
        isGeneratingPdf={isGeneratingPdf}
      />
    </div>
  );
}
