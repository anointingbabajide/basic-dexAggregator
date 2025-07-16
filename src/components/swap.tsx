"use client";
import React, { useState, useEffect } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import DexSwapComponent from "@/swap/dex";
import { MON_ADDRESS, WMON_ADDRESS } from "@/constant/addresses";
import { ethers } from "ethers";
import { getTokenDecimals } from "@/utils/getTokenDecimals";
import { getBestQuote } from "@/swap/quote";
import { useWalletClient } from "wagmi";
import { useEthersSigner } from "@/api/ethers";
import { useActiveAccount, useActiveWalletChain } from "thirdweb/react";
import { ethers6Adapter } from "thirdweb/adapters/ethers6";
import { client } from "@/config/client";
import ConnectWallet from "@/api/Connetwallet";
import Image from "next/image";

const TOKENS = [
  {
    symbol: "MON",
    address: "0x0000000000000000000000000000000000000000",
    image:
      "https://imagedelivery.net/cBNDGgkrsEA-b_ixIp9SkQ/I_t8rg_V_400x400.jpg/public",
  }, // Native
  {
    symbol: "WMON",
    address: "0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701",
    image:
      "https://imagedelivery.net/cBNDGgkrsEA-b_ixIp9SkQ/I_t8rg_V_400x400.jpg/public",
  },
  {
    symbol: "USDT",
    address: "0x88b8E2161DEDC77EF4ab7585569D2415a1C1055D",
    image: "https://imagedelivery.net/cBNDGgkrsEA-b_ixIp9SkQ/images.png/public",
  },
  {
    symbol: "USDC",
    address: "0xf817257fed379853cDe0fa4F97AB987181B1E5Ea",
    image: "https://s2.coinmarketcap.com/static/img/coins/128x128/3408.png",
  },
];

