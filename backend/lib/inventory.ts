export const LOW_STOCK_THRESHOLD = 5;

export function isLowStock(quantity: number): boolean {
  return quantity <= LOW_STOCK_THRESHOLD;
}
