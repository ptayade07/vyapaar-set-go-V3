import type { CustomerTransactionType, SupplierTransactionType } from "@prisma/client";

const customerLabels: Record<CustomerTransactionType, { label: string; subtitle: string }> = {
  UDHAAR: { label: "Udhaar Diya", subtitle: "Goods on credit" },
  PAYMENT: { label: "Payment Liya", subtitle: "Cash received" },
  ADVANCE: { label: "Advance Liya", subtitle: "Paid ahead" },
};

const supplierLabels: Record<SupplierTransactionType, { label: string; subtitle: string }> = {
  CREDIT: { label: "Maal Liya", subtitle: "Bought on credit" },
  PAYMENT: { label: "Payment Diya", subtitle: "Paid supplier" },
};

export function getCustomerTransactionLabel(type: CustomerTransactionType) {
  return customerLabels[type];
}

export function getSupplierTransactionLabel(type: SupplierTransactionType) {
  return supplierLabels[type];
}
