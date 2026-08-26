/** @type {import('next').NextConfig} */
const securityHeaders = [
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
  {
    // REPORT-ONLY: this observes and never blocks. To enforce, change the key to
    // 'Content-Security-Policy' — but smoke-test the app in a browser first
    // (lesson editor, tutor stream, dashboard charts), because a missing origin
    // here white-screens the page rather than degrading.
    //
    // Origins below are BROWSER destinations only. Judge0, Anthropic and Gemini
    // are called server-side from route handlers, so they are deliberately absent
    // — CSP does not govern server fetches and listing them implied otherwise.
    key: 'Content-Security-Policy-Report-Only',
    value: [
      "default-src 'self'",
      // 'unsafe-eval' is required by the Monaco editor.
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "worker-src 'self' blob:",
      [
        "connect-src 'self'",
        'https://*.supabase.co',
        'wss://*.supabase.co',
        // Statsig SDK: config fetch, event logging, CDN.
        'https://*.statsigapi.net',
        'https://featureassets.org',
        'https://prodregistryv2.org',
        'https://api.statsigcdn.com',
        // Vercel Analytics + Speed Insights (beacons post to same-origin /_vercel/*).
        'https://va.vercel-scripts.com',
      ].join(' '),
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  },
];

const nextConfig = {
  reactStrictMode: true,
  experimental: {
    staleTimes: {
      dynamic: 0,
    },
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
