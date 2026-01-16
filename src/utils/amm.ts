export const calculatePriceImpact = (
  inputAmount: string,
  outputAmount: string,
  poolReserveIn: string,
  poolReserveOut: string,
): number | null => {
  const inAmount = Number(inputAmount);
  const outAmount = Number(outputAmount);
  const reserveIn = Number(poolReserveIn);
  const reserveOut = Number(poolReserveOut);
  if (
    !Number.isFinite(inAmount) ||
    !Number.isFinite(outAmount) ||
    !Number.isFinite(reserveIn) ||
    !Number.isFinite(reserveOut) ||
    inAmount <= 0 ||
    outAmount <= 0 ||
    reserveIn <= 0 ||
    reserveOut <= 0
  ) {
    return null;
  }
  const expectedOutput = (inAmount * reserveOut) / (reserveIn + inAmount);
  if (!Number.isFinite(expectedOutput) || expectedOutput <= 0) {
    return null;
  }
  return ((expectedOutput - outAmount) / expectedOutput) * 100;
};

export const applySlippageToAmount = (amount: string, slippageTolerance: number): string => {
  const amountBig = BigInt(amount);
  const bps = Math.max(0, Math.round(slippageTolerance * 100));
  const numerator = BigInt(10_000 - bps);
  return ((amountBig * numerator) / 10_000n).toString();
};
