/** @type {import('next').NextConfig} */

// Cabeceras de seguridad aplicadas a todas las rutas. Gratis y de alto
// valor: mitigan clickjacking, sniffing de MIME, fuga de referrer y
// fuerzan HTTPS. Ajusta la CSP cuando integres dominios externos (mapas,
// analítica, etc.) — hoy se omite la CSP para no romper el demo.
const securityHeaders = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

module.exports = nextConfig;
