"use client";

import { Bell, Check, Trash2 } from "lucide-react";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteNote, toggleNote } from "@/backend/actions/notes-actions";
import { formatDateIst } from "@/backend/lib/format";

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
    if (!window.confirm("Delete this note?")) return;
    startTransition(async () => {
      await deleteNote(note.id);
      router.refresh();
    });
  }

  return (
    <div
      className={`tactile-card flex items-start gap-3 p-5 ${due ? "border-orange-300" : ""} ${
        note.done ? "opacity-50" : ""
      }`}
    >
      <button
        type="button"
        onClick={handleToggle}
        disabled={isPending}
        aria-label={note.done ? "Mark not done" : "Mark done"}
        className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 ${
          note.done ? "border-green-600 bg-green-600 text-white" : "border-gray-300 hover:border-orange-400"
        }`}
      >
        {note.done ? <Check className="h-4 w-4" /> : null}
      </button>
      <div className="min-w-0 flex-1">
        <p className={`text-lg font-bold ${note.done ? "text-gray-500 line-through" : "text-gray-900"}`}>{note.title}</p>
        {note.text ? <p className="mt-1 text-sm text-gray-600">{note.text}</p> : null}
        <div className="mt-2 flex flex-wrap gap-2">
          {note.customer ? (
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
              👤 {note.customer.name}
            </span>
          ) : null}
          {note.reminderDate ? (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                due ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-600"
              }`}
            >
              <Bell className="h-3 w-3" /> {formatDateIst(note.reminderDate)}
            </span>
          ) : null}
        </div>
      </div>
      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        aria-label="Delete note"
        className="text-gray-300 hover:text-red-500"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
