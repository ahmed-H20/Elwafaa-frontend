// ─── Invoices API Layer ───────────────────────────────────────────────────────
// Maps every server endpoint under /api/v1/invoices to a typed JS function.
//
// Server routes (server/route.js):
//   POST   /api/v1/invoices          → createInvoice
//   GET    /api/v1/invoices          → getAllInvoices
//   GET    /api/v1/invoices/:id      → getInvoiceById
//   PUT    /api/v1/invoices/:id      → updateInvoice
//   DELETE /api/v1/invoices/:id      → deleteInvoice
// ─────────────────────────────────────────────────────────────────────────────

import { api } from "./apiClient";

const ENDPOINT = "/invoices";

// ─── Create ───────────────────────────────────────────────────────────────────

/**
 * Create a new invoice.
 *
 * Required body fields (server validation):
 *   - name     {string}  — client name (required)
 *   - products {Array}   — array of { name, qty, price } (required)
 *   - tax      {number}  — tax percentage (optional, default 0)
 *
 * @param {{ name: string, products: Array<{name:string, qty:number, price:number}>, tax?: number }} invoiceData
 * @returns {Promise<{ message: string }>}
 */
export const createInvoice = (invoiceData) => api.post(ENDPOINT, invoiceData);

// ─── Read All ─────────────────────────────────────────────────────────────────

/**
 * Fetch all invoices.
 *
 * @returns {Promise<Array<Invoice>>}
 */
export const getAllInvoices = () => api.get(ENDPOINT);

// ─── Read One ─────────────────────────────────────────────────────────────────

/**
 * Fetch a single invoice by its MongoDB _id.
 *
 * @param {string} id - MongoDB ObjectId string
 * @returns {Promise<Invoice>}
 */
export const getInvoiceById = (id) => api.get(`${ENDPOINT}/${id}`);

// ─── Update ───────────────────────────────────────────────────────────────────

/**
 * Update an existing invoice.
 *
 * Accepted body fields:
 *   - name          {string}
 *   - tax           {number}
 *   - products      {Array<{name:string, qty:number, price:number}>}
 *   - invoiceNumber {string}
 *
 * @param {string} id - MongoDB ObjectId string
 * @param {Object} updateData
 * @returns {Promise<{ message: string, invoice: Object }>}
 */
export const updateInvoice = (id, updateData) =>
  api.put(`${ENDPOINT}/${id}`, updateData);

// ─── Delete ───────────────────────────────────────────────────────────────────

/**
 * Delete an invoice by its MongoDB _id.
 *
 * @param {string} id - MongoDB ObjectId string
 * @returns {Promise<{ message: string }>}
 */
export const deleteInvoice = (id) => api.delete(`${ENDPOINT}/${id}`);

// ─── Data Transformers & Adapters ─────────────────────────────────────────────

/**
 * Converts a MongoDB invoice document (or legacy client record) into a unified UI invoice object.
 *
 * @param {Object} doc - MongoDB document or local invoice
 * @param {number} [index] - fallback index for numbering
 * @returns {Object} Unified UI invoice object
 */
export const normalizeInvoice = (doc, index = 0) => {
  if (!doc) return null;

  const id = doc._id || doc.id || `inv-${Date.now()}-${index}`;
  const clientName = doc.name || doc.clientName || "عميل غير مسمى";

  const clientInitials = clientName
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "CL";

  // Format date
  let formattedDate = doc.date;
  if (doc.createdAt) {
    const d = new Date(doc.createdAt);
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      formattedDate = `${year}/${month}/${day}`;
    }
  }

  // Normalize products / items
  const rawItems = doc.products || doc.items || [];
  const items = rawItems.map((p, idx) => ({
    id: p._id || p.id || `item-${idx}-${Date.now()}`,
    name: p.name || `صنف ${idx + 1}`,
    quantity: p.qty != null ? Number(p.qty) : (p.quantity != null ? Number(p.quantity) : 1),
    price: p.price != null ? Number(p.price) : 0,
  }));

  // Determine invoice number
  let invoiceNumber = doc.invoiceNumber;
  if (!invoiceNumber) {
    if (doc.id && typeof doc.id === "number") {
      invoiceNumber = `INV-${String(doc.id).padStart(3, "0")}`;
    } else if (doc._id) {
      invoiceNumber = `INV-${String(doc._id).slice(-4).toUpperCase()}`;
    } else {
      invoiceNumber = `INV-${String(index + 1).padStart(3, "0")}`;
    }
  }

  return {
    id: String(id),
    _id: doc._id,
    clientName,
    invoiceNumber,
    avatarLetters: doc.avatarLetters || clientInitials,
    avatarClass: doc.avatarClass || "avatar-default",
    total: doc.total != null ? Number(doc.total) : 0,
    tax: doc.tax != null ? String(doc.tax) : "0.00",
    date: formattedDate || new Date().toISOString().split("T")[0].replace(/-/g, "/"),
    items,
    rawDoc: doc,
  };
};

/**
 * Formats user form data to match the payload expected by the server's POST /invoices route.
 *
 * @param {Object} formData
 * @param {string} formData.customerName
 * @param {Array} formData.items
 * @param {number|string} [formData.tax]
 * @returns {{ name: string, products: Array<{name: string, qty: number, price: number}>, tax: number }}
 */
export const formatInvoiceForServer = ({ customerName, items = [], tax = 0, invoiceNumber }) => {
  return {
    name: customerName?.trim() || "عميل غير مسمى",
    tax: parseFloat(tax) || 0,
    invoiceNumber: invoiceNumber ? String(invoiceNumber) : undefined,
    products: (items || []).map((item) => ({
      name: item.name?.trim() || "صنف",
      qty: Math.max(1, Number(item.quantity) || 1),
      price: Math.max(0, Number(item.price) || 0),
    })),
  };
};

/**
 * Fetches all invoices from the server and normalizes them for the UI.
 *
 * @returns {Promise<Array<Object>>}
 */
export const fetchNormalizedInvoices = async () => {
  const data = await getAllInvoices();
  if (Array.isArray(data)) {
    return data.map((doc, idx) => normalizeInvoice(doc, idx));
  }
  return [];
};

/**
 * Downloads the high-resolution invoice PDF generated directly by the server (Puppeteer)
 *
 * @param {string} id - MongoDB invoice _id
 * @param {string} [filename]
 * @returns {Promise<Blob>}
 */
export const downloadInvoicePDFFromServer = async (id, filename) => {
  if (!id) throw new Error("Invoice ID is required for server PDF download");
  const safeFilename = filename || `فاتورة_مبيعات_${id}.pdf`;
  const pdfUrl = `/api/v1/invoices/${id}/pdf`;

  const response = await fetch(pdfUrl);
  if (!response.ok) {
    throw new Error(`Server returned ${response.status}: Failed to generate PDF`);
  }

  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = safeFilename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();

  // Allow browser time to initialize download before cleaning up
  setTimeout(() => {
    if (document.body.contains(a)) {
      document.body.removeChild(a);
    }
    URL.revokeObjectURL(blobUrl);
  }, 4000);

  return blob;
};

/**
 * Fetches the raw PDF Blob from the server for WhatsApp sharing or local processing
 *
 * @param {string} id - MongoDB invoice _id
 * @returns {Promise<Blob>}
 */
export const fetchInvoicePDFBlob = async (id) => {
  if (!id) throw new Error("Invoice ID is required for server PDF");
  const response = await fetch(`/api/v1/invoices/${id}/pdf`);
  if (!response.ok) {
    throw new Error(`Server returned ${response.status}: Failed to generate PDF`);
  }
  return await response.blob();
};

