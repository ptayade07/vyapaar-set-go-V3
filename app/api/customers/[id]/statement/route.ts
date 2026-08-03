import { renderToBuffer } from "@react-pdf/renderer";
import { NextRequest, NextResponse } from "next/server";
import { notFound } from "next/navigation";
import { getCustomerBalanceDisplay } from "@/backend/lib/balance";
import { formatDateTimeIst, formatMoneyPaise } from "@/backend/lib/format";
import { prisma } from "@/backend/lib/prisma";
import { CustomerStatementDocument } from "@/backend/lib/statement-pdf";

export const dynamic = "force-dynamic";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: { transactions: { orderBy: { createdAt: "asc" } } },
  });

  if (!customer) {
    notFound();
  }

  const display = getCustomerBalanceDisplay(customer.balancePaise);
  const buffer = await renderToBuffer(
    CustomerStatementDocument({
      shopName: "Vyapaar Set Go",
      customerName: customer.name,
      customerPhone: customer.phone,
      balanceLabel: display.label,
      balanceTone: display.tone,
      balanceText: formatMoneyPaise(display.amountPaise),
      generatedAt: formatDateTimeIst(new Date()),
      rows: customer.transactions.map((transaction) => ({
        date: formatDateTimeIst(transaction.createdAt),
        description: transaction.description || transaction.type,
        type: transaction.type,
        amountText: formatMoneyPaise(transaction.amountPaise),
        balanceText: formatMoneyPaise(Math.abs(transaction.balanceAfterPaise)),
      })),
    }),
  );

  const safeName = customer.name.replace(/[^a-zA-Z0-9]+/g, "_");

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="statement_${safeName}.pdf"`,
    },
  });
}
