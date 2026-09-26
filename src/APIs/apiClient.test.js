// ─── apiClient.test.js ────────────────────────────────────────────────────────
// Unit tests for the base fetch wrapper (apiClient.js)
// Uses Vitest (Jest-compatible) with global fetch mocked via vi.stubGlobal
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import apiClient, { api } from "./apiClient";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Creates a minimal Response-like mock.
 * @param {any}     body   - object that .json() will resolve to
 * @param {number}  status - HTTP status code
 */
function mockResponse(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(body),
  };
}

// ─── Setup ────────────────────────────────────────────────────────────────────

let fetchMock;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// ─── apiClient (core) ─────────────────────────────────────────────────────────

describe("apiClient (core fetch wrapper)", () => {
  it("calls fetch with the correct URL and JSON headers", async () => {
    fetchMock.mockResolvedValue(mockResponse({ ok: true }));

    await apiClient("/invoices");

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, config] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/invoices$/);
    expect(config.headers["Content-Type"]).toBe("application/json");
  });

  it("returns parsed JSON on a 200 response", async () => {
    const payload = [{ name: "Test" }];
    fetchMock.mockResolvedValue(mockResponse(payload));

    const result = await apiClient("/invoices");

    expect(result).toEqual(payload);
  });

  it("throws an Error with status + data on a non-ok response", async () => {
    const errorBody = { message: "فشل الحصول علي الفواتير" };
    fetchMock.mockResolvedValue(mockResponse(errorBody, 500));

    await expect(apiClient("/invoices")).rejects.toMatchObject({
      message: "فشل الحصول علي الفواتير",
      status: 500,
      data: errorBody,
    });
  });

  it("throws a generic message when server returns no body", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 404,
      json: vi.fn().mockRejectedValue(new SyntaxError("no body")),
    });

    await expect(apiClient("/invoices/bad-id")).rejects.toMatchObject({
      message: "HTTP error 404",
      status: 404,
    });
  });

  it("merges custom headers with defaults", async () => {
    fetchMock.mockResolvedValue(mockResponse({}));

    await apiClient("/invoices", { headers: { Authorization: "Bearer token123" } });

    const [, config] = fetchMock.mock.calls[0];
    expect(config.headers["Content-Type"]).toBe("application/json");
    expect(config.headers["Authorization"]).toBe("Bearer token123");
  });
});

// ─── api.get ──────────────────────────────────────────────────────────────────

describe("api.get", () => {
  it("issues a GET request", async () => {
    fetchMock.mockResolvedValue(mockResponse([]));
    await api.get("/invoices");

    const [, config] = fetchMock.mock.calls[0];
    expect(config.method).toBe("GET");
  });
});

// ─── api.post ─────────────────────────────────────────────────────────────────

describe("api.post", () => {
  it("issues a POST with JSON-serialised body", async () => {
    fetchMock.mockResolvedValue(mockResponse({ message: "تم اضافه الفاتورة بنجاح" }, 201));

    const body = { name: "Ahmed", products: [{ name: "صنف", qty: 2, price: 50 }] };
    await api.post("/invoices", body);

    const [, config] = fetchMock.mock.calls[0];
    expect(config.method).toBe("POST");
    expect(JSON.parse(config.body)).toEqual(body);
  });
});

// ─── api.put ──────────────────────────────────────────────────────────────────

describe("api.put", () => {
  it("issues a PUT with JSON-serialised body", async () => {
    const updated = { name: "Ahmed", phone: "010", address: "Cairo", description: "test", image: "img.png" };
    fetchMock.mockResolvedValue(mockResponse(updated));

    await api.put("/invoices/abc123", updated);

    const [url, config] = fetchMock.mock.calls[0];
    expect(config.method).toBe("PUT");
    expect(url).toMatch(/\/invoices\/abc123$/);
    expect(JSON.parse(config.body)).toEqual(updated);
  });
});

// ─── api.delete ───────────────────────────────────────────────────────────────

describe("api.delete", () => {
  it("issues a DELETE request to the correct URL", async () => {
    fetchMock.mockResolvedValue(mockResponse({ message: "تم حذف الفاتورة بنجاح" }));

    await api.delete("/invoices/abc123");

    const [url, config] = fetchMock.mock.calls[0];
    expect(config.method).toBe("DELETE");
    expect(url).toMatch(/\/invoices\/abc123$/);
  });
});
