/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use custom server (server.js) — disable Next.js built-in server
  output: undefined,
  experimental: {
    serverComponentsExternalPackages: [],
  },
};

export default nextConfig;
