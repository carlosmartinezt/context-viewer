import type { NextConfig } from 'next'

/**
 * The security headers the old server sent on every response, kept here so
 * they stay one list rather than being sprinkled through the routes.
 *
 * The workbench relaxation is the same one as before and for the same reason:
 * notes carry their own inline styles, their own <style>, and occasionally a
 * <script>. It applies to every path that can render a note, which is every
 * page. The API and the asset routes are matched separately and stay strict.
 */
const STRICT =
  "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; " +
  "object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'"

// Next's dev server needs eval for hot reloading. Production does not, and
// the built app is what faces the internet, so the exception is dev-only.
const dev = process.env.NODE_ENV !== 'production'

// Shared between the workbench pages and the framed document. They differ in
// one directive only: who is allowed to frame them.
const WORKBENCH_BODY =
  "default-src 'self'; " +
  // cdnjs.cloudflare.com: where notes load libraries such as Chart.js from.
  // Add a host only when a note actually needs it.
  `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ''} https://cdnjs.cloudflare.com; ` +
  "style-src 'self' 'unsafe-inline'; img-src 'self' data:; object-src 'none'; " +
  "base-uri 'none'; form-action 'self';"

const WORKBENCH = `${WORKBENCH_BODY} frame-ancestors 'none'`

const base = [
  { key: 'cache-control', value: 'no-store' },
  { key: 'x-content-type-options', value: 'nosniff' },
  { key: 'x-frame-options', value: 'DENY' },
  // 'same-origin', not 'no-referrer': Chrome ties the Origin header on a
  // same-origin form POST to the referrer policy, and 'no-referrer' made every
  // form in this app send `Origin: null`.
  { key: 'referrer-policy', value: 'same-origin' },
  { key: 'x-robots-tag', value: 'noindex, nofollow, noarchive, nosnippet' },
]

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Standalone emits .next/standalone/server.js with only the node_modules the
  // app actually reaches, so what gets served can live in ~/public with no
  // source tree and no npm install beside it. See ops/build.sh.
  output: 'standalone',
  /**
   * The served tree is read at runtime, so on a platform that ships only the
   * files it can trace from imports (Vercel and anything else serverless) the
   * tree has to be named here or it is simply not there. It applies to the
   * standalone build on the box for the same reason. Only `sample/` is listed:
   * it is the one tree that travels with the code, for a demo instance. A real
   * deployment points ROOT_DIR at a directory on its own disk, which no bundler
   * can or should try to include.
   */
  outputFileTracingIncludes: {
    '/**': ['./sample/**'],
  },
  // Server Actions check Origin against Host themselves. Behind Caddy the
  // forwarded Host is what the browser actually asked for, and PUBLIC_ORIGIN
  // is the one value that does not depend on a header a proxy controls, so it
  // is named here too when it is set.
  experimental: {
    serverActions: process.env.PUBLIC_ORIGIN
      ? { allowedOrigins: [process.env.PUBLIC_ORIGIN.replace(/^https?:\/\//, '')] }
      : undefined,
  },
  /**
   * A note in its frame is a real page, so the stylesheet and script it links
   * have to load. Its links are absolute paths into the tree (/static/x.css),
   * which would otherwise match the catch-all page route and come back as a
   * workbench page. beforeFiles, because the catch-all matches everything and
   * an afterFiles rewrite would never fire; the exclusions keep the app's own
   * assets, its API and its two document routes out of it.
   *
   * sw.js is excluded by name. It ends in .js and does not live under _ctx, so
   * without this the service worker request is rewritten into the served tree
   * and Chrome is handed whatever sw.js the user happens to have in there,
   * instead of ours. It has to stay at the root: a worker's scope is the
   * directory it is served from, and this one needs the whole site.
   */
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/:path((?!_ctx/|_next/|sw\\.js).*\\.(?:css|js|mjs|woff2?|ico))',
          destination: '/_ctx/file/:path',
        },
      ],
      afterFiles: [],
      fallback: [],
    }
  },

  async headers() {
    return [
      // Order does not decide this: every matching rule contributes a header,
      // and two content-security-policy headers are enforced as their
      // intersection. So the patterns are made mutually exclusive instead, and
      // the catch-all excludes by name everything that must stay strict.
      // The document route is the one thing that may be framed, and only by
      // us: it is what the workbench puts in its document pane. DENY here
      // (which is what every other route sends) blocks same-origin framing
      // too, so the pane came up empty with a broken-document icon.
      {
        source: '/_ctx/doc/:path*',
        headers: [
          ...base.filter((h) => h.key !== 'x-frame-options'),
          { key: 'x-frame-options', value: 'SAMEORIGIN' },
          { key: 'content-security-policy', value: `${WORKBENCH_BODY} frame-ancestors 'self'` },
        ],
      },
      { source: '/_ctx/api/:path*', headers: [...base, { key: 'content-security-policy', value: STRICT }] },
      { source: '/_ctx/assets/:path*', headers: [...base, { key: 'content-security-policy', value: STRICT }] },
      { source: '/_ctx/login', headers: [...base, { key: 'content-security-policy', value: STRICT }] },
      { source: '/_ctx/setup', headers: [...base, { key: 'content-security-policy', value: STRICT }] },
      {
        // Only the strict paths are excluded, not all of _ctx: /_ctx/settings
        // and /_ctx/components are workbench pages and need the relaxed policy
        // like any other. "setup" and "settings" diverge at the fourth
        // character, so excluding one does not exclude the other.
        source: '/((?!_ctx/api|_ctx/assets|_ctx/doc|_ctx/login|_ctx/setup).*)',
        headers: [...base, { key: 'content-security-policy', value: WORKBENCH }],
      },
    ]
  },
}

export default nextConfig
