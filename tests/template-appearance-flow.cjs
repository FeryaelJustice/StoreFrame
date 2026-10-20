async (page) => {
  await page.goto('http://127.0.0.1:4322/es/');
  await page.setViewportSize({ width: 1100, height: 760 });
  await page.getByRole('button', { name: 'Probar con un ejemplo', exact: true }).click();
  await page.locator('.shot-card').waitFor();
  await page.getByRole('textbox', { name: 'Nombre de la app opcional' }).fill('Tu marca');
  await page.getByRole('textbox', { name: 'Primary hex', exact: true }).fill('#244d42');
  await page.getByRole('textbox', { name: 'Secondary hex', exact: true }).fill('#d9c38b');
  await page.getByRole('textbox', { name: 'Texto de esta captura 1', exact: true }).fill('Diseñado para destacar.');
  const previews = [];
  for (const label of ['Limpio', 'Degradado', 'Editorial']) {
    await page.getByRole('button', { name: new RegExp('^' + label) }).click();
    await page.getByRole('button', { name: 'Generar capturas', exact: true }).click();
    await page.getByRole('button', { name: 'Descargar ZIP', exact: true }).waitFor({ timeout: 60000 });
    const src = await page.locator('.result-grid img').evaluate(async image => {
      await image.decode(); const canvas = document.createElement('canvas'); canvas.width = 360; canvas.height = 640;
      canvas.getContext('2d').drawImage(image, 0, 0, 360, 640);
      const result = canvas.toDataURL('image/png'); canvas.width = canvas.height = 0; return result;
    });
    previews.push({ label, src });
  }
  await page.setContent(`<body style="margin:0;padding:20px;background:#111814;color:#e7eee6;font:16px Arial;display:flex;gap:20px">${previews.map(({ label, src }) => `<figure style="margin:0"><figcaption style="padding:0 0 15px;font-weight:600">${label}</figcaption><img alt="${label}" src="${src}" style="display:block;width:320px;height:auto;border-radius:6px"></figure>`).join('')}</body>`);
  await page.screenshot({ path: 'output/playwright/templates-preview.png', fullPage: true });
}
