import { createNote } from "@/backend/actions/notes-actions";
import { NoteRow } from "@/frontend/components/note-row";
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
    <div className="grid gap-5">
      <section>
        <p className="text-sm font-black uppercase tracking-wide text-orange-700">Yaad rakho</p>
        <h1 className="text-3xl font-black text-gray-900">Notes</h1>
      </section>

      <section id="add-note" className="tactile-card p-4">
        <h2 className="text-xl font-black text-gray-900">Add Note</h2>
        <p className="mb-4 text-sm font-semibold text-gray-500">Reminder ya khayaal likho</p>
        <form action={createNote} className="grid gap-3">
          <label className="grid gap-2 text-sm font-bold text-gray-700">
            Title
            <input
              name="title"
              required
              className="tap-target rounded-xl border border-gray-300 px-3 text-base focus:outline-none focus:ring-2 focus:ring-orange-600"
            />
          </label>
          <label className="grid gap-2 text-sm font-bold text-gray-700">
            Details
            <textarea
              name="text"
              rows={2}
              className="rounded-xl border border-gray-300 px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-orange-600"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-bold text-gray-700">
              Link to customer (optional)
              <select
                name="customerId"
                defaultValue=""
                className="tap-target rounded-xl border border-gray-300 bg-white px-3 text-base focus:outline-none focus:ring-2 focus:ring-orange-600"
              >
                <option value="">No customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-bold text-gray-700">
              Reminder date (optional)
              <input
                name="reminderDate"
                type="date"
                className="tap-target rounded-xl border border-gray-300 px-3 text-base font-bold focus:outline-none focus:ring-2 focus:ring-orange-600"
              />
            </label>
          </div>
          <button className="tap-target rounded-xl bg-orange-600 px-5 py-3 text-lg font-black text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-700">
            + New Note
          </button>
        </form>
      </section>

      <section className="grid gap-3">
        {notes.length > 0 ? (
          notes.map((note) => <NoteRow key={note.id} note={note} />)
        ) : (
          <p className="rounded-xl bg-gray-100 p-4 text-sm font-bold text-gray-600">No notes yet.</p>
        )}
      </section>
    </div>
  );
}
