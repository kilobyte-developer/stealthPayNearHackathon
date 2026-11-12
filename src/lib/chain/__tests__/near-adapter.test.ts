import { describe, expect, it, vi } from "vitest";
import type { NearWalletBase } from "@hot-labs/near-connect";
import { NEAR_NETWORKS } from "@/config/networks";
import { NearChainAdapter } from "@/lib/chain/adapters";

const network = NEAR_NETWORKS["near-testnet"];

function makeWallet() {
  return {
    manifest: { name: "Test Wallet" },
    signAndSendTransaction: vi.fn().mockResolvedValue({
      transaction: { hash: "near-testnet-hash" },
    }),
  } as unknown as NearWalletBase;
}

describe("NearChainAdapter", () => {
  it("supports only native NEAR networks", () => {
    expect(new NearChainAdapter().supports(network)).toBe(true);
    expect(new NearChainAdapter().supports({ ...network, family: "near" })).toBe(
      true,
    );
  });

  it("signs a native transfer through the connected wallet", async () => {
    const wallet = makeWallet();
    const adapter = new NearChainAdapter(wallet);

    const result = await adapter.sendNative({
      from: "sender.testnet",
      to: "receiver.testnet",
      amount: 1_000_000_000_000_000_000_000_000n,
      network,
    });

    expect(result).toMatchObject({
      id: "near-testnet-hash",
      network,
      status: "confirmed",
    });
    expect(wallet.signAndSendTransaction).toHaveBeenCalledWith({
      network: "testnet",
      signerId: "sender.testnet",
      receiverId: "receiver.testnet",
      actions: [{ type: "Transfer", params: { deposit: "1000000000000000000000000" } }],
    });
  });

  it("rejects sends without a connected wallet", async () => {
    await expect(
      new NearChainAdapter().sendNative({
        from: "sender.testnet",
        to: "receiver.testnet",
        amount: 1n,
        network,
      }),
    ).rejects.toThrow("connected NEAR wallet");
  });
});