"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteNote, toggleNote } from "@/app/notes-actions";
import { formatDateIst } from "@/lib/format";

type Props = {
  note: {
    id: string;
    title: string;
    text: string | null;
    done: boolean;
    reminderDate: Date | null;
    customer: { name: string } | null;
  };
};

export function NoteRow({ note }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const due = Boolean(note.reminderDate) && !note.done && note.reminderDate!.getTime() <= Date.now();

  function handleToggle() {
    startTransition(async () => {
      await toggleNote(note.id);
      router.refresh();
    });
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteNote(note.id);
      router.refresh();
    });
  }

  return (
    <div
      className={`tactile-card grid grid-cols-[auto_1fr_auto] items-start gap-3 p-4 ${due ? "border-orange-300" : ""} ${
        note.done ? "opacity-50" : ""
      }`}
    >
      <button
        type="button"
        onClick={handleToggle}
        disabled={isPending}
        aria-label={note.done ? "Mark not done" : "Mark done"}
        className={`tap-target flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 text-sm font-black ${
          note.done ? "border-green-600 bg-green-600 text-white" : "border-gray-300 bg-white"
        }`}
      >
        {note.done ? "✓" : ""}
      </button>
      <div className="min-w-0">
        <p className={`font-black text-gray-900 ${note.done ? "line-through" : ""}`}>{note.title}</p>
        {note.text ? <p className="text-sm text-gray-600">{note.text}</p> : null}
        <div className="mt-2 flex flex-wrap gap-2">
          {note.customer ? (
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700">
              👤 {note.customer.name}
            </span>
          ) : null}
          {note.reminderDate ? (
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                due ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-600"
              }`}
            >
              {formatDateIst(note.reminderDate)}
            </span>
          ) : null}
        </div>
      </div>
      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        aria-label="Delete note"
        className="tap-target rounded-xl px-3 text-sm font-black text-gray-400 hover:bg-red-50 hover:text-red-700"
      >
        Delete
      </button>
    </div>
  );
}
