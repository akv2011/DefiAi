import { cErc20Abi } from "@/abi/cErc20";

export const abis = {
  cToken: cErc20Abi,
  // Add other ABIs here as needed
} as const;

export type AbiName = keyof typeof abis;
