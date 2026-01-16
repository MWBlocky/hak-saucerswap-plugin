import { describe, expect, it } from "vitest";
import { applySlippageToAmount, calculatePriceImpact } from "../src/utils/amm";
import { formatUnits, parseUnits } from "../src/utils/units";

describe("units", () => {
  it("parses decimal amounts to smallest units", () => {
    expect(parseUnits("1.23", 2)).toBe("123");
    expect(parseUnits("0.0001", 6)).toBe("100");
  });

  it("formats smallest units to decimals", () => {
    expect(formatUnits("12345", 2)).toBe("123.45");
    expect(formatUnits("100", 6)).toBe("0.0001");
  });
});

describe("amm", () => {
  it("applies slippage tolerance", () => {
    expect(applySlippageToAmount("10000", 0.5)).toBe("9950");
  });

  it("calculates price impact", () => {
    const impact = calculatePriceImpact("100", "95", "10000", "9500");
    expect(impact).toBeTypeOf("number");
  });
});
