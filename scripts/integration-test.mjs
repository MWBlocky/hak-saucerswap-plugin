import axios from "axios";

const baseUrl = process.env.SAUCERSWAP_BASE_URL ?? "https://api.saucerswap.finance";
const quoteFrom = process.env.SAUCERSWAP_TEST_FROM_TOKEN;
const quoteTo = process.env.SAUCERSWAP_TEST_TO_TOKEN;
const quoteAmount = process.env.SAUCERSWAP_TEST_AMOUNT ?? "1";

const client = axios.create({
  baseURL: baseUrl,
  timeout: 10_000,
});

const request = async (path, params) => {
  try {
    const response = await client.get(path, { params });
    return { ok: true, data: response.data };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return {
        ok: false,
        error: `${error.response?.status ?? "network"} ${error.response?.statusText ?? error.message}`,
      };
    }
    return { ok: false, error: "Unknown error" };
  }
};

const run = async () => {
  let failed = false;

  const stats = await request("/stats");
  if (stats.ok) {
    console.log("stats: ok");
  } else {
    failed = true;
    console.error(`stats: ${stats.error}`);
  }

  const tokens = await request("/tokens");
  if (tokens.ok) {
    const count = Array.isArray(tokens.data) ? tokens.data.length : "unknown";
    console.log(`tokens: ${count}`);
  } else {
    failed = true;
    console.error(`tokens: ${tokens.error}`);
  }

  const pools = await request("/v2/pools");
  if (pools.ok) {
    const count = Array.isArray(pools.data) ? pools.data.length : "unknown";
    console.log(`pools v2: ${count}`);
  } else {
    failed = true;
    console.error(`pools v2: ${pools.error}`);
  }

  const farms = await request("/farms");
  if (farms.ok) {
    const count = Array.isArray(farms.data) ? farms.data.length : "unknown";
    console.log(`farms: ${count}`);
  } else {
    failed = true;
    console.error(`farms: ${farms.error}`);
  }

  if (quoteFrom && quoteTo) {
    const quote = await request("/v1/swap/quote", {
      tokenIn: quoteFrom,
      tokenOut: quoteTo,
      amount: quoteAmount,
      fromToken: quoteFrom,
      toToken: quoteTo,
    });
    if (quote.ok) {
      console.log("quote: ok");
    } else {
      failed = true;
      console.error(`quote: ${quote.error}`);
    }
  } else {
    console.log("quote: skipped (set SAUCERSWAP_TEST_FROM_TOKEN and SAUCERSWAP_TEST_TO_TOKEN)");
  }

  if (failed) {
    process.exitCode = 1;
  }
};

await run();
