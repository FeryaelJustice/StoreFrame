async (page) => {
  const failed = await page.context().newPage();
  try {
    await failed.route('https://huggingface.co/**', route => route.abort('failed'));
    await failed.goto('http://127.0.0.1:4322/es/');
    await failed.getByRole('textbox', { name: 'Nombre de la app opcional' }).fill('Retained app');
    await failed.locator('input[type=file]').setInputFiles('output/playwright/fixtures/screen-1.png');
    const caption = failed.getByRole('textbox', { name: 'Texto de esta captura 1', exact: true });
    await caption.fill('Conservar este texto');
    await failed.getByRole('checkbox', { name: 'Usar IA local' }).check();
    await failed.getByRole('button', { name: 'Generar capturas', exact: true }).click();
    await failed.getByRole('alert').waitFor({ timeout: 45000 });
    if (await caption.inputValue() !== 'Conservar este texto') throw new Error('AI failure lost caption');
    if (await failed.getByRole('textbox', { name: 'Nombre de la app opcional' }).inputValue() !== 'Retained app') throw new Error('AI failure lost app name');
    if (await failed.locator('.shot-card').count() !== 1) throw new Error('AI failure lost screenshot');
    await failed.getByText('Detalle del error de IA', { exact: true }).click();
    if (!(await failed.locator('details[open]').innerText()).includes('fetch')) throw new Error('Expected actual network diagnostic');
    await failed.getByRole('button', { name: 'Usar plantilla sin IA' }).click();
    await failed.getByRole('button', { name: 'Generar capturas', exact: true }).click();
    await failed.getByRole('button', { name: 'Descargar ZIP', exact: true }).waitFor();
    return { networkFailureRetainsForm: true, diagnosticVisible: true, explicitTemplateRecovery: true };
  } finally { await failed.close(); }
}
