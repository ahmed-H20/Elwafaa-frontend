export const initialAdminInvoices = [
  {
    id: "inv-001",
    clientName: "Nile Pharma",
    invoiceNumber: "INV-001",
    avatarLetters: "NP",
    avatarClass: "avatar-np",
    total: 2422,
    tax: "0.00",
    date: "2026/09/20",
    items: [
      { id: "np-1", name: "الصنف الاول", quantity: 10, price: 120.0 },
      { id: "np-2", name: "الصنف الثاني", quantity: 8, price: 152.75 },
    ],
  },
  {
    id: "inv-002",
    clientName: "PureCare",
    invoiceNumber: "INV-002",
    avatarLetters: "PC",
    avatarClass: "avatar-pc",
    total: 1823,
    tax: "0.00",
    date: "2026/09/22",
    items: [
      { id: "pc-1", name: "الصنف الاول", quantity: 5, price: 200.0 },
      { id: "pc-2", name: "الصنف الثاني", quantity: 4, price: 205.75 },
    ],
  },
  {
    id: "inv-004",
    clientName: "BioVital Labs",
    invoiceNumber: "INV-004",
    avatarLetters: "BV",
    avatarClass: "avatar-bv",
    total: 5254,
    tax: "0.00",
    date: "2026/09/25",
    items: [
      { id: "bv-1", name: "الصنف الاول", quantity: 15, price: 250.0 },
      { id: "bv-2", name: "الصنف الثاني", quantity: 6, price: 250.66 },
    ],
  },
];

export const initialSampleItems = [
  { id: "item-1", name: "الصنف الاول", quantity: 2, price: 10.0 },
  { id: "item-2", name: "الصنف الثاني", quantity: 4, price: 10.0 },
  { id: "item-3", name: "الصنف الثالث", quantity: 6, price: 10.0 },
  { id: "item-4", name: "الصنف الرابع", quantity: 8, price: 10.0 },
];
