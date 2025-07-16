"use client";

import React, { useEffect, useState } from "react";
import {
  useConnectModal,
  useActiveAccount,
  useActiveWallet,
  useDisconnect,
  useActiveWalletChain,
  useSwitchActiveWalletChain,
  useWalletBalance,
} from "thirdweb/react";
import { monadTestnet } from "thirdweb/chains";
import { client } from "@/config/client";
import { createWallet } from "thirdweb/wallets";

export default function ConnectWallet() {
  const { connect, isConnecting } = useConnectModal();
  const account = useActiveAccount();
  const wallet = useActiveWallet();
  const { disconnect } = useDisconnect();
  const activeChain = useActiveWalletChain();
  const switchActiveWalletChain = useSwitchActiveWalletChain();
  const { data: balance, isLoading: isBalanceLoading } = useWalletBalance({
    chain: monadTestnet,
    address: account?.address,
    client,
  });

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    if (account && activeChain?.id !== monadTestnet.id) {
      alert("Connected to wrong network, switching...");
      switchActiveWalletChain?.(monadTestnet).catch(() => {
        alert("Failed to switch network");
      });
    }
  }, [account, activeChain, switchActiveWalletChain]);

  const handleConnect = async () => {
    try {
      if (!account) {
        await connect({
          client,
          wallets: [
            createWallet("io.metamask"),
            createWallet("com.coinbase.wallet"),
            createWallet("me.rainbow"),
          ],
        });
      }
      if (activeChain?.id !== monadTestnet.id) {
        await switchActiveWalletChain?.(monadTestnet);
      }
    } catch (err) {
      alert("Failed to connect wallet");
      console.error(err);
    }
  };

  const handleDisconnect = () => {
    if (wallet) {
      disconnect(wallet);
      setIsDropdownOpen(false);
    }
  };

  return (
    <div className="relative inline-block">
      {!account ? (
        <button
          onClick={handleConnect}
          disabled={isConnecting}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 focus:outline-none text-white font-semibold px-4 py-2 rounded-md"
          aria-label="Connect wallet"
        >
          {isConnecting ? "Connecting..." : "Connect Wallet"}
        </button>
      ) : (
        <>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-md focus:outline-none flex items-center space-x-2"
            aria-haspopup="true"
            aria-expanded={isDropdownOpen}
            aria-label="User account menu"
          >
            <span>{`${account.address.slice(0, 16)}... ${account.address.slice(
              -7
            )}`}</span>
            {/* <span className="text-sm text-gray-200">
              {isBalanceLoading
                ? "(Loading...)"
                : balance
                ? `: ${parseFloat(balance).toFixed(4)} ETH`
                : ""}
            </span> */}
            {/* Simple arrow indicator */}
            <svg
              className={`w-4 h-4 ml-1 transition-transform duration-200 ${
                isDropdownOpen ? "rotate-180" : "rotate-0"
              }`}
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 10 10"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 9l-7 7-7-7"
              ></path>
            </svg>
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg z-10 ring-1 ring-black ring-opacity-5 focus:outline-none">
              <div className="px-4 py-3 text-white border-b border-gray-700">
                <p className="font-semibold">{`${account.address.slice(
                  0,
                  16
                )}... ${account.address.slice(-7)}`}</p>
                {/* <p className="text-sm text-gray-400">
                  {balance
                    ? `${parseFloat(balance).toFixed(4)} ETH`
                    : "No balance"}
                </p> */}
              </div>
              <button
                onClick={handleDisconnect}
                className="w-full text-left px-4 py-2 text-red-500 hover:bg-red-600 rounded-b-md font-semibold transition-colors"
              >
                Disconnect
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
