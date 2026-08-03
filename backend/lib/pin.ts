import { prisma } from "@/backend/lib/prisma";

const PIN_KEY = "pin";
const DEFAULT_PIN = "1234";

export async function getPin(): Promise<string> {
  const row = await prisma.appSetting.findUnique({ where: { key: PIN_KEY } });
  if (row) return row.value;

  await prisma.appSetting.create({ data: { key: PIN_KEY, value: DEFAULT_PIN } });
  return DEFAULT_PIN;
}

export async function verifyPin(candidate: string): Promise<boolean> {
  const pin = await getPin();
  return candidate === pin;
}
