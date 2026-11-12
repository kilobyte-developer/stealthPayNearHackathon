"use client";

import * as React from "react";
import {
  NearConnector,
  type NearWalletBase,
} from "@hot-labs/near-connect";

type NearWalletStatus = "initializing" | "disconnected" | "connected";

interface NearWalletContextValue {
  status: NearWalletStatus;
  accountId: string | null;
  walletName: string | null;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  sendNative: (to: string, amountYocto: bigint) => Promise<string>;
  clearError: () => void;
}

const NearWalletContext = React.createContext<NearWalletContextValue | null>(
  null,
);

export function useNearWallet() {
  const context = React.useContext(NearWalletContext);
  if (!context) {
    throw new Error("useNearWallet must be used inside <NearProvider>");
  }
  return context;
}

function transactionHash(result: { transaction?: { hash?: string } }): string {
  const hash = result.transaction?.hash;
  if (!hash) throw new Error("NEAR wallet returned no transaction hash.");
  return hash;
}

export function NearProvider({ children }: { children: React.ReactNode }) {
  const connectorRef = React.useRef<NearConnector | null>(null);
  const walletRef = React.useRef<NearWalletBase | null>(null);
  const accountRef = React.useRef<string | null>(null);
  const [status, setStatus] = React.useState<NearWalletStatus>(
    "initializing",
  );
  const [accountId, setAccountId] = React.useState<string | null>(null);
  const [walletName, setWalletName] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const connector = new NearConnector({
      network: "testnet",
      autoConnect: true,
      features: {
        testnet: true,
        signAndSendTransaction: true,
      },
    });
    connectorRef.current = connector;

    const applyConnection = (wallet: NearWalletBase, nextAccountId: string) => {
      walletRef.current = wallet;
      accountRef.current = nextAccountId;
      setAccountId(nextAccountId);
      setWalletName(wallet.manifest.name);
      setStatus("connected");
      setError(null);
    };

    const onSignIn = (payload: Parameters<typeof connector.on>[1] extends (
      ...args: infer Args
    ) => unknown
      ? Args[0]
      : never) => {
      if ("accounts" in payload && payload.accounts[0]) {
        applyConnection(payload.wallet, payload.accounts[0].accountId);
      }
    };

    const onSignOut = () => {
      walletRef.current = null;
      accountRef.current = null;
      setAccountId(null);
      setWalletName(null);
      setStatus("disconnected");
    };

    connector.on("wallet:signIn", onSignIn);
    connector.on("wallet:signOut", onSignOut);

    void connector
      .getConnectedWallet()
      .then(({ wallet, accounts }) => {
        const account = accounts[0];
        if (account) applyConnection(wallet, account.accountId);
        else setStatus("disconnected");
      })
      .catch(() => setStatus("disconnected"));

    return () => {
      connector.off("wallet:signIn", onSignIn);
      connector.off("wallet:signOut", onSignOut);
      connectorRef.current = null;
      walletRef.current = null;
      accountRef.current = null;
    };
  }, []);

  const connect = React.useCallback(async () => {
    const connector = connectorRef.current;
    if (!connector) throw new Error("NEAR wallet connector is initializing.");

    setError(null);
    try {
      const wallet = await connector.connect();
      const accounts = await wallet.getAccounts({ network: "testnet" });
      const account = accounts[0];
      if (!account) throw new Error("NEAR wallet returned no account.");
      walletRef.current = wallet;
      accountRef.current = account.accountId;
      setAccountId(account.accountId);
      setWalletName(wallet.manifest.name);
      setStatus("connected");
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "NEAR wallet connection failed.";
      setError(message);
      setStatus("disconnected");
      throw cause;
    }
  }, []);

  const disconnect = React.useCallback(async () => {
    const connector = connectorRef.current;
    const wallet = walletRef.current;
    if (connector && wallet) await connector.disconnect(wallet);
  }, []);

  const sendNative = React.useCallback(
    async (to: string, amountYocto: bigint) => {
      const wallet = walletRef.current;
      const signerId = accountRef.current;
      if (!wallet || !signerId) throw new Error("Connect a NEAR wallet first.");
      if (amountYocto <= 0n) throw new Error("Transfer amount must be positive.");

      const result = await wallet.signAndSendTransaction({
        network: "testnet",
        signerId,
        receiverId: to,
        actions: [
          {
            type: "Transfer",
            params: { deposit: amountYocto.toString() },
          },
        ],
      });
      return transactionHash(result);
    },
    [],
  );

  const value = React.useMemo<NearWalletContextValue>(
    () => ({
      status,
      accountId,
      walletName,
      error,
      connect,
      disconnect,
      sendNative,
      clearError: () => setError(null),
    }),
    [status, accountId, walletName, error, connect, disconnect, sendNative],
  );

  return (
    <NearWalletContext.Provider value={value}>
      {children}
    </NearWalletContext.Provider>
  );
}