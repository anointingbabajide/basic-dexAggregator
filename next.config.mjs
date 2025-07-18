// next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "imagedelivery.net",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "s2.coinmarketcap.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "docs.monad.xyz",
        port: "",
        pathname: "/**",
      },
    ],
  },
  webpack(config) {
    config.optimization.minimizer = config.optimization.minimizer.map(
      (plugin) => {
        if (plugin.constructor.name === "TerserPlugin") {
          plugin.options.exclude = /HeartbeatWorker/;
        }
        return plugin;
      }
    );
    return config;
  },
};

export default nextConfig;
