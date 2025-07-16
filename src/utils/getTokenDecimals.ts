import { MON_ADDRESS, WMON_ADDRESS } from "@/constant/addresses";

export const getTokenDecimals = (tokenAddress: string) => {
  if (tokenAddress === MON_ADDRESS || tokenAddress === WMON_ADDRESS) {
    return 18;
  } else {
    return 6;
  }
};
