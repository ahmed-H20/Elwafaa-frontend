// ─── invoicesAPI.test.js ──────────────────────────────────────────────────────
// Unit tests for invoicesAPI.js
// All HTTP calls are intercepted by mocking the `api` object from apiClient.js
// so no real network calls are made.
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock the api helper BEFORE importing invoicesAPI ─────────────────────────
vi.mock("./apiClient", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

import { api } from "./apiClient";
import {
  createInvoice,
  getAllInvoices,
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
} from "./invoicesAPI";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const MOCK_INVOICE = {
  _id: "64f1a2b3c4d5e6f7a8b9c0d1",
  name: "Ahmed Hesham",
  tax: 14,
  total: 285,
  products: [
    { name: "صنف أول", qty: 2, price: 100 },
    { name: "صنف ثاني", qty: 1, price: 50 },
  ],
  createdAt: "2026-09-26T00:00:00.000Z",
  updatedAt: "2026-09-26T00:00:00.000Z",
};

const MOCK_INVOICES = [MOCK_INVOICE];

const MOCK_ID = MOCK_INVOICE._id;

// ─── Reset mocks between tests ────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── createInvoice ────────────────────────────────────────────────────────────

describe("createInvoice", () => {
  it("calls api.post with /invoices and the correct payload", async () => {
    api.post.mockResolvedValue({ message: "تم اضافه الفاتورة بنجاح" });

    const payload = {
      name: "Ahmed Hesham",
      products: [{ name: "صنف أول", qty: 2, price: 100 }],
      tax: 14,
    };

    const result = await createInvoice(payload);

    expect(api.post).toHaveBeenCalledOnce();
    expect(api.post).toHaveBeenCalledWith("/invoices", payload);
    expect(result.message).toBe("تم اضافه الفاتورة بنجاح");
  });

  it("propagates errors thrown by api.post", async () => {
    api.post.mockRejectedValue(new Error("فشل اضافه الفاتورة"));

    await expect(createInvoice({ name: "X", products: [] })).rejects.toThrow(
      "فشل اضافه الفاتورة"
    );
  });

  it("sends required fields: name and products", async () => {
    api.post.mockResolvedValue({ message: "تم اضافه الفاتورة بنجاح" });

    const payload = { name: "Client A", products: [{ name: "صنف", qty: 1, price: 10 }] };
    await createInvoice(payload);

    const [, sentBody] = api.post.mock.calls[0];
    expect(sentBody).toHaveProperty("name");
    expect(sentBody).toHaveProperty("products");
    expect(Array.isArray(sentBody.products)).toBe(true);
  });
});

// ─── getAllInvoices ───────────────────────────────────────────────────────────

describe("getAllInvoices", () => {
  it("calls api.get with /invoices", async () => {
    api.get.mockResolvedValue(MOCK_INVOICES);

    const result = await getAllInvoices();

    expect(api.get).toHaveBeenCalledOnce();
    expect(api.get).toHaveBeenCalledWith("/invoices");
    expect(result).toEqual(MOCK_INVOICES);
  });

  it("returns an array", async () => {
    api.get.mockResolvedValue(MOCK_INVOICES);
    const result = await getAllInvoices();
    expect(Array.isArray(result)).toBe(true);
  });

  it("returns an empty array when no invoices exist", async () => {
    api.get.mockResolvedValue([]);
    const result = await getAllInvoices();
    expect(result).toHaveLength(0);
  });

  it("propagates network errors", async () => {
    api.get.mockRejectedValue(new Error("Network Error"));
    await expect(getAllInvoices()).rejects.toThrow("Network Error");
  });
});

// ─── getInvoiceById ───────────────────────────────────────────────────────────

describe("getInvoiceById", () => {
  it("calls api.get with /invoices/:id", async () => {
    api.get.mockResolvedValue(MOCK_INVOICE);

    const result = await getInvoiceById(MOCK_ID);

    expect(api.get).toHaveBeenCalledWith(`/invoices/${MOCK_ID}`);
    expect(result).toEqual(MOCK_INVOICE);
  });

  it("throws when the invoice is not found (404)", async () => {
    const notFoundErr = new Error("Route not found");
    notFoundErr.status = 404;
    api.get.mockRejectedValue(notFoundErr);

    await expect(getInvoiceById("nonexistent-id")).rejects.toMatchObject({
      status: 404,
    });
  });
});

// ─── updateInvoice ────────────────────────────────────────────────────────────

describe("updateInvoice", () => {
  const updateData = {
    name: "Ahmed Updated",
    phone: "01012345678",
    address: "Cairo, Egypt",
    description: "Updated description",
    image: "https://example.com/img.png",
  };

  it("calls api.put with /invoices/:id and the update body", async () => {
    api.put.mockResolvedValue({ ...MOCK_INVOICE, ...updateData });

    const result = await updateInvoice(MOCK_ID, updateData);

    expect(api.put).toHaveBeenCalledOnce();
    expect(api.put).toHaveBeenCalledWith(`/invoices/${MOCK_ID}`, updateData);
    expect(result.name).toBe("Ahmed Updated");
  });

  it("includes all required fields in the request body", async () => {
    api.put.mockResolvedValue({});
    await updateInvoice(MOCK_ID, updateData);

    const [, , body] = api.put.mock.calls[0];
    // body is the second argument to api.put
    const [, sentBody] = api.put.mock.calls[0];
    expect(sentBody).toHaveProperty("name");
    expect(sentBody).toHaveProperty("phone");
    expect(sentBody).toHaveProperty("address");
    expect(sentBody).toHaveProperty("description");
    expect(sentBody).toHaveProperty("image");
  });

  it("propagates server validation errors", async () => {
    const validationErr = new Error("الرجاء ادخال رقم الهاتف ❌");
    validationErr.status = 400;
    api.put.mockRejectedValue(validationErr);

    await expect(updateInvoice(MOCK_ID, {})).rejects.toMatchObject({
      status: 400,
      message: "الرجاء ادخال رقم الهاتف ❌",
    });
  });
});

// ─── deleteInvoice ────────────────────────────────────────────────────────────

describe("deleteInvoice", () => {
  it("calls api.delete with /invoices/:id", async () => {
    api.delete.mockResolvedValue({ message: "تم حذف الفاتورة بنجاح" });

    const result = await deleteInvoice(MOCK_ID);

    expect(api.delete).toHaveBeenCalledOnce();
    expect(api.delete).toHaveBeenCalledWith(`/invoices/${MOCK_ID}`);
    expect(result.message).toBe("تم حذف الفاتورة بنجاح");
  });

  it("propagates errors (e.g. invalid id)", async () => {
    const err = new Error("رقم الفاتورة مطلوب ❌");
    err.status = 400;
    api.delete.mockRejectedValue(err);

    await expect(deleteInvoice("")).rejects.toMatchObject({
      status: 400,
    });
  });
});

// ─── Adapters & Normalizers ───────────────────────────────────────────────────

import {
  normalizeInvoice,
  formatInvoiceForServer,
  fetchNormalizedInvoices,
} from "./invoicesAPI";

describe("normalizeInvoice", () => {
  it("normalizes a MongoDB document to standard UI format", () => {
    const mongoDoc = {
      _id: "64f1a2b3c4d5e6f7a8b9c0d1",
      name: "Ahmed Hesham",
      tax: 14,
      total: 285,
      products: [
        { name: "صنف أول", qty: 2, price: 100 },
        { name: "صنف ثاني", qty: 1, price: 50 },
      ],
      createdAt: "2026-09-26T12:00:00.000Z",
    };

    const norm = normalizeInvoice(mongoDoc, 0);

    expect(norm.id).toBe("64f1a2b3c4d5e6f7a8b9c0d1");
    expect(norm.clientName).toBe("Ahmed Hesham");
    expect(norm.avatarLetters).toBe("AH");
    expect(norm.total).toBe(285);
    expect(norm.tax).toBe("14");
    expect(norm.date).toBe("2026/09/26");
    expect(norm.items).toHaveLength(2);
    expect(norm.items[0]).toEqual({
      id: expect.any(String),
      name: "صنف أول",
      quantity: 2,
      price: 100,
    });
  });

  it("handles empty or null documents gracefully", () => {
    expect(normalizeInvoice(null)).toBeNull();
  });
});

describe("formatInvoiceForServer", () => {
  it("converts frontend form data to the server's expected payload format", () => {
    const formData = {
      customerName: "Mohamed Ali",
      tax: "15",
      items: [
        { id: "1", name: "بند 1", quantity: 3, price: 40 },
        { id: "2", name: "بند 2", quantity: 1, price: 80 },
      ],
    };

    const payload = formatInvoiceForServer(formData);

    expect(payload).toEqual({
      name: "Mohamed Ali",
      tax: 15,
      products: [
        { name: "بند 1", qty: 3, price: 40 },
        { name: "بند 2", qty: 1, price: 80 },
      ],
    });
  });
});

describe("fetchNormalizedInvoices", () => {
  it("fetches and normalizes all invoices from the server", async () => {
    api.get.mockResolvedValue([
      {
        _id: "123",
        name: "Test Client",
        total: 500,
        tax: 0,
        products: [{ name: "Product A", qty: 5, price: 100 }],
        createdAt: "2026-09-26T00:00:00.000Z",
      },
    ]);

    const result = await fetchNormalizedInvoices();

    expect(result).toHaveLength(1);
    expect(result[0].clientName).toBe("Test Client");
    expect(result[0].items[0].quantity).toBe(5);
  });
});

