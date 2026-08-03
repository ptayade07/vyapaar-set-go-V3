"use client";

import { Plus } from "lucide-react";
import { useState, useTransition } from "react";
import { createNote } from "@/backend/actions/notes-actions";

type Props = {
  customers: { id: string; name: string }[];
};

export function AddNotePanel({ customers }: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await createNote(formData);
      setOpen(false);
    });
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notes & Reminders</h1>
          <p className="text-sm text-gray-500">Yaad rakhne ke liye</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="tap-target inline-flex items-center gap-2 rounded-2xl bg-orange-600 px-6 font-semibold text-white shadow-md transition hover:bg-orange-700 active:scale-95"
        >
          <Plus className="h-5 w-5" /> Naya Note
        </button>
      </div>
      {open ? (
        <form action={handleSubmit} className="tactile-card space-y-4 p-6">
          <input
            name="title"
            required
            placeholder="Title"
            className="h-14 w-full rounded-xl border border-gray-200 px-4 text-lg focus:outline-none focus:border-orange-500"
          />
          <textarea
            name="text"
            rows={3}
            placeholder="Details (optional)"
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-lg focus:outline-none focus:border-orange-500"
          />
          <select
            name="customerId"
            defaultValue=""
            className="h-14 w-full rounded-xl border border-gray-200 bg-white px-4 text-lg focus:outline-none focus:border-orange-500"
          >
            <option value="">Kisi customer se link karein? (optional)</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </select>
          <div>
            <label className="mb-1 block text-sm text-gray-600">Reminder date (optional)</label>
            <input
              name="reminderDate"
              type="date"
              className="h-14 w-full rounded-xl border border-gray-200 px-4 text-lg focus:outline-none focus:border-orange-500"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isPending}
              className="h-14 rounded-2xl bg-orange-600 px-8 font-semibold text-white transition hover:bg-orange-700 active:scale-95 disabled:opacity-50"
            >
              {isPending ? "Save ho raha hai..." : "Save"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={isPending}
              className="h-14 rounded-2xl bg-gray-100 px-6 font-semibold text-gray-700 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}
    </>
  );
}
