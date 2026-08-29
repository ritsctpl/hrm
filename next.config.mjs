/** @type {import('next').NextConfig} */

// In a WebClaude session preview the platform supplies BE_PREVIEW_ORIGIN, pointing at
// the backend built from *this* worktree. Without this rewrite the app's axios baseURL
// is the shared gateway, so the frontend can only ever be tested against mainline —
// session backend changes are unreachable, and a multipart upload cannot be exercised
// at all. Outside a preview the variable is unset and nothing below changes.
const bePreviewOrigin = process.env.BE_PREVIEW_ORIGIN;
const gatewayApiBase =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://192.168.147.129:8080/app/v1';

const nextConfig = {
  basePath: '/hrm',
  reactStrictMode: false,
  output: 'standalone',
  productionBrowserSourceMaps: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  async rewrites() {
    if (!bePreviewOrigin) {
      return [];
    }

    return [
      // Only this session's service comes from the session backend...
      {
        source: '/session-api/hrm-service/:path*',
        destination: `${bePreviewOrigin}/app/v1/hrm-service/:path*`,
      },
      // ...everything else still goes to the shared gateway, so screens that call
      // other services keep working.
      {
        source: '/session-api/:path*',
        destination: `${gatewayApiBase}/:path*`,
      },
    ];
  },
};

export default nextConfig;
