async (page) => {
  const fallback = await page.context().newPage();
  try {
    await fallback.addInitScript(() => { Object.defineProperty(navigator, 'gpu', { value: undefined }); });
    await fallback.goto('http://127.0.0.1:4322/es/');
    await fallback.locator('input[type=file]').setInputFiles('output/playwright/fixtures/screen-1.png');
    await fallback.getByRole('checkbox', { name: 'Usar IA local' }).check();
    await fallback.getByRole('button', { name: 'Generar capturas', exact: true }).click();
    await fallback.getByRole('button', { name: 'Usar plantilla sin IA' }).waitFor();
    await fallback.getByRole('button', { name: 'Usar plantilla sin IA' }).click();
    await fallback.getByRole('button', { name: 'Generar capturas', exact: true }).click();
    await fallback.getByRole('button', { name: 'Descargar ZIP', exact: true }).waitFor();
    if (!(await fallback.locator('.result-mode').innerText()).includes('sin IA')) throw new Error('Template result must be explicitly labeled');
    await fallback.getByRole('textbox', { name: 'Primary hex', exact: true }).fill('invalid');
    await fallback.getByRole('button', { name: 'Generar capturas', exact: true }).click();
    if (!(await fallback.getByRole('alert').innerText()).includes('hexadecimal')) throw new Error('Invalid colors must block export');
    await fallback.getByRole('textbox', { name: 'Primary hex', exact: true }).fill('');
    await fallback.getByRole('button', { name: 'Generar capturas', exact: true }).click();
    await fallback.getByRole('button', { name: 'Cancelar', exact: true }).click();
    await fallback.getByRole('button', { name: 'Generar capturas', exact: true }).waitFor();
    if (await fallback.locator('.result-grid').count()) throw new Error('Cancelled export must not expose partial results');
    return { noGpuFallback: true, explicitTemplateLabel: true, invalidColorsRejected: true, cancelTemplate: true };
  } finally { await fallback.close(); }
}
