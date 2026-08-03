import type { CustomerTransactionType, SupplierTransactionType } from "@prisma/client";

const customerLabels: Record<
  CustomerTransactionType,
  { label: string; subtitle: string; sign: "+" | "-"; amountColor: string; badgeClass: string }
> = {
  UDHAAR: { label: "Udhaar Diya", subtitle: "Goods on credit", sign: "+", amountColor: "text-red-600", badgeClass: "bg-red-50 text-red-700" },
  PAYMENT: { label: "Payment Liya", subtitle: "Cash received", sign: "-", amountColor: "text-green-700", badgeClass: "bg-green-50 text-green-700" },
  ADVANCE: { label: "Advance Liya", subtitle: "Paid ahead", sign: "-", amountColor: "text-green-700", badgeClass: "bg-blue-50 text-blue-700" },
};

const supplierLabels: Record<
  SupplierTransactionType,
  { label: string; subtitle: string; sign: "+" | "-"; amountColor: string; badgeClass: string }
> = {
  CREDIT: { label: "Maal Liya", subtitle: "Bought on credit", sign: "+", amountColor: "text-red-600", badgeClass: "bg-red-50 text-red-700" },
  PAYMENT: { label: "Payment Diya", subtitle: "Paid supplier", sign: "-", amountColor: "text-green-700", badgeClass: "bg-green-50 text-green-700" },
};

export function getCustomerTransactionLabel(type: CustomerTransactionType) {
  return customerLabels[type];
}

export function getSupplierTransactionLabel(type: SupplierTransactionType) {
  return supplierLabels[type];
}
