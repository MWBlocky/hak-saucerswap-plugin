import type { Tool } from "hedera-agent-kit";
import { z } from "zod";
import { createSaucerSwapClient } from "../api/client";
import { resolveSaucerSwapConfig } from "../config";

const farmsInputSchema = z.object({
  poolId: z.number().int().positive().optional().describe("Optional pool ID to filter farms"),
});

export const farmsTool: Tool = {
  method: "saucerswap_get_farms",
  name: "SaucerSwap Get Farms",
  description: "Get active farming opportunities on SaucerSwap.",
  parameters: farmsInputSchema,
  execute: async (_client, context, params) => {
    const args = farmsInputSchema.parse(params);
    const config = resolveSaucerSwapConfig(context);
    const api =
      (context as { saucerswapClient?: ReturnType<typeof createSaucerSwapClient> })
        .saucerswapClient ?? createSaucerSwapClient(config);

    try {
      const farms = await api.getFarms();
      const filtered = args.poolId ? farms.filter((farm) => farm.poolId === args.poolId) : farms;

      return {
        success: true,
        farms: filtered,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
};
