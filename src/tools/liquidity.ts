import { ContractExecuteTransaction, ContractFunctionParameters } from "@hiero-ledger/sdk";
import type { Tool } from "@hashgraph/hedera-agent-kit";
import { z } from "zod";
import { createSaucerSwapClient } from "../api/client";
import { resolveSaucerSwapConfig } from "../config";
import { applySlippageToAmount } from "../utils/amm";
import {
  accountIdToSolidityAddress,
  contractIdFromString,
  normalizeTokenAlias,
  requireTokenId,
  tokenIdToSolidityAddress,
} from "../utils/tokens";
import { finalizeTransaction } from "../utils/transactions";
import { parseUnits } from "../utils/units";

const addLiquidityInputSchema = z.object({
  tokenA: z.string().describe("First token ID"),
  tokenB: z.string().describe("Second token ID"),
  amountA: z.string().describe("Amount of tokenA to add"),
  amountB: z.string().describe("Amount of tokenB to add"),
  slippageTolerance: z
    .number()
    .optional()
    .default(0.5)
    .describe("Maximum slippage tolerance percentage"),
});

const removeLiquidityInputSchema = z.object({
  tokenA: z.string().describe("First token ID"),
  tokenB: z.string().describe("Second token ID"),
  lpTokenAmount: z.string().describe("Amount of LP tokens to burn"),
  minAmountA: z.string().describe("Minimum amount of tokenA to receive"),
  minAmountB: z.string().describe("Minimum amount of tokenB to receive"),
});

const resolveDeadline = (defaultMinutes: number): number => {
  return Math.floor(Date.now() / 1000) + defaultMinutes * 60;
};

const resolveRouterContract = (config: ReturnType<typeof resolveSaucerSwapConfig>): string => {
  const routerContractId =
    config.defaultPoolVersion === "v2"
      ? (config.routerV2ContractId ?? config.routerContractId)
      : (config.routerContractId ?? config.routerV2ContractId);
  if (!routerContractId) {
    throw new Error("Missing SaucerSwap router contract ID configuration.");
  }
  return routerContractId;
};

export const addLiquidityTool: Tool = {
  method: "saucerswap_add_liquidity",
  name: "SaucerSwap Add Liquidity",
  description: "Add liquidity to a SaucerSwap pool.",
  parameters: addLiquidityInputSchema,
  execute: async (client, context, params) => {
    const args = addLiquidityInputSchema.parse(params);
    const config = resolveSaucerSwapConfig(context);
    const operatorAccountId = client?.operatorAccountId?.toString();
    const slippageTolerance = args.slippageTolerance ?? 0.5;

    if (!operatorAccountId) {
      return {
        success: false,
        error: "Hedera client with an operator account is required for liquidity actions.",
      };
    }

    try {
      const api =
        (context as { saucerswapClient?: ReturnType<typeof createSaucerSwapClient> })
          .saucerswapClient ?? createSaucerSwapClient(config);

      const tokenAInput = normalizeTokenAlias(args.tokenA, config);
      const tokenBInput = normalizeTokenAlias(args.tokenB, config);
      const tokenAId = await api.resolveTokenId(tokenAInput);
      const tokenBId = await api.resolveTokenId(tokenBInput);

      const tokenA = await api.getTokenByIdOrSymbol(tokenAId);
      const tokenB = await api.getTokenByIdOrSymbol(tokenBId);

      if (!tokenA || !tokenB) {
        return {
          success: false,
          error: "Unable to resolve token metadata from SaucerSwap API.",
        };
      }

      const amountADesired = parseUnits(args.amountA, tokenA.decimals);
      const amountBDesired = parseUnits(args.amountB, tokenB.decimals);
      const amountAMin = applySlippageToAmount(amountADesired, slippageTolerance);
      const amountBMin = applySlippageToAmount(amountBDesired, slippageTolerance);

      const routerContractId = resolveRouterContract(config);
      const deadline = resolveDeadline(config.deadlineMinutes);
      const toAddress = accountIdToSolidityAddress(operatorAccountId);

      const params = new ContractFunctionParameters()
        .addAddress(tokenIdToSolidityAddress(requireTokenId(tokenAId)))
        .addAddress(tokenIdToSolidityAddress(requireTokenId(tokenBId)))
        .addUint256(amountADesired)
        .addUint256(amountBDesired)
        .addUint256(amountAMin)
        .addUint256(amountBMin)
        .addAddress(toAddress)
        .addUint256(deadline);

      const transaction = new ContractExecuteTransaction()
        .setContractId(contractIdFromString(routerContractId))
        .setGas(config.gasLimit)
        .setFunction("addLiquidity", params);

      return await finalizeTransaction(transaction, client, context, {
        amountADesired,
        amountBDesired,
        amountAMin,
        amountBMin,
      });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
};

export const removeLiquidityTool: Tool = {
  method: "saucerswap_remove_liquidity",
  name: "SaucerSwap Remove Liquidity",
  description: "Remove liquidity from a SaucerSwap pool.",
  parameters: removeLiquidityInputSchema,
  execute: async (client, context, params) => {
    const args = removeLiquidityInputSchema.parse(params);
    const config = resolveSaucerSwapConfig(context);
    const operatorAccountId = client?.operatorAccountId?.toString();

    if (!operatorAccountId) {
      return {
        success: false,
        error: "Hedera client with an operator account is required for liquidity actions.",
      };
    }

    try {
      const api =
        (context as { saucerswapClient?: ReturnType<typeof createSaucerSwapClient> })
          .saucerswapClient ?? createSaucerSwapClient(config);

      const tokenAInput = normalizeTokenAlias(args.tokenA, config);
      const tokenBInput = normalizeTokenAlias(args.tokenB, config);
      const tokenAId = await api.resolveTokenId(tokenAInput);
      const tokenBId = await api.resolveTokenId(tokenBInput);

      const pool = await api.getPoolByTokens(tokenAId, tokenBId, config.defaultPoolVersion);
      if (!pool) {
        return {
          success: false,
          error: "Unable to locate pool for the provided token pair.",
        };
      }

      const tokenA = await api.getTokenByIdOrSymbol(tokenAId);
      const tokenB = await api.getTokenByIdOrSymbol(tokenBId);
      if (!tokenA || !tokenB) {
        return {
          success: false,
          error: "Unable to resolve token metadata from SaucerSwap API.",
        };
      }

      const lpAmount = parseUnits(args.lpTokenAmount, pool.lpToken.decimals);
      const minAmountA = parseUnits(args.minAmountA, tokenA.decimals);
      const minAmountB = parseUnits(args.minAmountB, tokenB.decimals);

      const routerContractId = resolveRouterContract(config);
      const deadline = resolveDeadline(config.deadlineMinutes);
      const toAddress = accountIdToSolidityAddress(operatorAccountId);

      const params = new ContractFunctionParameters()
        .addAddress(tokenIdToSolidityAddress(requireTokenId(tokenAId)))
        .addAddress(tokenIdToSolidityAddress(requireTokenId(tokenBId)))
        .addUint256(lpAmount)
        .addUint256(minAmountA)
        .addUint256(minAmountB)
        .addAddress(toAddress)
        .addUint256(deadline);

      const transaction = new ContractExecuteTransaction()
        .setContractId(contractIdFromString(routerContractId))
        .setGas(config.gasLimit)
        .setFunction("removeLiquidity", params);

      return await finalizeTransaction(transaction, client, context, {
        lpAmount,
        minAmountA,
        minAmountB,
      });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
};
