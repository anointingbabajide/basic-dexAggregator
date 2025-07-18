import { getERC20Contract } from "@/api/web3";
import { ethers } from "ethers";

export const getERC20Balance = async (
  signer: ethers.Signer | ethers.Provider,
  tokenIn: string
): Promise<ethers.BigNumberish> => {
  const erc20contract = await getERC20Contract(signer, tokenIn);
  const userBalance = erc20contract.balanceOf(tokenIn);
  if (!userBalance) {
    throw new Error("User balance is not found");
  }
  return userBalance;
};
