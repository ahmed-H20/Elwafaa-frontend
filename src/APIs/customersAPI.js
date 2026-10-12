import { api } from "./apiClient";

const ENDPOINT = "/customers";

/**
 * Fetch all customers (with optional search query)
 * @param {string} [search]
 * @returns {Promise<Array<Object>>}
 */
export const getAllCustomers = (search = "") => {
  const query = search ? `?search=${encodeURIComponent(search)}` : "";
  return api.get(`${ENDPOINT}${query}`);
};

/**
 * Get single customer details with full invoice history
 * @param {string} id
 * @returns {Promise<Object>}
 */
export const getCustomerById = (id) => api.get(`${ENDPOINT}/${id}`);

/**
 * Create a new customer (phone is optional)
 * @param {{ name: string, phone?: string, address?: string, notes?: string }} customerData
 * @returns {Promise<Object>}
 */
export const createCustomer = (customerData) => api.post(ENDPOINT, customerData);

/**
 * Update existing customer
 * @param {string} id
 * @param {Object} updateData
 * @returns {Promise<Object>}
 */
export const updateCustomer = (id, updateData) =>
  api.put(`${ENDPOINT}/${id}`, updateData);

/**
 * Delete a customer by id
 * @param {string} id
 * @returns {Promise<Object>}
 */
export const deleteCustomer = (id) => api.delete(`${ENDPOINT}/${id}`);

/**
 * Fetch all invoices for a customer
 * @param {string} id
 * @returns {Promise<Array<Object>>}
 */
export const getCustomerInvoices = (id) =>
  api.get(`${ENDPOINT}/${id}/invoices`);
