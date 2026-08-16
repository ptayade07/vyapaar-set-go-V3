"use client";

import { useState, useTransition } from "react";
import { changePinAction } from "@/backend/actions/shop-settings-actions";
import { useT } from "@/frontend/lib/i18n";

export function ChangePinForm() {
  const t = useT();
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [message, setMessage] = useState<{ text: string; tone: "error" | "success" } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);

    if (!/^\d{4}$/.test(newPin)) {
      setMessage({ text: t("Naya PIN 4 digit ka hona chahiye.", "New PIN must be 4 digits."), tone: "error" });
      return;
    }
    if (newPin !== confirmPin) {
      setMessage({ text: t("PIN match nahi hua.", "PINs don't match."), tone: "error" });
      return;
    }

    startTransition(async () => {
      const ok = await changePinAction(currentPin, newPin);
      if (ok) {
        setMessage({ text: t("PIN badal gaya.", "PIN changed."), tone: "success" });
        setCurrentPin("");
        setNewPin("");
        setConfirmPin("");
      } else {
        setMessage({ text: t("Current PIN galat hai.", "Current PIN is incorrect."), tone: "error" });
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3">
      <label className="grid gap-1 text-sm font-semibold text-gray-700">
        {t("Current PIN", "Current PIN")}
        <input
          type="password"
          inputMode="numeric"
          maxLength={4}
          value={currentPin}
          onChange={(event) => setCurrentPin(event.target.value.replace(/\D/g, ""))}
          className="h-12 w-32 rounded-xl border border-gray-200 px-4 text-base focus:outline-none focus:border-orange-500"
        />
      </label>
      <label className="grid gap-1 text-sm font-semibold text-gray-700">
        {t("Naya PIN", "New PIN")}
        <input
          type="password"
          inputMode="numeric"
          maxLength={4}
          value={newPin}
          onChange={(event) => setNewPin(event.target.value.replace(/\D/g, ""))}
          className="h-12 w-32 rounded-xl border border-gray-200 px-4 text-base focus:outline-none focus:border-orange-500"
        />
      </label>
      <label className="grid gap-1 text-sm font-semibold text-gray-700">
        {t("Naya PIN confirm karo", "Confirm new PIN")}
        <input
          type="password"
          inputMode="numeric"
          maxLength={4}
          value={confirmPin}
          onChange={(event) => setConfirmPin(event.target.value.replace(/\D/g, ""))}
          className="h-12 w-32 rounded-xl border border-gray-200 px-4 text-base focus:outline-none focus:border-orange-500"
        />
      </label>

      {message ? (
        <p
          data-testid="change-pin-message"
          className={`text-sm font-semibold ${message.tone === "error" ? "text-red-600" : "text-green-700"}`}
        >
          {message.text}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="tap-target w-fit rounded-xl bg-orange-600 px-6 font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
      >
        {isPending ? t("Save ho raha hai...", "Saving...") : t("PIN badlo", "Change PIN")}
      </button>
    </form>
  );
}
