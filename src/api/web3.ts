import { InfuraProvider } from "ethers/providers";
import { ethers } from "ethers";
import dexAggregatorAbi from "@/constant/abi/dex.json";
import { dexAggregatorAddress } from "../constant/addresses";

declare global {
  interface Window {
    ethereum?: any;
  }
}
export async function getTokenFaucetContract(
  signerOrprovider: ethers.Signer | ethers.Provider
): Promise<ethers.Contract | undefined> {
  try {
    const contract = new ethers.Contract(
      dexAggregatorAddress,
      dexAggregatorAbi,
      signerOrprovider
    );
    return contract;
  } catch (error) {
    throw new Error("Failed to get Dex contract");
  }
}
