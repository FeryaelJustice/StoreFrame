async (page) => {
  const paths = {
    es: ['privacidad', 'aviso-legal', 'sobre-nosotros', 'herramienta', 'licencias'],
    en: ['privacy', 'legal', 'about', 'tool', 'licenses'],
  };
  const receipt = [];
  for (const lang of ['es', 'en']) {
    for (const path of ['', ...paths[lang].map(p => p + '/')]) {
      const url = `http://127.0.0.1:4322/${lang}/${path}`;
      const response = await page.goto(url);
      if (response.status() !== 200) throw new Error(`Missing page: ${url}`);
      const data = await page.evaluate(() => ({ lang: document.documentElement.lang, h1: document.querySelector('h1')?.textContent, alternate: document.querySelector('link[rel=alternate]')?.getAttribute('href'), overflow: document.documentElement.scrollWidth > innerWidth }));
      if (data.lang !== lang || !data.h1 || data.overflow) throw new Error(`Invalid page: ${url}`);
      receipt.push({ url, ...data });
    }
  }
  const headers = await page.request.get('http://127.0.0.1:4322/runtime/ort/ort-wasm-simd-threaded.wasm', { method: 'HEAD' });
  if (!headers.headers()['content-type'].includes('application/wasm')) throw new Error('Invalid WASM MIME');
  const isolated = await page.evaluate(() => crossOriginIsolated);
  if (!isolated) throw new Error('Isolation headers are missing');
  await page.goto('http://127.0.0.1:4322/en/');
  await page.setViewportSize({ width: 375, height: 812 });
  await page.screenshot({ path: 'output/playwright/mobile-home.png' });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.getByRole('link', { name: 'Design my screenshots' }).click();
  await page.screenshot({ path: 'output/playwright/mobile-studio.png' });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('http://127.0.0.1:4322/es/');
  await page.screenshot({ path: 'output/playwright/desktop-home.png' });
  return { pages: receipt.length, isolated, allPages: receipt };
}
