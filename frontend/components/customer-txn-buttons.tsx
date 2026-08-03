"use client";

import { useState } from "react";
import { type CustomerTxnType, QuickTxnModal } from "@/frontend/components/quick-txn-modal";

type Props = {
  customerName: string;
  action: (formData: FormData) => Promise<void>;
  allowPhoto: boolean;
};

export function CustomerTxnButtons({ customerName, action, allowPhoto }: Props) {
  const [modalType, setModalType] = useState<CustomerTxnType | null>(null);

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => setModalType("UDHAAR")}
          className="flex h-24 flex-col items-center justify-center rounded-3xl bg-red-500 font-bold text-white shadow-lg transition hover:bg-red-600 active:scale-95"
        >
          <span className="text-2xl">Udhaar Diya</span>
          <span className="mt-1 text-xs opacity-80">+ balance</span>
        </button>
        <button
          type="button"
          onClick={() => setModalType("PAYMENT")}
          className="flex h-24 flex-col items-center justify-center rounded-3xl bg-green-600 font-bold text-white shadow-lg transition hover:bg-green-700 active:scale-95"
        >
          <span className="text-2xl">Payment Liya</span>
          <span className="mt-1 text-xs opacity-80">− balance</span>
        </button>
      </div>
      <div className="text-center">
        <button
          type="button"
          onClick={() => setModalType("ADVANCE")}
          className="text-sm font-semibold text-blue-700 underline underline-offset-4 hover:text-blue-900"
        >
          + Advance Liya (customer ne aage ka paisa diya)
        </button>
      </div>
      {modalType ? (
        <QuickTxnModal
          type={modalType}
          customerName={customerName}
          action={action}
          allowPhoto={allowPhoto}
          onClose={() => setModalType(null)}
        />
      ) : null}
    </>
  );
}
