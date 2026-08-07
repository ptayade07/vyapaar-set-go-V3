import { AddNotePanel } from "@/frontend/components/add-note-panel";
import { NoteRow } from "@/frontend/components/note-row";
import { Pagination } from "@/frontend/components/pagination";
import { T } from "@/frontend/components/t-text";
import { prisma } from "@/backend/lib/prisma";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

type Props = {
  searchParams?: Promise<{ page?: string }>;
};

export default async function NotesPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Math.max(1, Number(params?.page) || 1);

  const [notes, total, customers] = await Promise.all([
    prisma.note.findMany({
      include: { customer: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.note.count(),
    prisma.customer.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

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

      <Pagination page={page} totalPages={totalPages} buildHref={(p) => (p > 1 ? `/notes?page=${p}` : "/notes")} />
    </div>
  );
}
