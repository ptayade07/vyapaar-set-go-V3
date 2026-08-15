import { renderToBuffer } from "@react-pdf/renderer";
import { NextRequest, NextResponse } from "next/server";
import { getCustomerBalanceDisplay } from "@/backend/lib/balance";
import { formatDateTimeIst, formatMoneyPaise } from "@/backend/lib/format";
import { prisma } from "@/backend/lib/prisma";
import { getCurrentShopId } from "@/backend/lib/shop-context";
import { CustomerStatementDocument } from "@/backend/lib/statement-pdf";

export const dynamic = "force-dynamic";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const shopId = await getCurrentShopId();
  // findFirst + shopId in the where clause, not findUnique-by-id-then-check: shop A hitting this
  // URL with shop B's customer id gets a clean 404, never shop B's statement.
  const customer = await prisma.customer.findFirst({
    where: { id, shopId },
    include: { transactions: { orderBy: { createdAt: "asc" } } },
  });

  if (!customer) {
    // notFound() from next/navigation only works inside page renders, not Route Handlers -- it
    // would otherwise throw and surface as an uncaught 500 here instead of a clean 404.
    return new NextResponse("Customer not found.", { status: 404 });
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
