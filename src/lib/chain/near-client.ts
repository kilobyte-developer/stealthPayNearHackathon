import type { NearNetworkConfig } from "@/types";

interface NearRpcResponse<T> {
  jsonrpc: "2.0";
  id: number;
  result?: T;
  error?: { code: number; message: string; data?: unknown };
}

interface NearAccountView {
  amount: string;
}

interface NearBlockView {
  header: {
    height: number;
    hash: string;
  };
}

export class NearRpcError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NearRpcError";
  }
}

export class NearRpcClient {
  private requestId = 0;

  constructor(private readonly network: NearNetworkConfig) {}

  async request<T>(method: string, params: unknown): Promise<T> {
    const response = await fetch(this.network.rpcUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: ++this.requestId,
        method,
        params,
      }),
    });

    if (!response.ok) {
      throw new NearRpcError(`NEAR RPC returned HTTP ${response.status}.`);
    }

    const body = (await response.json()) as NearRpcResponse<T>;
    if (body.error) {
      throw new NearRpcError(`NEAR RPC request failed: ${body.error.message}`);
    }
    if (body.result === undefined) {
      throw new NearRpcError("NEAR RPC response did not contain a result.");
    }

    return body.result;
  }

  async getNativeBalance(accountId: string): Promise<bigint> {
    const result = await this.request<NearAccountView>("query", {
      request_type: "view_account",
      finality: "final",
      account_id: accountId,
    });
    return BigInt(result.amount);
  }

  getLatestBlock(): Promise<NearBlockView> {
    return this.request<NearBlockView>("block", { finality: "final" });
  }
}