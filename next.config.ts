import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // El overlay de dev tapaba la primera tab de la bottom nav en local.
  devIndicators: false,
};

export default nextConfig;
