async (page) => {
  await page.goto('http://127.0.0.1:4322/es/');
  const assert = (value, message) => { if (!value) throw new Error(message); };
  const requests = [];
  page.on('request', req => requests.push({ method: req.method(), url: req.url() }));
  await page.getByRole('checkbox', { name: 'iOS / iPhone' }).check();
  assert(await page.getByRole('radio').count() === 7, 'Seven verified device choices');
  await page.locator('input[type=file]').setInputFiles(['output/playwright/fixtures/screen-1.png', 'output/playwright/fixtures/screen-2.png']);
  await page.locator('.shot-card').nth(1).waitFor();
  await page.getByRole('textbox', { name: 'Texto de esta captura 1', exact: true }).fill('Marco vertical completo.');
  await page.getByRole('textbox', { name: 'Texto de esta captura 2', exact: true }).fill('Marco horizontal completo.');
  const android = ['Samsung Galaxy S26', 'Google Pixel 8', 'Google Pixel 7', 'Samsung Galaxy S26'];
  const ios = ['iPhone 12', 'iPhone 15', 'iPhone 17', 'iPhone 18 Pro'];
  for (let i = 0; i < 4; i++) {
    await page.getByRole('radio', { name: android[i], exact: true }).check();
    await page.getByRole('radio', { name: ios[i], exact: true }).check();
    assert(await page.locator('.result-grid').count() === 0, 'Device changes invalidate outputs');
    await page.getByRole('button', { name: 'Generar capturas', exact: true }).click();
    await page.getByRole('button', { name: 'Descargar ZIP', exact: true }).waitFor({ timeout: 60000 });
    assert(await page.locator('.result-grid figure').count() === 4, 'Both orientations on both platforms');
    const pending = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Descargar ZIP', exact: true }).click();
    await (await pending).saveAs(`output/playwright/devices-${i}.zip`);
  }
  await page.getByRole('radio', { name: 'Google Pixel 8', exact: true }).check();
  assert(await page.locator('.result-grid').count() === 0, 'Final edit invalidates exports');
  await page.getByRole('checkbox', { name: 'Usar IA local', exact: true }).check();
  assert(await page.getByRole('radio', { name: 'Google Pixel 8', exact: true }).isChecked(), 'AI opt-in retains Android model');
  assert(await page.getByRole('radio', { name: 'iPhone 18 Pro', exact: true }).isChecked(), 'AI opt-in retains iOS model');
  await page.getByRole('checkbox', { name: 'Usar IA local', exact: true }).uncheck();
  await page.getByRole('checkbox', { name: 'iOS / iPhone' }).uncheck();
  assert(await page.getByRole('radio').count() === 3, 'Only enabled platform choices are shown');
  await page.getByRole('checkbox', { name: 'iOS / iPhone' }).check();
  assert(await page.getByRole('radio', { name: 'iPhone 18 Pro', exact: true }).isChecked(), 'Platform toggles retain device');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('heading', { name: 'Elige tus móviles' }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'output/playwright/devices-mobile.png' });
  assert(await page.locator('.device-panel').evaluate(el => el.scrollWidth <= el.clientWidth), 'Device picker has no horizontal overflow');
  assert(requests.every(r => r.method === 'GET' || r.method === 'HEAD'), 'No upload methods');
  assert(requests.every(r => r.url.startsWith('http://127.0.0.1:4322/') || r.url.startsWith('blob:')), 'No third-party template requests');
  await page.goto('http://127.0.0.1:4322/en/');
  await page.getByRole('heading', { name: 'Choose your phones' }).waitFor();
  await page.getByRole('checkbox', { name: 'iOS / iPhone' }).check();
  assert(await page.getByRole('group', { name: 'iOS phone', exact: true }).count() === 1, 'English accessible group');
  console.log(JSON.stringify({ success: true, models: 7, downloadedPngs: 16, realInference: false }));
}
