import { ethers } from "ethers";
import { useWalletClient, useAccount } from "wagmi";
import { getERC20Contract, getTokenFaucetContract } from "@/api/web3";
import { useEffect, useState } from "react";
import {
  dexAggregatorAddress,
  MON_ADDRESS,
  USDC_ADDRESS,
  USDT_ADDRESS,
  WMON_ADDRESS,
} from "@/constant/addresses";
import { getBestQuote } from "./quote";
import { useEthersSigner } from "@/api/ethers";
import { MaxUint256 } from "ethers";

export default function DexSwapComponent() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const signer = useEthersSigner();

  const handleSwap = async (
    tokenIn: string,
    tokenOut: string,
    amountIn: bigint,
    amountOutMin: bigint,
    deadline: number
  ): Promise<string | any> => {
    if (!signer) {
      console.log("Wallet not connected!");
      return;
    }

    try {
      const quote = await getBestQuote(signer, amountIn, [tokenIn, tokenOut]);
      if (!quote) {
        throw new Error("Failed to get quote");
      }
      const routerAddress = quote.routerAddress;
      // console.log("Quote received:", quote);
      // const estimatedAmount = quote.amountOut;
      // console.log("Estimated amount out:", estimatedAmount.toString());

      // const amountOutMin =
      //   (estimatedAmount * BigInt(10000 - slippageTolerancePercent * 100)) /
      //   BigInt(10000);

      if (tokenIn === WMON_ADDRESS && tokenOut === MON_ADDRESS) {
        const erc20contract = getERC20Contract(signer, tokenIn);
        const allowance = await erc20contract.approve(
          dexAggregatorAddress,
          MaxUint256
        );
        await allowance.wait();
      }

      if (
        tokenIn === WMON_ADDRESS ||
        tokenIn === USDT_ADDRESS ||
        tokenIn === USDC_ADDRESS
      ) {
        const erc20contract = getERC20Contract(signer, tokenIn);
        const allowance = await erc20contract.approve(
          dexAggregatorAddress,
          MaxUint256
        );
        await allowance.wait();
      }

      const contract = await getTokenFaucetContract(signer);
      if (!contract) throw new Error("Failed to get contract instance");
      if (!tokenIn || !tokenOut || !amountIn || !amountOutMin || !deadline) {
        throw new Error("Invalid input parameters");
      }
      if (tokenIn === tokenOut) {
        throw new Error("Cannot swap the same token");
      }

      const tx = await contract.swap(
        tokenIn,
        tokenOut,
        amountIn,
        amountOutMin,
        deadline,
        {
          value: tokenIn === MON_ADDRESS ? amountIn : undefined,
        }
      );

      // console.log("Transaction sent:", tx.hash);
      await tx.wait();
      console.log("Swap confirmed");
      return tx.hash;
    } catch (error) {
      console.error("Swap failed:", error);
    }
  };

  return { handleSwap };
}
