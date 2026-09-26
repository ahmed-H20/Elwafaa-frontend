import React from "react";
import { useNavigate } from "react-router-dom";
import AdminDashboard from "../components/AdminDashboard";

export default function AdminPage({
  invoicesList,
  isLoading = false,
  onRefresh,
  onDeleteInvoice,
  apiStatus,
}) {
  const navigate = useNavigate();

  const handleViewInvoice = (inv) => {
    navigate(`/receipt?id=${inv.id || inv._id}`);
  };

  const handleCreateNewInvoice = () => {
    navigate("/receipt?new=true");
  };

  return (
    <AdminDashboard
      invoices={invoicesList}
      onViewInvoice={handleViewInvoice}
      onCreateNewInvoice={handleCreateNewInvoice}
      onRefresh={onRefresh}
      onDeleteInvoice={onDeleteInvoice}
      isLoading={isLoading}
      apiStatus={apiStatus}
    />
  );
}
