/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  productionBrowserSourceMaps: false,
  experimental: {
    webpackBuildWorker: true,
    parallelServerBuildTraces: true,
    parallelServerCompiles: true,
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
