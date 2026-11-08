/**
 * A price renders only when it is confirmed. A hypothesis stays in the data for internal reference
 * and never reaches the page (docs/plan/work-breakdown.md section 3).
 */
export interface PricedOffer {
  readonly price: number | null;
  readonly priceStatus: "hypothesis" | "confirmed";
}

export function visiblePrice(offer: PricedOffer): number | null {
  return offer.priceStatus === "confirmed" ? offer.price : null;
}
