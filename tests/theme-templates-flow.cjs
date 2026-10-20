async (page) => {
  const assert = (value, message) => { if (!value) throw new Error(message); };
  const rootTheme = () => page.locator('html').getAttribute('data-theme');
  await page.goto('http://127.0.0.1:4322/es/');
  await page.evaluate(() => localStorage.removeItem('storeframe-theme'));
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
  await page.reload();
  assert(await rootTheme() === 'dark', 'First visit defaults to dark even with a light system preference');
  await page.setViewportSize({ width: 1360, height: 1000 });
  await page.screenshot({ path: 'output/playwright/theme-dark-home.png' });
  const toggle = page.getByRole('button', { name: 'Modo oscuro', exact: true });
  await toggle.click();
  assert(await rootTheme() === 'light', 'Theme changes immediately');
  await page.reload();
  assert(await rootTheme() === 'light', 'Light choice survives reload');
  assert(await toggle.getAttribute('aria-pressed') === 'false', 'Accessible toggle matches light theme');
  await page.goto('http://127.0.0.1:4322/en/privacy/');
  assert(await rootTheme() === 'light', 'Preference follows language and information pages');
  await page.getByRole('button', { name: 'Dark mode', exact: true }).click();
  await page.goto('http://127.0.0.1:4322/es/');
  assert(await rootTheme() === 'dark', 'Dark choice survives page navigation');
  const failures = [];
  page.on('pageerror', error => failures.push(error.message));
  const requests = [];
  page.on('request', req => requests.push({ url: req.url(), method: req.method() }));
  await page.getByRole('checkbox', { name: 'iOS / iPhone' }).check();
  await page.locator('input[type=file]').setInputFiles(['output/playwright/fixtures/screen-1.png', 'output/playwright/fixtures/screen-2.png']);
  await page.locator('.shot-card').nth(1).waitFor();
  await page.getByRole('textbox', { name: 'Nombre de la app opcional' }).fill('Marca');
  await page.getByRole('textbox', { name: 'Primary hex', exact: true }).fill('#1234ab');
  await page.getByRole('textbox', { name: 'Secondary hex', exact: true }).fill('#f0cb42');
  await page.getByRole('textbox', { name: 'Texto de esta captura 1', exact: true }).fill('Tu marca, en primer plano.');
  await page.getByRole('textbox', { name: 'Texto de esta captura 2', exact: true }).fill('También en horizontal.');
  const generate = async (name) => {
    await page.getByRole('button', { name: 'Generar capturas', exact: true }).click();
    await page.getByRole('button', { name: 'Descargar ZIP', exact: true }).waitFor({ timeout: 60000 });
    const pending = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Descargar ZIP', exact: true }).click();
    await (await pending).saveAs(`output/playwright/template-${name}.zip`);
  };
  for (const [style, label] of [['clean', 'Limpio'], ['gradient', 'Degradado'], ['editorial', 'Editorial']]) {
    await page.getByRole('button', { name: new RegExp('^' + label) }).click();
    assert(await page.locator('.result-grid').count() === 0, 'Style edit invalidates exports');
    await generate(style);
  }
  await page.locator('.settings-panel').first().screenshot({ path: 'output/playwright/theme-dark-settings.png' });
  await toggle.click();
  assert(await page.locator('.result-grid figure').count() === 4, 'Theme changes retain the project and outputs');
  await generate('editorial-light');
  await page.locator('.settings-panel').first().screenshot({ path: 'output/playwright/theme-light-settings.png' });
  const sibling = await page.context().newPage();
  await sibling.goto('http://127.0.0.1:4322/en/');
  await sibling.getByRole('button', { name: 'Dark mode', exact: true }).click();
  await page.waitForFunction(() => document.documentElement.dataset.theme === 'dark');
  await sibling.close();
  for (const width of [375, 390]) {
    await page.setViewportSize({ width, height: 844 });
    assert(await page.locator('.site-header').evaluate(el => el.scrollWidth <= el.clientWidth), 'Mobile theme and language controls fit');
  }
  await page.screenshot({ path: 'output/playwright/theme-dark-mobile.png' });
  assert(!failures.length, 'No runtime errors: ' + failures.join(', '));
  assert(requests.every(r => r.method === 'GET' || r.method === 'HEAD'), 'Templates make no upload requests');
  assert(requests.every(r => r.url.startsWith('http://127.0.0.1:4322/') || r.url.startsWith('blob:')), 'Templates stay on-origin');
  const blocked = await page.context().newPage();
  try {
    await blocked.addInitScript(() => {
      Storage.prototype.getItem = () => { throw new DOMException('Blocked', 'SecurityError'); };
      Storage.prototype.setItem = () => { throw new DOMException('Blocked', 'SecurityError'); };
    });
    await blocked.goto('http://127.0.0.1:4322/es/');
    assert(await blocked.locator('html').getAttribute('data-theme') === 'dark', 'Blocked storage defaults to dark');
    await blocked.getByRole('button', { name: 'Modo oscuro', exact: true }).click();
    assert(await blocked.locator('html').getAttribute('data-theme') === 'light', 'Theme works when persistence is blocked');
  } finally { await blocked.close(); }
  return { themes: true, persistence: true, storageBlocked: true, crossTab: true, downloadedPngs: 16, gpuInference: false };
}
