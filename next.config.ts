/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  // 🛡️ الضربة القاضية: إجبار السيرفر على تمرير روابط الداش بورد من خلال الميدلوير
  async rewrites() {
    return [
      {
        source: '/dashboard/:path*',
        destination: '/dashboard/:path*', 
      },
    ];
  },
};

export default nextConfig;