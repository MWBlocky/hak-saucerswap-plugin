# Hedera Agent Kit - SaucerSwap Plugin

A plugin for [Hedera Agent Kit](https://github.com/hashgraph/hedera-agent-kit) that integrates with
[SaucerSwap](https://saucerswap.finance) to enable token swaps, liquidity management, and farm
insights on Hedera.

## Overview

SaucerSwap is Hedera's leading DEX with deep liquidity and active DeFi opportunities. This plugin
lets AI agents:

- Execute swaps with slippage protection
- Fetch swap quotes and price impact estimates
- Query pool reserves and token metadata
- Add/remove liquidity via router transactions
- Discover farming opportunities

## Installation

```bash
npm install hak-saucerswap-plugin
```

## Quick Start

```ts
import { saucerswapPlugin } from "hak-saucerswap-plugin";

const agent = new HederaAgent({
  plugins: [saucerswapPlugin]
});
```

## Configuration

Provide the API key, router contract IDs and (optionally) token aliases via environment or
plugin config. See [`.env.example`](./.env.example) for the full list of supported variables.

```bash
export SAUCERSWAP_API_KEY=your_saucerswap_api_key
export SAUCERSWAP_ROUTER_CONTRACT_ID=0.0.123456
export SAUCERSWAP_ROUTER_V2_CONTRACT_ID=0.0.654321
export SAUCERSWAP_WRAPPED_HBAR_TOKEN_ID=0.0.987654
```

The SaucerSwap API requires an `x-api-key` header. The plugin reads it from
`SAUCERSWAP_API_KEY` by default; alternatively pass the key (and any other settings)
explicitly via the agent-kit plugin config when creating the agent:

```ts
import { saucerswapPlugin } from "hak-saucerswap-plugin";

const agent = new HederaAgent({
  plugins: [saucerswapPlugin],
  config: {
    saucerswap: {
      apiKey: import.meta.env.VITE_SAUCERSWAP_API_KEY,
      routerContractId: "0.0.123456",
      routerV2ContractId: "0.0.654321",
      wrappedHbarTokenId: "0.0.987654",
      tokenAliases: { HBAR: "0.0.987654" },
      defaultPoolVersion: "v2"
    }
  }
});
```

Get an API key from [SaucerSwap](https://www.saucerswap.finance) and store it in your host
app's environment (e.g. `VITE_SAUCERSWAP_API_KEY` in a Vite app).

## Tools

- `saucerswap_get_swap_quote` - Fetches swap quotes from SaucerSwap API.
- `saucerswap_swap_tokens` - Builds/executes swap transactions with slippage protection.
- `saucerswap_get_pools` - Lists pools or finds a pool by token pair.
- `saucerswap_add_liquidity` - Builds/executes add-liquidity transactions.
- `saucerswap_remove_liquidity` - Builds/executes remove-liquidity transactions.
- `saucerswap_get_farms` - Lists farming opportunities.

## Dry-Run Swap Example

Build a swap transaction without executing it by setting `mode` to `returnBytes`.

```ts
import { Client } from "@hiero-ledger/sdk";
import { saucerswapPlugin } from "@your-org/hak-saucerswap-plugin";

const client = Client.forTestnet();
client.setOperator(process.env.HEDERA_ACCOUNT_ID!, process.env.HEDERA_PRIVATE_KEY!);

const context = { mode: "returnBytes" };
const tools = saucerswapPlugin.tools(context);
const swapTool = tools.find((tool) => tool.method === "saucerswap_swap_tokens");

if (!swapTool) {
  throw new Error("Swap tool not registered.");
}

const result = await swapTool.execute(client, context, {
  fromToken: "0.0.123456",
  toToken: "0.0.654321",
  amount: "1.5",
  slippageTolerance: 0.5
});

console.log(result);
```

Or run the built-in CLI wrapper after building:

```bash
npm run build

export HEDERA_NETWORK=testnet
export HEDERA_ACCOUNT_ID=0.0.1234
export HEDERA_PRIVATE_KEY=302e020100300506032b657004220420...
export SAUCERSWAP_ROUTER_CONTRACT_ID=0.0.123456
export SAUCERSWAP_SWAP_FROM=0.0.111111
export SAUCERSWAP_SWAP_TO=0.0.222222
export SAUCERSWAP_SWAP_AMOUNT=1.5

npm run dry-run:swap
```

## Integration Smoke Test

Hit the SaucerSwap API and print basic counts.

```bash
npm run test:integration
```

Optional environment overrides:

```bash
export SAUCERSWAP_BASE_URL=https://api.saucerswap.finance
export SAUCERSWAP_TEST_FROM_TOKEN=0.0.123456
export SAUCERSWAP_TEST_TO_TOKEN=0.0.654321
export SAUCERSWAP_TEST_AMOUNT=1
```

## Development

```bash
npm run build
npm run test
npm run lint
```

## License

MIT
