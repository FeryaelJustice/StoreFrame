async (page) => {
  await page.goto('http://127.0.0.1:4322/es/');
  await page.getByRole('textbox', { name: 'Nombre de la app opcional' }).fill('StoreFrame AI');
  await page.locator('input[type=file]').setInputFiles('output/playwright/fixtures/screen-1.png');
  await page.getByRole('textbox', { name: 'Texto de esta captura 1', exact: true }).waitFor();
  await page.getByRole('textbox', { name: 'Texto de esta captura 1', exact: true }).fill('Tu app, en su mejor escenario.');
  await page.getByRole('checkbox', { name: 'iOS / iPhone' }).check();
  await page.getByRole('checkbox', { name: 'Usar IA local' }).check();
  await page.getByRole('button', { name: 'Generar capturas', exact: true }).click();
  await page.getByRole('button', { name: 'Cancelar', exact: true }).waitFor();
  return { started: true, status: await page.locator('.generation-progress').innerText() };
}
