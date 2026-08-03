import { AddNotePanel } from "@/frontend/components/add-note-panel";
import { NoteRow } from "@/frontend/components/note-row";
import { T } from "@/frontend/components/t-text";
import { prisma } from "@/backend/lib/prisma";

export const dynamic = "force-dynamic";

export default async function NotesPage() {
  const [notes, customers] = await Promise.all([
    prisma.note.findMany({
      include: { customer: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.customer.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <AddNotePanel customers={customers} />

      <div className="space-y-3">
        {notes.length > 0 ? (
          notes.map((note) => <NoteRow key={note.id} note={note} />)
        ) : (
          <T as="p" className="py-10 text-center text-gray-400" hi="Koi note nahi hai." en="No notes yet." />
        )}
      </div>
    </div>
  );
}
