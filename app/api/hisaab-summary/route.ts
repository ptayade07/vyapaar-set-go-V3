import { NextRequest, NextResponse } from "next/server";
import { buildTemplatedSummary, type HisaabSummaryData } from "@/lib/hisaab-summary";
import { generateHisaabSummaryWithLlm } from "@/lib/hisaab-summary-llm";
import { formatDateIst, getIstDayRange, getTodayInputValue } from "@/lib/format";
import { isLowStock } from "@/lib/inventory";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const OLD_UDHAAR_DAYS = 15;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export async function GET(request: NextRequest) {
  const dateParam = request.nextUrl.searchParams.get("date");
  const selectedDate = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : getTodayInputValue();
  const { start, end } = getIstDayRange(selectedDate);

  const [dayTransactions, debtors, inventoryItems] = await Promise.all([
    prisma.customerTransaction.findMany({
      where: { createdAt: { gte: start, lt: end } },
      select: { type: true, amountPaise: true },
    }),
    prisma.customer.findMany({
      where: { balancePaise: { gt: 0 } },
      select: {
        name: true,
        balancePaise: true,
        transactions: {
          where: { type: "UDHAAR" },
          orderBy: { createdAt: "asc" },
          take: 1,
          select: { createdAt: true },
        },
      },
    }),
    prisma.inventoryItem.findMany({ select: { name: true, quantity: true } }),
  ]);

  const udhaarTotalPaise = dayTransactions
    .filter((transaction) => transaction.type === "UDHAAR")
    .reduce((sum, transaction) => sum + transaction.amountPaise, 0);
  const paymentsTotalPaise = dayTransactions
    .filter((transaction) => transaction.type === "PAYMENT")
    .reduce((sum, transaction) => sum + transaction.amountPaise, 0);
  const advanceTotalPaise = dayTransactions
    .filter((transaction) => transaction.type === "ADVANCE")
    .reduce((sum, transaction) => sum + transaction.amountPaise, 0);
  const netPaise = paymentsTotalPaise + advanceTotalPaise - udhaarTotalPaise;

  const now = Date.now();
  const cutoff = now - OLD_UDHAAR_DAYS * MS_PER_DAY;
  const oldUdhaarCustomers = debtors
    .filter((customer) => {
      const oldestUdhaar = customer.transactions[0];
      return oldestUdhaar && oldestUdhaar.createdAt.getTime() < cutoff;
    })
    .map((customer) => ({
      name: customer.name,
      balancePaise: customer.balancePaise,
      daysOld: Math.floor((now - customer.transactions[0]!.createdAt.getTime()) / MS_PER_DAY),
    }))
    .sort((a, b) => b.daysOld - a.daysOld);

  const lowStockItems = inventoryItems
    .filter((item) => isLowStock(item.quantity))
    .map((item) => ({ name: item.name, quantity: item.quantity }));

  const data: HisaabSummaryData = {
    dateLabel: formatDateIst(start),
    udhaarTotalPaise,
    paymentsTotalPaise,
    advanceTotalPaise,
    netPaise,
    oldUdhaarCustomers,
    lowStockItems,
  };

  const aiSummary = await generateHisaabSummaryWithLlm(data);

  return NextResponse.json({
    summary: aiSummary ?? buildTemplatedSummary(data),
    source: aiSummary ? "ai" : "template",
  });
}
