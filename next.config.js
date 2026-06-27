/** @type {import('next').NextConfig} */
const nextConfig = {
  // better-sqlite3 là native module, cần opt out khỏi bundling server-side
  // Next 14 dùng key experimental, Next 15+ dùng top-level
  experimental: {
    serverComponentsExternalPackages: ['better-sqlite3'],
  },
};

module.exports = nextConfig;
