const renderOrigin = process.env.RENDER_API_ORIGIN?.replace(/\/$/, '');

if (!renderOrigin) {
  throw new Error('Set RENDER_API_ORIGIN in Vercel to the origin of your Render API service.');
}

const parsedOrigin = new URL(renderOrigin);
if (parsedOrigin.protocol !== 'https:') {
  throw new Error('RENDER_API_ORIGIN must use https://.');
}

export const config = {
  framework: 'vite',
  buildCommand: 'npm run build',
  outputDirectory: 'dist',
  rewrites: [
    {
      source: '/api/v1/:path*',
      destination: `${renderOrigin}/api/v1/:path*`,
    },
    {
      source: '/(.*)',
      destination: '/index.html',
    },
  ],
  // Authenticated case and session responses must not be cached by the proxy.
  headers: [
    {
      source: '/api/v1/:path*',
      headers: [{ key: 'x-vercel-enable-rewrite-caching', value: '0' }],
    },
  ],
};
