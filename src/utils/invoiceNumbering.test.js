import { describe, it, expect } from "vitest";
import {
  extractInvoiceNumber,
  formatInvoiceNumber,
  getNextInvoiceNumber,
  healDuplicateInvoices,
} from "./invoiceNumbering";

describe("invoiceNumbering utilities", () => {
  it("extracts numeric part from invoice number strings", () => {
    expect(extractInvoiceNumber("INV-001")).toBe(1);
    expect(extractInvoiceNumber("INV-042")).toBe(42);
    expect(extractInvoiceNumber("105")).toBe(105);
    expect(extractInvoiceNumber("INV-")).toBe(null);
  });

  it("formats numbers into INV-XXX", () => {
    expect(formatInvoiceNumber(1)).toBe("INV-001");
    expect(formatInvoiceNumber("5")).toBe("INV-005");
    expect(formatInvoiceNumber(99)).toBe("INV-099");
    expect(formatInvoiceNumber(120)).toBe("INV-120");
  });

  it("calculates next invoice number based on max existing number", () => {
    const list = [
      { invoiceNumber: "INV-001" },
      { invoiceNumber: "INV-002" },
      { invoiceNumber: "INV-005" },
    ];
    expect(getNextInvoiceNumber(list)).toBe("6");
  });

  it("heals duplicate invoice numbers chronologically", () => {
    const duplicates = [
      { id: "5", clientName: "Client E", invoiceNumber: "INV-001" },
      { id: "4", clientName: "Client D", invoiceNumber: "INV-001" },
      { id: "3", clientName: "Client C", invoiceNumber: "INV-001" },
      { id: "2", clientName: "Client B", invoiceNumber: "INV-001" },
      { id: "1", clientName: "Client A", invoiceNumber: "INV-001" },
    ];

    const healed = healDuplicateInvoices(duplicates);
    expect(healed[4].invoiceNumber).toBe("INV-001"); // oldest
    expect(healed[3].invoiceNumber).toBe("INV-002");
    expect(healed[2].invoiceNumber).toBe("INV-003");
    expect(healed[1].invoiceNumber).toBe("INV-004");
    expect(healed[0].invoiceNumber).toBe("INV-005"); // newest
  });
});
