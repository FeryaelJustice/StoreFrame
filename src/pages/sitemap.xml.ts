import type { APIRoute } from 'astro';
import { pageSlugs } from '../lib/pages';
export const GET: APIRoute = ({ site }) => {
  const paths = ['/', ...(['es', 'en'] as const).flatMap(lang => [`/${lang}/`, ...Object.values(pageSlugs[lang]).map(page => `/${lang}/${page}/`)])];
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map(path => `<url><loc>${new URL(path, site).href}</loc></url>`).join('')}</urlset>`, { headers: { 'Content-Type': 'application/xml' } });
};
