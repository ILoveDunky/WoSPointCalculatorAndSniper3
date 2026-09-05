import type {NextConfig} from 'next';
import { BASE_PATH } from './src/lib/site-config';

const nextConfig: NextConfig = {
  /* config options here */
  output: 'export',
  distDir: 'docs',
  basePath: BASE_PATH,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
