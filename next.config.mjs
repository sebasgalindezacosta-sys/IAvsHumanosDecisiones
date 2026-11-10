/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // pg solo se usa si la base es un Postgres local (localhost). En Vercel se usa el driver HTTP de Neon.
  serverExternalPackages: ["pg"],
  async headers() {
    return [{ source: "/(.*)", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] }];
  },
};

export default nextConfig;
