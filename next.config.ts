/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  outputFileTracingExcludes: {
    "*": [
      "node_modules/@swc/core-linux-x64-gnu",
      "node_modules/@swc/core-linux-x64-musl",
      "node_modules/@esbuild/linux-x64",
      "node_modules/webpack",
      "node_modules/sharp",
      "node_modules/.pnpm/@swc+core-*",
      "node_modules/.pnpm/sharp@*",
    ],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "assets.coingecko.com" },
      { protocol: "https", hostname: "static.debank.com" },
      { protocol: "https", hostname: "raw.githubusercontent.com" },
      { protocol: "https", hostname: "optimistic.etherscan.io" },
      { protocol: "https", hostname: "superfluid-finance.github.io" },
      { protocol: "https", hostname: "coin-images.coingecko.com" },
    ],
  },
};

export default nextConfig;
