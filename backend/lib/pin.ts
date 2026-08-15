import { prisma } from "@/backend/lib/prisma";

const PIN_KEY = "pin";
const DEFAULT_PIN = "1234";

export async function getPin(shopId: string): Promise<string> {
  const row = await prisma.appSetting.findUnique({ where: { shopId_key: { shopId, key: PIN_KEY } } });
  if (row) return row.value;

  await prisma.appSetting.create({ data: { shopId, key: PIN_KEY, value: DEFAULT_PIN } });
  return DEFAULT_PIN;
}

export async function verifyPin(shopId: string, candidate: string): Promise<boolean> {
  const pin = await getPin(shopId);
  return candidate === pin;
}
