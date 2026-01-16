import type { Plugin } from "hedera-agent-kit";
import { farmsTool } from "./tools/farms";
import { addLiquidityTool, removeLiquidityTool } from "./tools/liquidity";
import { poolsTool } from "./tools/pools";
import { quoteTool } from "./tools/quote";
import { swapTool } from "./tools/swap";

export const saucerswapPlugin: Plugin = {
  name: "saucerswap",
  description:
    "Integration with SaucerSwap DEX for token swaps, liquidity provision, and yield farming",
  tools: () => [swapTool, quoteTool, poolsTool, addLiquidityTool, removeLiquidityTool, farmsTool],
};

export { saucerswapPlugin as default };
