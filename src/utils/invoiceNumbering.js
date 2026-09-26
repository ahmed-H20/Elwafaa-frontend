/**
 * Helper utilities for generating and ensuring unique, sequential invoice numbers.
 */

export function extractInvoiceNumber(invoiceNumberStr) {
  if (!invoiceNumberStr) return null;
  const match = String(invoiceNumberStr).match(/\d+/);
  return match ? parseInt(match[0], 10) : null;
}

export function formatInvoiceNumber(num) {
  const n = parseInt(num, 10);
  if (isNaN(n) || n < 1) return "INV-001";
  return `INV-${String(n).padStart(3, "0")}`;
}

export function getNextInvoiceNumber(invoicesList = []) {
  if (!Array.isArray(invoicesList) || invoicesList.length === 0) {
    return "1";
  }

  let maxNum = 0;
  for (const inv of invoicesList) {
    if (!inv) continue;
    const num =
      extractInvoiceNumber(inv.invoiceNumber) ??
      (typeof inv.id === "number" ? inv.id : null);
    if (num && num > maxNum) {
      maxNum = num;
    }
  }

  return String(maxNum + 1);
}

/**
 * Checks if a list of invoices contains duplicate invoice numbers,
 * and if so, heals them chronologically so each invoice has its own unique ID.
 */
export function healDuplicateInvoices(invoicesList = []) {
  if (!Array.isArray(invoicesList) || invoicesList.length === 0) {
    return invoicesList;
  }

  const seen = new Set();
  let hasDuplicates = false;

  for (const inv of invoicesList) {
    const num = (inv.invoiceNumber || "").trim().toUpperCase();
    if (num && seen.has(num)) {
      hasDuplicates = true;
      break;
    }
    if (num) seen.add(num);
  }

  if (!hasDuplicates) {
    return invoicesList;
  }

  // Renumber chronologically: the earliest invoices (at the end of a desc-sorted list) get INV-001, etc.
  const reversed = [...invoicesList].reverse();
  const healed = reversed.map((inv, idx) => {
    const seq = idx + 1;
    return {
      ...inv,
      invoiceNumber: formatInvoiceNumber(seq),
    };
  }).reverse();

  return healed;
}
