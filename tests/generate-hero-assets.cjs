async (page) => {
  // Regenerate the static hero from the real editor and its actual RGB PNG exports.
  for (const lang of ['es', 'en']) {
    const es = lang === 'es';
    for (const platform of ['Android', 'iOS']) {
      await page.goto(`http://127.0.0.1:4322/${lang}/`);
      await page.getByRole('button', { name: es ? 'Probar con un ejemplo' : 'Try an example', exact: true }).click();
      await page.locator('.shot-card').waitFor();
      if (platform === 'iOS') {
        await page.getByRole('checkbox', { name: 'iOS / iPhone' }).check();
        await page.getByRole('checkbox', { name: 'Android', exact: true }).uncheck();
      }
      await page.getByRole('textbox', { name: es ? 'Nombre de la app opcional' : 'App name optional' }).fill('a little calm');
      await page.getByRole('textbox', { name: 'Primary hex', exact: true }).fill(platform === 'Android' ? '#1e4038' : '#526a48');
      await page.getByRole('textbox', { name: 'Secondary hex', exact: true }).fill(platform === 'Android' ? '#93ab80' : '#e2d4a5');
      const label = platform === 'Android' ? (es ? 'Degradado' : 'Gradient') : 'Editorial';
      await page.getByRole('button', { name: new RegExp('^' + label) }).click();
      await page.getByRole('textbox', { name: es ? 'Texto de esta captura 1' : 'Screenshot caption 1', exact: true }).fill(platform === 'Android' ? (es ? 'Tu día, con más calma.' : 'Your day, a little calmer.') : (es ? 'Todo lo que importa,\nen un solo lugar.' : 'Everything that matters,\nin one place.'));
      await page.getByRole('button', { name: es ? 'Generar capturas' : 'Generate screenshots', exact: true }).click();
      await page.getByRole('button', { name: es ? 'Descargar ZIP' : 'Download ZIP', exact: true }).waitFor({ timeout: 60000 });
      const pending = page.waitForEvent('download');
      await page.locator('.result-grid figure a').click();
      await (await pending).saveAs(`public/hero/${lang}-${platform === 'Android' ? 'android' : 'ios'}.png`);
    }
  }
  return { source: 'Real local-template PNG exports', localizedAssets: 4 };
}
