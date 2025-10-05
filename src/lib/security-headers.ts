/**
 * Security Headers Configuration
 * 
 * This module defines security headers to protect against common web vulnerabilities.
 * These headers should be implemented at the hosting/CDN level for production deployments.
 */

export const SECURITY_HEADERS = {
  /**
   * Content Security Policy (CSP)
   * Prevents XSS attacks by controlling which resources can be loaded
   */
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net", // Required for React dev
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; '),

  /**
   * Strict-Transport-Security (HSTS)
   * Forces HTTPS connections for enhanced security
   */
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',

  /**
   * X-Content-Type-Options
   * Prevents MIME type sniffing
   */
  'X-Content-Type-Options': 'nosniff',

  /**
   * X-Frame-Options
   * Prevents clickjacking attacks
   */
  'X-Frame-Options': 'DENY',

  /**
   * X-XSS-Protection
   * Enables browser's XSS filter (legacy browsers)
   */
  'X-XSS-Protection': '1; mode=block',

  /**
   * Referrer-Policy
   * Controls how much referrer information is shared
   */
  'Referrer-Policy': 'strict-origin-when-cross-origin',

  /**
   * Permissions-Policy
   * Controls which browser features can be used
   */
  'Permissions-Policy': [
    'geolocation=()',
    'microphone=()',
    'camera=()',
    'payment=()',
  ].join(', '),
};

/**
 * Generates meta tags for client-side security headers
 * Use these in index.html when server-side headers aren't available
 */
export function getSecurityMetaTags(): string[] {
  return [
    '<meta http-equiv="X-Content-Type-Options" content="nosniff">',
    '<meta http-equiv="X-Frame-Options" content="DENY">',
    '<meta http-equiv="X-XSS-Protection" content="1; mode=block">',
    '<meta name="referrer" content="strict-origin-when-cross-origin">',
  ];
}

/**
 * Configuration instructions for popular hosting platforms
 */
export const HOSTING_CONFIGS = {
  vercel: `
// vercel.json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": ${JSON.stringify(
        Object.entries(SECURITY_HEADERS).map(([key, value]) => ({
          key,
          value,
        })),
        null,
        2
      )}
    }
  ]
}
`,

  netlify: `
// _headers file
/*
${Object.entries(SECURITY_HEADERS)
  .map(([key, value]) => `  ${key}: ${value}`)
  .join('\n')}
`,

  cloudflare: `
// Configure in Cloudflare dashboard:
// Rules > Transform Rules > Modify Response Header
${Object.entries(SECURITY_HEADERS)
  .map(([key, value]) => `Set "${key}": "${value}"`)
  .join('\n')}
`,
};
