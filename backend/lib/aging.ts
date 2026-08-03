export type AgingTransaction = {
  type: "UDHAAR" | "PAYMENT" | "ADVANCE";
  amountPaise: number;
  createdAt: Date;
};

/**
 * FIFO walk of a customer's transactions, oldest first: a UDHAAR first offsets any standing
 * advance credit, then any leftover pushes onto a queue; PAYMENT/ADVANCE consume from the front
 * of that queue (oldest udhaar first). Returns the createdAt of whatever udhaar is still open at
 * the front, or null once fully settled — this is "how old is the oldest unpaid rupee," not just
 * the date of the first-ever UDHAAR row.
 */
export function computeOldestOpenUdhaarDate(transactions: AgingTransaction[]): Date | null {
  const sorted = [...transactions].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  const queue: { date: Date; remainingPaise: number }[] = [];
  let advancePaise = 0;

  for (const transaction of sorted) {
    let amountPaise = transaction.amountPaise;

    if (transaction.type === "UDHAAR") {
      if (advancePaise > 0) {
        const take = Math.min(advancePaise, amountPaise);
        advancePaise -= take;
        amountPaise -= take;
      }
      if (amountPaise > 0) {
        queue.push({ date: transaction.createdAt, remainingPaise: amountPaise });
      }
    } else {
      let remaining = amountPaise;
      while (remaining > 0 && queue.length > 0) {
        const front = queue[0];
        if (front.remainingPaise <= remaining) {
          remaining -= front.remainingPaise;
          queue.shift();
        } else {
          front.remainingPaise -= remaining;
          remaining = 0;
        }
      }
      advancePaise += remaining;
    }
  }

  return queue.length > 0 ? queue[0].date : null;
}

export function daysBetweenNow(date: Date): number {
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  const now = new Date();
  const startOfNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.floor((startOfNow.getTime() - startOfDate.getTime()) / MS_PER_DAY);
}
