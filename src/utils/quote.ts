import type { ApiSwapQuote, SwapQuote } from "../types";

const readAmount = (value: unknown): string | null => {
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return value.toString();
  }
  return null;
};

export const normalizeSwapQuote = (quote: ApiSwapQuote, fallbackAmountIn: string): SwapQuote => {
  const amountIn = readAmount(quote.amountIn) ?? fallbackAmountIn;
  const expectedOutput =
    readAmount(quote.expectedOutput) ??
    readAmount(quote.amountOut) ??
    readAmount((quote as { amountOutMin?: string | number }).amountOutMin) ??
    "";

  if (!expectedOutput) {
    throw new Error("SaucerSwap quote did not include an output amount.");
  }

  return {
    amountIn,
    expectedOutput,
    priceImpact: typeof quote.priceImpact === "number" ? quote.priceImpact : null,
    route: Array.isArray(quote.route) ? quote.route : [],
    raw: quote,
  };
};
