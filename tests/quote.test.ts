import { describe, expect, it } from "vitest";
import { quoteTool } from "../src/tools/quote";

const fakeClient = {
  resolveTokenId: async (input: string) => input,
  getSwapQuote: async () => ({ amountIn: "100", amountOut: "95" }),
  getPoolByTokens: async () => ({
    tokenA: { id: "0.0.1" },
    tokenB: { id: "0.0.2" },
    tokenReserveA: "10000",
    tokenReserveB: "9500",
  }),
};

describe("quote tool", () => {
  it("returns a normalized quote", async () => {
    const result = await quoteTool.execute(
      {} as never,
      { saucerswapClient: fakeClient } as never,
      {
        fromToken: "0.0.1",
        toToken: "0.0.2",
        amount: "100",
      } as never,
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.quote.expectedOutput).toBe("95");
      expect(result.quote.amountIn).toBe("100");
    }
  });
});
