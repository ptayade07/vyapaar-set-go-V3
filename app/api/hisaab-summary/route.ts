import { NextRequest, NextResponse } from "next/server";
import { buildTemplatedSummary, type HisaabSummaryData } from "@/backend/lib/hisaab-summary";
import { generateHisaabSummaryWithLlm } from "@/backend/lib/hisaab-summary-llm";
import { computeOldestOpenUdhaarDate, daysBetweenNow } from "@/backend/lib/aging";
import { formatDateIst, getIstDayRange, getTodayInputValue } from "@/backend/lib/format";
import { isLowStock } from "@/backend/lib/inventory";
import { prisma } from "@/backend/lib/prisma";
import { getCurrentShopId } from "@/backend/lib/shop-context";

export const dynamic = "force-dynamic";

const OLD_UDHAAR_DAYS = 15;

export async function GET(request: NextRequest) {
  const dateParam = request.nextUrl.searchParams.get("date");
  const selectedDate = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : getTodayInputValue();
  const { start, end } = getIstDayRange(selectedDate);
  const shopId = await getCurrentShopId();

  const [dayTransactions, debtors, inventoryItems] = await Promise.all([
    prisma.customerTransaction.findMany({
      where: { shopId, createdAt: { gte: start, lt: end } },
      select: { type: true, amountPaise: true },
    }),
    prisma.customer.findMany({
      where: { shopId, balancePaise: { gt: 0 } },
      select: {
        name: true,
        balancePaise: true,
        transactions: {
          orderBy: { createdAt: "asc" },
          select: { type: true, amountPaise: true, createdAt: true },
        },
      },
    }),
    prisma.inventoryItem.findMany({ where: { shopId }, select: { name: true, quantity: true } }),
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

  const oldUdhaarCustomers = debtors
    .map((customer) => {
      const oldest = computeOldestOpenUdhaarDate(customer.transactions);
      return oldest
        ? { name: customer.name, balancePaise: customer.balancePaise, daysOld: daysBetweenNow(oldest) }
        : null;
    })
    .filter((customer): customer is { name: string; balancePaise: number; daysOld: number } => customer !== null)
    .filter((customer) => customer.daysOld > OLD_UDHAAR_DAYS)
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
