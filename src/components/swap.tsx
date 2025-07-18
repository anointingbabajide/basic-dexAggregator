"use client";
import React, { useState, useEffect } from "react";
import DexSwapComponent from "@/swap/dex";
import { MON_ADDRESS, WMON_ADDRESS } from "@/constant/addresses";
import { ethers } from "ethers";
import { getTokenDecimals } from "@/utils/getTokenDecimals";
import { getBestQuote } from "@/swap/quote";
import { useEthersSigner, useWalletAddress } from "@/api/ethers";
import ConnectWallet from "@/api/Connetwallet";
import Image from "next/image";
import { TokenInfo } from "@/interface/tokenInfo";
import { Dialog } from "radix-ui";
import { Cross2Icon } from "@radix-ui/react-icons";
import { TOKENS } from "@/tokenData/token";

export default function DexSwap() {
  const signer = useEthersSigner();
  const [tokenIn, setTokenIn] = useState(TOKENS[0].address);
  const [tokenOut, setTokenOut] = useState(TOKENS[3].address);
  const [amountIn, setAmountIn] = useState("");
  const [amountOutMin, setAmountOutMin] = useState("");
  const [deadlineMinutes, setDeadlineMinutes] = useState(20);
  const [isSwapping, setIsSwapping] = useState(false);
  const [message, setMessage] = useState<React.ReactNode>("");
  const [spillaagetolerancePercent, setSlippageTolerancePercent] =
    useState(0.5);
  const selectedTokenIn = TOKENS.find((t) => t.address === tokenIn);
  console.log("Selected Token In:", selectedTokenIn);
  const selectedTokenOut = TOKENS.find((t) => t.address === tokenOut);
  const [openTokenIn, setOpenTokenIn] = useState(false);
  const [openTokenOut, setOpenTokenOut] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filteredTokensIn, setFilteredTokensIn] = useState<TokenInfo[]>(TOKENS);
  const [filteredTokensOut, setFilteredTokensOut] =
    useState<TokenInfo[]>(TOKENS);

  const [tokenInfilter, settokenInFilter] = useState("");
  const [tokenOutfilter, settokenOutFilter] = useState("");
  const { handleSwap } = DexSwapComponent();
  const address = useWalletAddress();
  const deadline = Math.floor(Date.now() / 1000) + deadlineMinutes * 60;

  console.log("Amount Out Min:", amountOutMin);
  console.log("Token in:", tokenIn);
  console.log("Token Out:", tokenOut);
  // console.log("filter:", filter);

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
        console.log("Decimals In:", decimalsIn);

        // Convert user input decimal string to BigInt
        const amountInRaw = ethers.parseUnits(amountIn, decimalsIn);
        console.log("Amount In Raw:", amountInRaw);

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
  }, [amountIn, tokenIn, tokenOut, spillaagetolerancePercent]);

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

  useEffect(() => {
    const inFilter = tokenInfilter?.trim().toLowerCase() || "";

    if (!inFilter) {
      setFilteredTokensIn(TOKENS);
      return;
    }

    const filtered = TOKENS.filter(
      (token) =>
        token.name.toLowerCase().includes(inFilter) ||
        token.symbol.toLowerCase().includes(inFilter) ||
        token.address.toLowerCase().includes(inFilter)
    );

    setFilteredTokensIn(filtered);
  }, [tokenInfilter]);

  // Filter tokens for tokenOut input
  useEffect(() => {
    const outFilter = tokenOutfilter?.trim().toLowerCase() || "";

    if (!outFilter) {
      setFilteredTokensOut(TOKENS);
      return;
    }

    const filtered = TOKENS.filter(
      (token) =>
        token.name.toLowerCase().includes(outFilter) ||
        token.symbol.toLowerCase().includes(outFilter) ||
        token.address.toLowerCase().includes(outFilter)
    );

    setFilteredTokensOut(filtered);
  }, [tokenOutfilter]);

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
              // type="number"
              min="0"
              step="any"
              placeholder="0.0"
              value={amountIn}
              onChange={(e) => setAmountIn(e.target.value)}
              disabled={isSwapping}
              className="flex-grow bg-transparent text-gray-100 text-xl font-semibold outline-none"
            />

            <div className="flex items-center space-x-2">
              <Dialog.Root open={openTokenIn} onOpenChange={setOpenTokenIn}>
                <Dialog.Trigger asChild>
                  <div className="flex items-center space-x-2">
                    <Image
                      src={selectedTokenIn?.image ?? "/default-token?.png"}
                      alt={selectedTokenIn?.symbol ?? "token"}
                      width={24}
                      height={24}
                      className="rounded-full"
                    />

                    {selectedTokenIn?.symbol}
                  </div>
                </Dialog.Trigger>

                <Dialog.Portal>
                  <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-fadeIn" />
                  <Dialog.Content className="fixed left-1/2 top-1/2 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl bg-gray-900 border border-gray-800 text-white shadow-2xl p-6 focus:outline-none animate-zoomIn">
                    <Dialog.Title className="text-2xl font-bold mb-1">
                      Select Token
                    </Dialog.Title>
                    <Dialog.Description className="mb-4 text-sm text-gray-400">
                      Search for a token to swap, or enter the token address.
                    </Dialog.Description>
                    <input
                      value={tokenInfilter}
                      // onChange={(e) => onFilterChange(e.target.value)}
                      onChange={(e) => settokenInFilter(e.target.value)}
                      placeholder="Search by name, symbol or address"
                      className="w-full mb-4 rounded-lg border-none bg-gray-800 py-2 px-3 text-base text-white focus:ring-2 focus:ring-blue-500 transition"
                      autoFocus
                    />
                    <div className="max-h-72 overflow-y-auto flex flex-col space-y-6 pr-1">
                      {filteredTokensIn.map((token) => (
                        <div
                          key={token?.address}
                          onClick={() => {
                            setTokenIn(token?.address);
                            setOpenTokenIn(false);
                          }}
                          className="flex items-center gap-4 bg-gray-800 rounded-lg p-3 border border-gray-700 hover:border-blue-600 hover:shadow-md transition cursor-pointer"
                        >
                          <Image
                            src={token?.image}
                            alt={token?.name}
                            width={36}
                            height={36}
                            className="rounded-full border border-gray-600"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h2 className="font-semibold text-lg truncate">
                                {token?.symbol}
                              </h2>
                              <span className="text-xs text-gray-400 truncate">
                                {token?.name}
                              </span>
                            </div>
                            <p className="text-xs text-blue-300 truncate">
                              {token?.address === MON_ADDRESS
                                ? "native"
                                : token?.address}
                            </p>
                          </div>
                          {/* <span className="ml-2 text-xs font-mono text-gray-400">
                            0
                          </span> */}
                        </div>
                      ))}
                      {filteredTokensIn.length === 0 && (
                        <div className="text-center text-gray-500 py-8">
                          No tokens found.
                        </div>
                      )}
                    </div>
                    <Dialog.Close asChild>
                      <button
                        className="absolute right-2.5 top-2.5 inline-flex size-[25px] appearance-none items-center justify-center rounded-full text-violet11 bg-gray3 hover:bg-violet4 focus:shadow-[0_0_0_2px] focus:shadow-violet7 focus:outline-none"
                        aria-label="Close"
                      >
                        <Cross2Icon />
                      </button>
                    </Dialog.Close>
                  </Dialog.Content>
                </Dialog.Portal>
              </Dialog.Root>
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
              // onChange={(e) => setAmountOutMin(e.target.value)}
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
              <Dialog.Root open={openTokenOut} onOpenChange={setOpenTokenOut}>
                <Dialog.Trigger asChild>
                  <div className="flex items-center space-x-2">
                    <Image
                      src={selectedTokenOut?.image ?? "/default-token?.png"}
                      alt={selectedTokenOut?.symbol ?? "token"}
                      width={24}
                      height={24}
                      className="rounded-full"
                    />

                    {selectedTokenOut?.symbol}
                  </div>
                </Dialog.Trigger>

                <Dialog.Portal>
                  <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-fadeIn" />
                  <Dialog.Content className="fixed left-1/2 top-1/2 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl bg-gray-900 border border-gray-800 text-white shadow-2xl p-6 focus:outline-none animate-zoomIn">
                    <Dialog.Title className="text-2xl font-bold mb-1">
                      Select Token
                    </Dialog.Title>
                    <Dialog.Description className="mb-4 text-sm text-gray-400">
                      Search for a token to swap, or enter the token address.
                    </Dialog.Description>
                    <input
                      value={tokenOutfilter}
                      onChange={(e) => settokenOutFilter(e.target.value)}
                      placeholder="Search by name, symbol or address"
                      className="w-full mb-4 rounded-lg border-none bg-gray-800 py-2 px-3 text-base text-white focus:ring-2 focus:ring-blue-500 transition"
                      autoFocus
                    />
                    <div className="max-h-72 overflow-y-auto flex flex-col space-y-6 pr-1">
                      {filteredTokensOut.map((token) => (
                        <div
                          key={token?.address}
                          onClick={() => {
                            setTokenOut(token?.address);
                            setOpenTokenOut(false);
                          }}
                          className="flex items-center gap-4 bg-gray-800 rounded-lg p-3 border border-gray-700 hover:border-blue-600 hover:shadow-md transition cursor-pointer"
                        >
                          <Image
                            src={token?.image}
                            alt={token?.name}
                            width={36}
                            height={36}
                            className="rounded-full border border-gray-600"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h2 className="font-semibold text-lg truncate">
                                {token?.symbol}
                              </h2>
                              <span className="text-xs text-gray-400 truncate">
                                {token?.name}
                              </span>
                            </div>
                            <p className="text-xs text-blue-300 truncate">
                              {token?.address === MON_ADDRESS
                                ? "native"
                                : token?.address}
                            </p>
                          </div>
                          <span className="ml-2 text-xs font-mono text-gray-400">
                            0
                          </span>
                        </div>
                      ))}
                      {filteredTokensOut.length === 0 && (
                        <div className="text-center text-gray-500 py-8">
                          No tokens found.
                        </div>
                      )}
                    </div>
                    <Dialog.Close asChild>
                      <button
                        className="absolute right-2.5 top-2.5 inline-flex size-[25px] appearance-none items-center justify-center rounded-full text-violet11 bg-gray3 hover:bg-violet4 focus:shadow-[0_0_0_2px] focus:shadow-violet7 focus:outline-none"
                        aria-label="Close"
                      >
                        <Cross2Icon />
                      </button>
                    </Dialog.Close>
                  </Dialog.Content>
                </Dialog.Portal>
              </Dialog.Root>
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
