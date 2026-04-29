import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel gère automatiquement le déploiement
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,

  // Headers de sécurité pour la production
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
