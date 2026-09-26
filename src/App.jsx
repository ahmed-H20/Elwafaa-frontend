import React, { useState, useMemo, useEffect, useRef } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import "./App.css";

import Navbar from "./components/Navbar";
import ReceiptPage from "./pages/ReceiptPage";
import AdminPage from "./pages/AdminPage";
import { initialAdminInvoices } from "./data/invoicesData";
import {
  fetchNormalizedInvoices,
  createInvoice,
  deleteInvoice,
  formatInvoiceForServer,
  normalizeInvoice,
} from "./APIs/invoicesAPI";
import {
  healDuplicateInvoices,
  getNextInvoiceNumber,
  formatInvoiceNumber,
} from "./utils/invoiceNumbering";

export default function App() {
  // Shared invoices list with localStorage persistence and API sync
  const [invoicesList, setInvoicesList] = useState(() => {
    const saved = localStorage.getItem("alwafaa_invoices");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return healDuplicateInvoices(parsed);
        }
      } catch (e) {
        return initialAdminInvoices;
      }
    }
    return healDuplicateInvoices(initialAdminInvoices);
  });

  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false);
  const [apiStatus, setApiStatus] = useState("idle"); // "idle" | "loading" | "connected" | "offline"

  // UI state for receipt scaling & controls
  const [showPanel, setShowPanel] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [containerWidth, setContainerWidth] = useState(723);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Ref for receipt actions (submit, download pdf, print)
  const receiptActionsRef = useRef({});

  // Sync to localStorage whenever invoices change
  useEffect(() => {
    if (invoicesList && invoicesList.length > 0) {
      localStorage.setItem("alwafaa_invoices", JSON.stringify(invoicesList));
    }
  }, [invoicesList]);

  // Load invoices dynamically from Server API on mount
  const refreshInvoices = async () => {
    try {
      setIsLoadingInvoices(true);
      setApiStatus("loading");
      const serverInvoices = await fetchNormalizedInvoices();
      if (serverInvoices && serverInvoices.length > 0) {
        setInvoicesList(serverInvoices);
        setApiStatus("connected");
      } else {
        setApiStatus("connected");
      }
    } catch (err) {
      console.warn("Backend API not connected, using offline cache:", err.message);
      setApiStatus("offline");
    } finally {
      setIsLoadingInvoices(false);
    }
  };

  useEffect(() => {
    refreshInvoices();
  }, []);

  // Save new invoice dynamically to MongoDB API
  const handleSaveNewInvoice = async (recordOrFormData) => {
    // Ensure invoiceNumber is unique
    const determinedInvNum =
      recordOrFormData.invoiceNumber &&
      !invoicesList.some((i) => i.invoiceNumber === recordOrFormData.invoiceNumber)
        ? recordOrFormData.invoiceNumber
        : formatInvoiceNumber(getNextInvoiceNumber(invoicesList));

    try {
      // 1. Format payload according to server validation rules
      const payload = formatInvoiceForServer({
        customerName: recordOrFormData.clientName || recordOrFormData.customerName || recordOrFormData.name,
        items: recordOrFormData.items || recordOrFormData.products || [],
        tax: recordOrFormData.tax || 0,
        invoiceNumber: determinedInvNum,
      });

      // 2. Call backend POST /api/v1/invoices
      const res = await createInvoice(payload);

      // 3. Normalize created record
      let savedRecord;
      if (res && res.invoice) {
        savedRecord = normalizeInvoice(res.invoice, invoicesList.length);
      } else {
        savedRecord = normalizeInvoice(
          {
            ...recordOrFormData,
            invoiceNumber: determinedInvNum,
            name: payload.name,
            products: payload.products,
            tax: payload.tax,
            total: recordOrFormData.total,
            createdAt: new Date().toISOString(),
          },
          invoicesList.length
        );
      }

      // Update state with newest at top, healed for uniqueness
      setInvoicesList((prev) =>
        healDuplicateInvoices([
          savedRecord,
          ...prev.filter((i) => i.id !== savedRecord.id && i._id !== savedRecord._id),
        ])
      );
      return savedRecord;
    } catch (err) {
      console.error("Backend error when saving invoice, saving locally:", err);
      const fallbackRecord = normalizeInvoice(
        {
          ...recordOrFormData,
          invoiceNumber: determinedInvNum,
        },
        invoicesList.length
      );
      setInvoicesList((prev) => healDuplicateInvoices([fallbackRecord, ...prev]));
      return fallbackRecord;
    }
  };

  // Delete invoice handler
  const handleDeleteInvoice = async (id, mongoId) => {
    const targetId = mongoId || id;
    try {
      if (targetId && !String(targetId).startsWith("inv-")) {
        await deleteInvoice(targetId);
      }
    } catch (err) {
      console.error("Error deleting invoice from server:", err);
    } finally {
      setInvoicesList((prev) => prev.filter((inv) => inv.id !== id && inv._id !== id && inv._id !== targetId));
    }
  };

  // Zoom controls
  const zoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.1, 1.4));
  const zoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.1, 0.5));
  const resetZoom = () => setZoomLevel(1);

  // Navbar button action triggers
  const handleNavbarSubmit = () => {
    if (receiptActionsRef.current?.submit) {
      receiptActionsRef.current.submit();
    } else {
      window.dispatchEvent(new CustomEvent("alwafaa:submit"));
    }
  };

  const handleNavbarDownloadPdf = () => {
    if (receiptActionsRef.current?.downloadPdf) {
      receiptActionsRef.current.downloadPdf();
    } else {
      window.dispatchEvent(new CustomEvent("alwafaa:download-pdf"));
    }
  };

  const handleNavbarPrint = () => {
    if (receiptActionsRef.current?.print) {
      receiptActionsRef.current.print();
    } else {
      window.print();
    }
  };

  // Mobile scale computation
  const fitScale = useMemo(() => {
    const isMobile = window.innerWidth <= 860;
    if (!isMobile) return zoomLevel;
    const availableW = Math.max(280, containerWidth - 24);
    const baseScale = Math.min(1, availableW / 723);
    return baseScale * zoomLevel;
  }, [containerWidth, zoomLevel]);

  return (
    <div className="app-container">
      {/* Top Navbar */}
      <Navbar
        zoomLevel={zoomLevel}
        fitScale={fitScale}
        zoomIn={zoomIn}
        zoomOut={zoomOut}
        resetZoom={resetZoom}
        showPanel={showPanel}
        setShowPanel={setShowPanel}
        onSubmitInvoice={handleNavbarSubmit}
        onDownloadPdf={handleNavbarDownloadPdf}
        onPrint={handleNavbarPrint}
        isGeneratingPdf={isGeneratingPdf}
      />

      {/* Declarative Routes */}
      <Routes>
        {/* Default route redirects to /receipt */}
        <Route path="/" element={<Navigate to="/receipt" replace />} />

        {/* Dedicated Receipt Page Route */}
        <Route
          path="/receipt"
          element={
            <ReceiptPage
              invoicesList={invoicesList}
              onSaveNewInvoice={handleSaveNewInvoice}
              zoomLevel={zoomLevel}
              fitScale={fitScale}
              showPanel={showPanel}
              setContainerWidth={setContainerWidth}
              containerWidth={containerWidth}
              isGeneratingPdf={isGeneratingPdf}
              setIsGeneratingPdf={setIsGeneratingPdf}
              isSubmitModalOpen={isSubmitModalOpen}
              setIsSubmitModalOpen={setIsSubmitModalOpen}
              receiptActionsRef={receiptActionsRef}
            />
          }
        />

        {/* Dedicated Admin Page Route */}
        <Route
          path="/admin"
          element={
            <AdminPage
              invoicesList={invoicesList}
              isLoading={isLoadingInvoices}
              onRefresh={refreshInvoices}
              onDeleteInvoice={handleDeleteInvoice}
              apiStatus={apiStatus}
            />
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/receipt" replace />} />
      </Routes>
    </div>
  );
}
