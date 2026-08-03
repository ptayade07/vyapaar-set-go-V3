"use server";

import { revalidatePath } from "next/cache";
import { optionalText } from "@/backend/lib/format";
import { prisma } from "@/backend/lib/prisma";

export async function createNote(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();

  if (!title) {
    throw new Error("Note title is required.");
  }

  const customerId = optionalText(formData.get("customerId"));
  const reminderDateValue = optionalText(formData.get("reminderDate"));

  await prisma.note.create({
    data: {
      title,
      text: optionalText(formData.get("text")),
      customerId,
      reminderDate: reminderDateValue ? new Date(`${reminderDateValue}T00:00:00+05:30`) : null,
    },
  });

  revalidatePath("/notes");
  revalidatePath("/");
}

export async function toggleNote(noteId: string) {
  const note = await prisma.note.findUniqueOrThrow({ where: { id: noteId }, select: { done: true } });
  await prisma.note.update({ where: { id: noteId }, data: { done: !note.done } });

  revalidatePath("/notes");
  revalidatePath("/");
}

export async function deleteNote(noteId: string) {
  await prisma.note.delete({ where: { id: noteId } });

  revalidatePath("/notes");
  revalidatePath("/");
}
