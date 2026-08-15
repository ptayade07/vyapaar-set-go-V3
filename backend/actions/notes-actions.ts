"use server";

import { revalidatePath } from "next/cache";
import { optionalText } from "@/backend/lib/format";
import { prisma } from "@/backend/lib/prisma";
import { getCurrentShopId } from "@/backend/lib/auth";

export async function createNote(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();

  if (!title) {
    throw new Error("Note title is required.");
  }
  const shopId = await getCurrentShopId();

  const customerId = optionalText(formData.get("customerId"));
  if (customerId) {
    // The customer picker is populated from this shop's own customers, but the id still arrives
    // as plain form data -- verify it actually belongs here before linking a note to it.
    await prisma.customer.findFirstOrThrow({ where: { id: customerId, shopId }, select: { id: true } });
  }
  const reminderDateValue = optionalText(formData.get("reminderDate"));

  await prisma.note.create({
    data: {
      shopId,
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
  const shopId = await getCurrentShopId();
  const note = await prisma.note.findFirstOrThrow({ where: { id: noteId, shopId }, select: { done: true } });
  await prisma.note.update({ where: { id: noteId }, data: { done: !note.done } });

  revalidatePath("/notes");
  revalidatePath("/");
}

export async function deleteNote(noteId: string) {
  const shopId = await getCurrentShopId();
  await prisma.note.delete({ where: { id: noteId, shopId } });

  revalidatePath("/notes");
  revalidatePath("/");
}
