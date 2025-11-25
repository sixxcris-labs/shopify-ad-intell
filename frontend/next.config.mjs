/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@shopify-ad-intelligence/common"],
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4311"}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
