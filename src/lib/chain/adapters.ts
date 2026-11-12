import type { ChainFamily, SupportedNetworkConfig } from "@/types";
import type { NearWalletBase } from "@hot-labs/near-connect";
import { NearRpcClient } from "./near-client";

export type ChainAddress = string;

export interface ChainTransaction {
  id: string;
  network: SupportedNetworkConfig;
  status: "pending" | "confirmed" | "failed";
}

export interface ChainAdapter {
  readonly family: ChainFamily;
  supports(network: SupportedNetworkConfig): boolean;
  getNativeBalance(
    address: ChainAddress,
    network: SupportedNetworkConfig,
  ): Promise<bigint>;
  sendNative(params: {
    from: ChainAddress;
    to: ChainAddress;
    amount: bigint;
    network: SupportedNetworkConfig;
  }): Promise<ChainTransaction>;
}

export function isChainFamily(
  network: SupportedNetworkConfig,
  family: ChainFamily,
): boolean {
  return network.family === family;
}

export class NearChainAdapter implements ChainAdapter {
  readonly family = "near" as const;

  constructor(private readonly wallet: NearWalletBase | null = null) {}

  supports(network: SupportedNetworkConfig): boolean {
    return network.family === "near";
  }

  async getNativeBalance(
    address: ChainAddress,
    network: SupportedNetworkConfig,
  ): Promise<bigint> {
    if (network.family !== "near") {
      throw new Error("NEAR adapter cannot read an EVM network.");
    }
    return new NearRpcClient(network).getNativeBalance(address);
  }

  async sendNative({
    from,
    to,
    amount,
    network,
  }: {
    from: ChainAddress;
    to: ChainAddress;
    amount: bigint;
    network: SupportedNetworkConfig;
  }): Promise<ChainTransaction> {
    if (network.family !== "near") {
      throw new Error("NEAR adapter cannot send on an EVM network.");
    }
    if (!this.wallet) {
      throw new Error("A connected NEAR wallet is required to send funds.");
    }
    if (amount <= 0n) {
      throw new Error("Transfer amount must be positive.");
    }

    const result = await this.wallet.signAndSendTransaction({
      network: network.networkId,
      signerId: from,
      receiverId: to,
      actions: [
        {
          type: "Transfer",
          params: { deposit: amount.toString() },
        },
      ],
    });
    const hash = result.transaction?.hash;
    if (!hash) throw new Error("NEAR wallet returned no transaction hash.");

    return { id: hash, network, status: "confirmed" };
  }
}