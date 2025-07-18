"use client";
import { useActiveAccount, useActiveWalletChain } from "thirdweb/react";
import { ethers6Adapter } from "thirdweb/adapters/ethers6";
import { client } from "@/config/client";
import { useMemo } from "react";
import type { Signer } from "ethers";

/**
 * React hook to convert a viem Wallet Client to an ethers.js Signer.
 * Returns undefined if wallet or chain is not connected.
 */
export function useEthersSigner(): Signer | undefined {
  const activeAccount = useActiveAccount();
  const activeChain = useActiveWalletChain();

  // Memoize signer so it changes only when dependencies change
  const signer = useMemo(() => {
    if (!activeChain) {
      console.error("Chain not connected");
      return undefined;
    }
    if (!activeAccount) {
      console.error("Invalid account");
      return undefined;
    }

    try {
      return ethers6Adapter.signer.toEthers({
        client,
        chain: activeChain,
        account: activeAccount,
      });
    } catch (error) {
      console.error("Failed to create ethers signer:", error);
      return undefined;
    }
  }, [activeChain, activeAccount]);

  return signer;
}

export const useWalletAddress = () => {
  const activeAccount = useActiveAccount();
  return activeAccount?.address;
};
