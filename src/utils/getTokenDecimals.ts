import { TOKEN_MAP } from "@/constant/addresses";

export const getTokenDecimals = (tokenAddress: string) => {
  const token = TOKEN_MAP.find(
    (token) => tokenAddress.toLowerCase() === token.address.toLowerCase()
  );
  return token?.decimal;
};
