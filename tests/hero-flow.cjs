async (page) => {
  for (const lang of ['es', 'en']) {
    await page.goto(`http://127.0.0.1:4322/${lang}/`);
    for (const theme of ['dark', 'light']) {
      if (await page.locator('html').getAttribute('data-theme') !== theme) await page.locator('[data-theme-toggle]').click();
      for (const width of [1440, 1024, 768, 390, 375]) {
        await page.setViewportSize({ width, height: 900 });
        const phones = page.locator('.hero-art .art-card img');
        if (await phones.count() !== 2) throw new Error('Expected two real exported examples');
        const result = await phones.evaluateAll(async images => {
          for (const image of images) await image.decode();
          return images.map(image => {
            const box = image.getBoundingClientRect();
            return { src: image.getAttribute('src'), width: image.naturalWidth, height: image.naturalHeight, left: box.left, right: box.right };
          });
        });
        if (!result.every(p => p.src.startsWith(`/hero/${lang}-`) && p.width > 1000 && p.left >= 0 && p.right <= width)) throw new Error('Wrong locale, broken image or hero image outside viewport');
        if (await page.locator('.art-phone').count()) throw new Error('Legacy CSS phone should be removed');
        if (width === 1440 || width === 390) await page.locator('.hero').screenshot({ path: `output/playwright/hero-${lang}-${theme}-${width}.png` });
      }
    }
  }
  return { localizedHeroes: 2, themes: 2, viewportWidths: [1440, 1024, 768, 390, 375], realExportAssets: true };
}
