import type { Client, Transaction } from "@hiero-ledger/sdk";
import { AgentMode } from "@hashgraph/hedera-agent-kit";

export const finalizeTransaction = async (
  transaction: Transaction,
  client: Client,
  context: unknown,
  extra: Record<string, unknown>,
) => {
  const mode = (context as { mode?: AgentMode | string }).mode;
  if (mode === AgentMode.RETURN_BYTES || mode === "returnBytes" || mode === "RETURN_BYTES") {
    const txBytes = await transaction.toBytes();
    return {
      success: true,
      transactionBytes: Buffer.from(txBytes).toString("base64"),
      ...extra,
    };
  }

  const response = await transaction.execute(client);
  const receipt = await response.getReceipt(client);

  return {
    success: true,
    transactionId: response.transactionId?.toString(),
    status: receipt.status.toString(),
    ...extra,
  };
};