export default function DexSwap() {
  const [tokenIn, setTokenIn] = useState(TOKENS[0].address);
  const [tokenOut, setTokenOut] = useState(TOKENS[3].address);
  const [amountIn, setAmountIn] = useState("");
  const [amountOutMin, setAmountOutMin] = useState("");
  const [deadlineMinutes, setDeadlineMinutes] = useState(20);
  const [isSwapping, setIsSwapping] = useState(false);
  const [message, setMessage] = useState<React.ReactNode>("");
  const [spillaagetolerancePercent, setSlippageTolerancePercent] =
    useState(0.5);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { handleSwap } = DexSwapComponent();
  const signer = useEthersSigner();
  const activeAccount = useActiveAccount();
  const activeChain = useActiveWalletChain();

  const address = activeAccount?.address;
  const deadline = Math.floor(Date.now() / 1000) + deadlineMinutes * 60;

  // console.log("Connected address:", address);
  console.log("Signer:", signer);
  console.log("Amount Out Min:", amountOutMin);
  console.log("Token in:", tokenIn);
  console.log("Token Out:", tokenOut);

  const swapTokens = () => {
    const temp = tokenIn;
    setTokenIn(tokenOut);
    setTokenOut(temp);
    setAmountIn("");
    setAmountOutMin("");
    setMessage("");
  };

  useEffect(() => {
    async function getBestquote() {
      if (!activeChain) {
        console.error("Chain not connected");
        return;
      }

      if (!activeAccount) {
        console.error("Invalid account");
        return;
      }

      const signer = ethers6Adapter.signer.toEthers({
        client,
        chain: activeChain,
        account: activeAccount,
      });

      if (!signer) {
        console.error("Signer not available");
        return;
      }
      if (!amountIn || Number(amountIn) <= 0) {
        setAmountOutMin("");
        return;
      }

      try {
        // Use wrapped token if input is native token
        const tokentoParse = tokenIn === MON_ADDRESS ? WMON_ADDRESS : tokenIn;
        const tokenOutToParse =
          tokenOut === MON_ADDRESS ? WMON_ADDRESS : tokenOut;

        if (tokenIn === MON_ADDRESS && tokenOut === WMON_ADDRESS) {
          setAmountOutMin(amountIn);
          return;
        } else if (tokenIn === WMON_ADDRESS && tokenOut === MON_ADDRESS) {
          setAmountOutMin(amountIn);
          return;
        }
        // Get decimals for input token
        const decimalsIn = getTokenDecimals(tokenIn);

        // Convert user input decimal string to BigInt
        const amountInRaw = ethers.parseUnits(amountIn, decimalsIn);

        // Call getBestQuote with raw BigInt amount
        const bestQuote = await getBestQuote(signer, amountInRaw, [
          tokentoParse,
          tokenOutToParse,
        ]);

        if (!bestQuote || !bestQuote.amountOut) {
          setAmountOutMin("");
          return;
        }

        console.log("Best Quote:", bestQuote);

        // Calculate slippage-adjusted minimum output amount
        const amountOutMinRaw =
          (bestQuote.amountOut *
            BigInt(10000 - spillaagetolerancePercent * 100)) /
          BigInt(10000);

        // Format minimum output amount back to decimal string for UI with output token decimals
        const decimalsOut = getTokenDecimals(tokenOut);
        const formattedAmountOutMin = ethers.formatUnits(
          amountOutMinRaw,
          decimalsOut
        );

        setAmountOutMin(formattedAmountOutMin);
      } catch (error) {
        console.error("Error fetching best quote:", error);
        setAmountOutMin("");
      }
    }

    // Optional: debounce fetching to avoid overload, basic example:
    const debounceTimeout = setTimeout(() => {
      getBestquote();
    }, 400);

    return () => clearTimeout(debounceTimeout);

    // Add all relevent dependencies
  }, [signer, amountIn, tokenIn, tokenOut, spillaagetolerancePercent]);

  const handleSwapClick = async (
    tokenIn: string,
    tokenOut: string,
    amountIn: number,
    amountOutMin: bigint,
    deadline: number
  ) => {
    try {
      setIsSwapping(true);
      setMessage("Finding the best route...");
      let amountToParse;

      if (tokenIn === MON_ADDRESS) {
        amountToParse = ethers.parseEther(amountIn.toString());
      } else {
        amountToParse = ethers.parseUnits(
          amountIn.toString(),
          getTokenDecimals(tokenIn)
        );
      }
      const tx = await handleSwap(
        tokenIn,
        tokenOut,
        amountToParse as any,
        amountOutMin,
        deadline
      );
      if (tx) {
        const explorerUrl = `https://testnet.monadexplorer.com/tx/${tx}`;
        setMessage(
          <>
            Swap completed!
            <br />
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 underline"
            >
              View transaction on explorer
            </a>
          </>
        );
      } else {
        setMessage("Swap fail");
      }
    } catch (error) {
      console.error("Error while perfoming swap:", error);
      setMessage("Swap Failed");
    } finally {
      setIsSwapping(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col space-y-7 justify-center items-center px-4">
      <ConnectWallet />
      <div className="w-full max-w-md bg-gray-800 rounded-2xl shadow-xl p-6 text-gray-200">
        <h1 className="text-3xl font-bold mb-6 text-center">
          Basic Aggregator DEX
        </h1>
        {/* FROM Input */}
        <label className="block mb-4">
          <span className="block mb-2 font-semibold">From</span>
          <div className="flex items-center bg-gray-700 rounded-lg px-4 py-3">
            <input
              type="number"
              min="0"
              step="any"
              placeholder="0.0"
              value={amountIn}
              onChange={(e) => setAmountIn(e.target.value)}
              disabled={isSwapping}
              className="flex-grow bg-transparent text-gray-100 text-xl font-semibold outline-none"
            />
            {/* <select
              className="ml-4 bg-gray-800 text-gray-300 rounded-lg px-3 py-1 text-lg cursor-pointer"
              value={tokenIn}
              onChange={(e) => setTokenIn(e.target.value)}
              disabled={isSwapping}
            >
              {TOKENS.map(({ symbol, address }) => (
                <option key={address} value={address}>
                  {symbol}
                </option>
              ))}
            </select> */}

            <div className="flex items-center space-x-2">
              {/* Show image matching current selected tokenOut */}
              <Image
                src={
                  TOKENS.find((t) => t.address === tokenIn)?.image ??
                  "/default-token.png"
                }
                alt={
                  TOKENS.find((t) => t.address === tokenIn)?.symbol ?? "token"
                }
                width={24}
                height={24}
                className="rounded-full"
              />

              <select
                className="bg-gray-800 text-gray-300 rounded-lg px-3 py-1 text-lg cursor-pointer"
                value={tokenIn}
                onChange={(e) => setTokenIn(e.target.value)}
                disabled={isSwapping}
              >
                {TOKENS.map(({ symbol, address }) => (
                  <option key={address} value={address}>
                    {symbol}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </label>
        {/* Swap direction toggle */}
        <div className="flex justify-center -mt-3 mb-5">
          <button
            onClick={swapTokens}
            disabled={isSwapping}
            className="bg-gray-700 hover:bg-gray-600 rounded-full p-2 focus:outline-none"
            title="Switch tokens"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 9l4-4 4 4m0 6l-4 4-4-4"
              />
            </svg>
          </button>
        </div>
        {/* TO Output (readonly amountOutMin optional) */}
        <label className="block mb-4">
          <span className="block mb-2 font-semibold">To</span>
          <div className="flex items-center bg-gray-700 rounded-lg px-4 py-3">
            <input
              type="number"
              min="0"
              step="any"
              placeholder="0.0"
              value={amountOutMin}
              onChange={(e) => setAmountOutMin(e.target.value)}
              disabled={isSwapping}
              className="flex-grow bg-transparent text-gray-400 text-xl font-semibold outline-none"
              readOnly
            />
            {/* <select
              className="ml-4 bg-gray-800 text-gray-300 rounded-lg px-3 py-1 text-lg cursor-pointer"
              value={tokenOut}
              onChange={(e) => setTokenOut(e.target.value)}
              disabled={isSwapping}
            >
              {TOKENS.map(({ symbol, address }) => (
                <option key={address} value={address}>
                  {symbol}
                </option>
              ))}
            </select> */}

            <div className="flex items-center space-x-2">
              {/* Show image matching current selected tokenOut */}
              <Image
                src={
                  TOKENS.find((t) => t.address === tokenOut)?.image ??
                  "/default-token.png"
                }
                alt={
                  TOKENS.find((t) => t.address === tokenOut)?.symbol ?? "token"
                }
                width={24}
                height={24}
                className="rounded-full"
              />

              <select
                className="bg-gray-800 text-gray-300 rounded-lg px-3 py-1 text-lg cursor-pointer"
                value={tokenOut}
                onChange={(e) => setTokenOut(e.target.value)}
                disabled={isSwapping}
              >
                {TOKENS.map(({ symbol, address }) => (
                  <option key={address} value={address}>
                    {symbol}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </label>
        {/* Advanced Options Toggle */}
        <button
          className="text-blue-400 text-sm mb-4 hover:underline focus:outline-none"
          onClick={() => setShowAdvanced(!showAdvanced)}
          disabled={isSwapping}
        >
          {showAdvanced ? "Hide Advanced" : "Show Advanced"}
        </button>
        {/* Advanced Options */}
        {showAdvanced && (
          <div className="bg-gray-700 rounded-lg p-4 mb-6 space-y-4 text-gray-400">
            <label>
              Slippage Tolerance (%)
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                placeholder="0.5"
                onChange={(e) =>
                  setSlippageTolerancePercent(Number(e.target.value))
                }
                value={spillaagetolerancePercent}
                className="w-full rounded-md bg-gray-600 text-white px-3 py-2 mt-1"
                disabled={isSwapping}
                // Wire it to state if you add slippage logic
              />
            </label>
            <label>
              Deadline (minutes)
              <input
                type="number"
                min="1"
                step="1"
                value={deadlineMinutes}
                onChange={(e) => setDeadlineMinutes(Number(e.target.value))}
                disabled={isSwapping}
                className="w-full rounded-md bg-gray-600 text-white px-3 py-2 mt-1"
              />
            </label>
          </div>
        )}
        {/* Swap Button */}
        {address ? (
          <button
            onClick={() =>
              handleSwapClick(
                tokenIn,
                tokenOut,
                Number(amountIn),
                ethers.parseUnits(amountOutMin, getTokenDecimals(tokenOut)),
                deadline
              )
            }
            disabled={
              isSwapping ||
              tokenIn === tokenOut ||
              !amountIn ||
              Number(amountIn) <= 0
            }
            className={`w-full py-3 rounded-lg font-bold transition-all ${
              isSwapping
                ? "bg-blue-500 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 cursor-pointer"
            } text-white`}
          >
            {isSwapping ? "Swapping..." : "Swap"}
          </button>
        ) : (
          <ConnectWallet />
        )}
        {/* Status Message */}
        {/* Status Message */}
        {message && (
          <div className="mt-6 text-center text-sm">
            {typeof message === "string" ? (
              <p
                className={`${
                  message.toLowerCase().includes("fail")
                    ? "text-red-500"
                    : message.toLowerCase().includes("executing")
                    ? "text-blue-400"
                    : "text-green-400"
                } font-medium`}
              >
                {message}
              </p>
            ) : (
              message // handles JSX like the explorer link block
            )}
          </div>
        )}
      </div>
    </div>
  );
}
