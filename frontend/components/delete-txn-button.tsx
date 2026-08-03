"use client";

import { Trash2 } from "lucide-react";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteCustomerTransaction } from "@/backend/actions/actions";

type Props = {
  customerId: string;
  transactionId: string;
};

export function DeleteTxnButton({ customerId, transactionId }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!window.confirm("Delete this transaction?")) return;
    startTransition(async () => {
      await deleteCustomerTransaction(customerId, transactionId);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isPending}
      aria-label="Delete transaction"
      className="text-gray-300 hover:text-red-500 disabled:opacity-40"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
