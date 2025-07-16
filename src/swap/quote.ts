import { ethers, formatUnits } from "ethers";

const UNISWAP_V2_ROUTER_ADDRESS = "0xfb8e1c3b833f9e67a71c859a132cf783b645e436";
const PANCAKESWAP_UNIVERSAL_ROUTER_ADDRESS =
  "0x94D220C58A23AE0c2eE29344b00A30D1c2d9F1bc";

const IUniswapV2RouterABI = [
  "function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)",
];

async function getUniswapQuote(
  provider: ethers.Signer | ethers.Provider,
  amountIn: bigint,
  path: string[]
) {
  const router = new ethers.Contract(
    UNISWAP_V2_ROUTER_ADDRESS,
    IUniswapV2RouterABI,
    provider
  );
  try {
    const amounts = await router.getAmountsOut(amountIn, path);
    return amounts[amounts.length - 1];
  } catch (e) {
    console.error("Uniswap getAmountsOut failed:", e);
    return 0;
  }
}

export async function getBestQuote(
  provider: ethers.Signer | ethers.Provider,
  amountIn: bigint,
  path: string[]
) {
  const uniQuote = await getUniswapQuote(provider, amountIn, path);

  return {
    routerAddress: UNISWAP_V2_ROUTER_ADDRESS,
    amountOut: uniQuote,
  };
}

// async function main() {
//   const provider = new ethers.JsonRpcProvider("https://testnet-rpc.monad.xyz");

//   const tokenIn = "0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701";
//   const tokenOut = "0xf817257fed379853cDe0fa4F97AB987181B1E5Ea";

//   const decimalsIn = 18;

//   // ethers.parseUnits returns bigint in ethers v6
//   const amountIn = ethers.parseUnits("1", decimalsIn);

//   const path = [tokenIn, tokenOut];

//   const bestQuote = await getBestQuote(provider, amountIn, path);

//   console.log("Best router:", bestQuote.routerAddress);
//   console.log("Estimated output:", bestQuote.amountOut);
// }

// main().catch(console.error);
