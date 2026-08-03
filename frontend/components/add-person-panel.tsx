"use client";

import { Plus } from "lucide-react";
import { useState, useTransition } from "react";
import { useT } from "@/frontend/lib/i18n";

type Props = {
  titleHi: string;
  titleEn: string;
  subtitleHi: string;
  subtitleEn: string;
  triggerLabelHi: string;
  triggerLabelEn: string;
  action: (formData: FormData) => Promise<void> | void;
};

export function AddPersonPanel({
  titleHi,
  titleEn,
  subtitleHi,
  subtitleEn,
  triggerLabelHi,
  triggerLabelEn,
  action,
}: Props) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await action(formData);
      setOpen(false);
    });
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t(titleHi, titleEn)}</h1>
          <p className="text-sm text-gray-500">{t(subtitleHi, subtitleEn)}</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="tap-target inline-flex items-center gap-2 rounded-2xl bg-orange-600 px-6 font-semibold text-white shadow-md transition hover:bg-orange-700 active:scale-95"
        >
          <Plus className="h-5 w-5" /> {t(triggerLabelHi, triggerLabelEn)}
        </button>
      </div>
      {open ? (
        <form action={handleSubmit} className="tactile-card space-y-4 p-6">
          <input
            name="name"
            required
            placeholder={t("Naam (required)", "Name (required)")}
            className="h-14 w-full rounded-xl border border-gray-200 px-4 text-lg focus:outline-none focus:border-orange-500"
          />
          <input
            name="phone"
            inputMode="tel"
            placeholder={t("Phone (optional)", "Phone (optional)")}
            className="h-14 w-full rounded-xl border border-gray-200 px-4 text-lg focus:outline-none focus:border-orange-500"
          />
          <input
            name="note"
            placeholder={t("Note (optional)", "Note (optional)")}
            className="h-14 w-full rounded-xl border border-gray-200 px-4 text-lg focus:outline-none focus:border-orange-500"
          />
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isPending}
              className="h-14 rounded-2xl bg-orange-600 px-8 font-semibold text-white transition hover:bg-orange-700 active:scale-95 disabled:opacity-50"
            >
              {isPending ? t("Save ho raha hai...", "Saving...") : t("Save karo", "Save")}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={isPending}
              className="h-14 rounded-2xl bg-gray-100 px-6 font-semibold text-gray-700 disabled:opacity-50"
            >
              {t("Cancel", "Cancel")}
            </button>
          </div>
        </form>
      ) : null}
    </>
  );
}
