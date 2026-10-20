async (page) => {
  await page.goto('http://127.0.0.1:4322/es/');
  await page.setViewportSize({ width: 1360, height: 1000 });
  await page.getByRole('checkbox', { name: 'iOS / iPhone' }).check();
  await page.getByRole('radio', { name: 'iPhone 17', exact: true }).check();
  await page.getByRole('button', { name: 'Probar con un ejemplo', exact: true }).click();
  await page.locator('.shot-card').waitFor();
  await page.getByRole('button', { name: 'Generar capturas', exact: true }).click();
  await page.getByRole('button', { name: 'Descargar ZIP', exact: true }).waitFor({ timeout: 60000 });
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Descargar ZIP', exact: true }).click();
  await (await pending).saveAs('output/playwright/device-appearance.zip');
  await page.locator('.result-grid').screenshot({ path: 'output/playwright/device-appearance-grid.png' });
  await page.locator('.device-panel').screenshot({ path: 'output/playwright/device-picker-desktop.png' });
  const sheet = await page.evaluate(async () => {
    const canvas = document.createElement('canvas'); canvas.width = 800; canvas.height = 930;
    const ctx = canvas.getContext('2d'); ctx.fillStyle = '#f6f6f1'; ctx.fillRect(0, 0, 800, 930);
    const images = [...document.querySelectorAll('.result-grid img')];
    const models = [{ name: 'Samsung Galaxy S26', width: 71.7, height: 149.6 }, { name: 'iPhone 17', width: 71.5, height: 149.6 }];
    for (let i = 0; i < images.length; i++) {
      const image = images[i]; await image.decode(); const model = models[i];
      const scale = Math.min(image.naturalWidth * .78 / model.width, image.naturalHeight * .70 / model.height);
      const w = model.width * scale, h = model.height * scale;
      const sx = (image.naturalWidth - w) / 2 - 15, sy = image.naturalHeight * .09 - 15;
      const ratio = Math.min(358 / (w + 30), 840 / (h + 30));
      const dw = (w + 30) * ratio, dh = (h + 30) * ratio;
      ctx.fillStyle = '#27312c'; ctx.font = '600 20px Arial'; ctx.textAlign = 'center'; ctx.fillText(model.name, 200 + i * 400, 35);
      ctx.drawImage(image, sx, sy, w + 30, h + 30, 200 + i * 400 - dw / 2, 65, dw, dh);
    }
    const data = canvas.toDataURL('image/png'); canvas.width = canvas.height = 0; return data;
  });
  await page.setContent(`<body style="margin:0"><img alt="Phone frame samples" src="${sheet}" style="display:block"></body>`);
  await page.locator('img').screenshot({ path: 'output/playwright/mockup-preview.png' });
}
