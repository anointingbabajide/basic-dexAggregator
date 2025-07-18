import { getERC20Balance } from "@/swap/getErc20Balance";
import { BigNumberish } from "ethers";
import { useEffect, useState } from "react";

interface GetUserTokenBalanceProps {
  signer: any;
  tokenIn: string;
}

export const GetUserTokenBalance: React.FC<GetUserTokenBalanceProps> = ({
  signer,
  tokenIn,
}) => {
  const [balance, setBalance] = useState<BigNumberish | null>(null);

  useEffect(() => {
    const fetchBalance = async () => {
      const result = await getERC20Balance(signer, tokenIn);
      setBalance(result);
    };
    fetchBalance();
  }, [signer, tokenIn]);

  return balance;
};
