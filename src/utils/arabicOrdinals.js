export const arabicOrdinals = [
  "الصنف الاول",
  "الصنف الثاني",
  "الصنف الثالث",
  "الصنف الرابع",
  "الصنف الخامس",
  "الصنف السادس",
  "الصنف السابع",
  "الصنف الثامن",
  "الصنف التاسع",
  "الصنف العاشر",
  "الصنف الحادي عشر",
  "الصنف الثاني عشر",
  "الصنف الثالث عشر",
  "الصنف الرابع عشر",
  "الصنف الخامس عشر",
  "الصنف السادس عشر",
  "الصنف السابع عشر",
  "الصنف الثامن عشر",
  "الصنف التاسع عشر",
  "الصنف العشرون"
];

/**
 * Returns automated Arabic item name by index
 * 0 -> "الصنف الاول"
 * 1 -> "الصنف الثاني"
 * ...
 */
export function getItemNameByIndex(index) {
  if (index >= 0 && index < arabicOrdinals.length) {
    return arabicOrdinals[index];
  }
  return `الصنف ${index + 1}`;
}

/**
 * Formats a number to 2 decimal places (e.g. 20.00)
 */
export function formatCurrency(amount) {
  const num = parseFloat(amount);
  if (isNaN(num)) return "0.00";
  return num.toFixed(2);
}

/**
 * Get current date formatted as YYYY/MM/DD
 */
export function getCurrentDateFormatted() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}/${month}/${day}`;
}
