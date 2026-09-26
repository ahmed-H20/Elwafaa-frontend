// ─── Base API Client ─────────────────────────────────────────────────────────
// A lightweight fetch wrapper that mirrors Axios-style responses.
// All requests and responses are JSON by default.
// ─────────────────────────────────────────────────────────────────────────────

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api/v1";

/**
 * Core fetch wrapper.
 * @param {string} endpoint - e.g. "/invoices" or "/invoices/123"
 * @param {RequestInit} options  - standard fetch options (method, body, headers …)
 * @returns {Promise<any>} - parsed JSON response
 * @throws {Error} - with server message attached as `error.data`
 */
async function apiClient(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;

  // Destructure `headers` separately so that `...rest` never overwrites the
  // already-merged `config.headers` object.
  const { headers: customHeaders, ...rest } = options;

  const config = {
    headers: {
      "Content-Type": "application/json",
      ...customHeaders,
    },
    ...rest,
  };

  const response = await fetch(url, config);

  // Try to parse body as JSON regardless of status
  let data;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const error = new Error(data?.message || `HTTP error ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

// ─── Convenience methods ──────────────────────────────────────────────────────

export const api = {
  get: (endpoint, options = {}) =>
    apiClient(endpoint, { method: "GET", ...options }),

  post: (endpoint, body, options = {}) =>
    apiClient(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
      ...options,
    }),

  put: (endpoint, body, options = {}) =>
    apiClient(endpoint, {
      method: "PUT",
      body: JSON.stringify(body),
      ...options,
    }),

  delete: (endpoint, options = {}) =>
    apiClient(endpoint, { method: "DELETE", ...options }),
};

export default apiClient;
