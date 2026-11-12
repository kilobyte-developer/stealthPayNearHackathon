import type { ChainFamily, SupportedNetworkConfig } from "@/types";

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